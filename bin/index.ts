import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { runCLICommand } from '../lib/cmd';
import { env } from '../lib/env';
import { nodeModulesDirectoryExist } from '../lib/findNodeModules';
import { findServerlessYaml } from '../lib/findServerlessYaml';
import { injectCfnRole } from '../lib/injectCfnRole';
import {
    detectPackageManager,
    getInstallCommand,
} from '../lib/packageManagers';
import { isNxServerlessMonorepo } from '../lib/serverlessProjectType';
import { uploadDeploymentBadge } from '../lib/uploadDeploymentBadge';

async function main() {
    let deploymentStatus = false;

    try {
        const {
            awsAccessKeyId,
            awsSecretAccessKey,
            bitbucketCloneDir,
            cfnRole,
            cmd,
            debug,
            profile,
            servicesPath,
            stage,
        } = env;

        if (!awsAccessKeyId || !awsSecretAccessKey) {
            throw new Error(
                'AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set'
            );
        }

        const packageManager = detectPackageManager(bitbucketCloneDir);
        const isMonorepo = await isNxServerlessMonorepo(bitbucketCloneDir);

        const searchDirectory = isMonorepo
            ? `${bitbucketCloneDir}/${servicesPath}`
            : bitbucketCloneDir;

        let serverlessFiles = await findServerlessYaml(searchDirectory);

        await Promise.all(
            serverlessFiles.map((file) => injectCfnRole(file, cfnRole))
        );

        const commands = [
            `npx serverless config credentials --provider aws --profile ${profile} --key ${awsAccessKeyId} --secret ${awsSecretAccessKey}`,
        ];

        const isNodeModulesExists = await nodeModulesDirectoryExist(
            bitbucketCloneDir
        );
        if (!isNodeModulesExists) {
            const installCmd = getInstallCommand(packageManager);
            commands.unshift(installCmd);
        }

        const baseCommand = isMonorepo
            ? `npx nx run-many -t ${cmd} --`
            : `npx serverless ${cmd}`;
        const verbose = debug ? '--verbose' : '';

        commands.push(
            `${baseCommand} --stage ${stage} --aws-profile ${profile} ${verbose}`
        );

        await runCLICommand(commands, bitbucketCloneDir);

        deploymentStatus = true;
    } catch (error) {
        if (error instanceof Error) {
            console.error(logSymbols.error, chalk.redBright(error.message));
        }
        console.error(
            logSymbols.error,
            chalk.redBright(
                'Deployment failed! Please check the logs for more details.'
            )
        );
        deploymentStatus = false;
    } finally {
        const statusCode = await uploadDeploymentBadge(deploymentStatus);
        process.exit(statusCode);
    }
}

// Execute the main function
main();
