import { glob } from 'glob';
import { runCLICommand } from './cmd';
import { env } from './env';
import { nodeModulesDirectoryExist } from './findNodeModules';
import { findServerlessYaml } from './findServerlessYaml';
import { injectCfnRole } from './injectCfnRole';
import { uploadDeploymentBadge } from './uploadDeploymentBadge';

const cloneDir = process.env.BITBUCKET_CLONE_DIR || '';

async function main() {
    let deploymentStatus = false;

    try {
        const rootServerlessYmlFile = await glob(
            `${cloneDir}/serverless.{yml,yaml}`,
            {}
        );
        const nxProject = rootServerlessYmlFile.length == 0;

        if (!env.awsAccessKeyId || !env.awsSecretAccessKey) {
            throw new Error(
                'AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set'
            );
        }

        const servicesPath = nxProject ? env.servicesPath : '';
        let serverlessFiles = await findServerlessYaml(
            `${cloneDir}${servicesPath}`
        );

        await Promise.all(
            serverlessFiles.map((file) => injectCfnRole(file, env.cfnRole))
        );

        const commands = [
            `npx serverless config credentials --provider aws --profile ${env.profile} --key ${env.awsAccessKeyId} --secret ${env.awsSecretAccessKey}`,
        ];

        const nodeModulesExists = await nodeModulesDirectoryExist(cloneDir);
        if (!nodeModulesExists) {
            commands.unshift('npm ci');
        }

        const nxCommand = nxProject
            ? `npx nx run-many -t ${env.cmd} --`
            : `npx serverless ${env.cmd}`;
        const verboseOption = env.debug ? '--verbose' : '';
        const serverlessCommand = `${nxCommand} --stage ${env.stage} --aws-profile ${env.profile}${verboseOption}`;

        commands.push(serverlessCommand);

        await runCLICommand(commands);

        deploymentStatus = true;
    } catch (error) {
        console.log(
            'Deployment failed! Please check the logs for more details.Error:',
            error as Error
        );
        deploymentStatus = false;
    } finally {
        const statusCode = await uploadDeploymentBadge(deploymentStatus);
        process.exit(statusCode);
    }
}

// Execute the main function
main();
