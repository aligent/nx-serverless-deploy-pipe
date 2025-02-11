import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { buildCommands, runCLICommand } from '../lib/cmd';
import { env } from '../lib/env';
import { findServerlessYaml } from '../lib/findServerlessYaml';
import { injectCfnRole } from '../lib/injectCfnRole';
import { detectPackageManager } from '../lib/packageManagers';
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
            debug,
            servicesPath,
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

        const serverlessFiles = await findServerlessYaml(searchDirectory);

        if (serverlessFiles.length === 0) {
            throw new Error('No serverless configuration files found.');
        }

        await Promise.all(
            serverlessFiles.map((file) => injectCfnRole(file, cfnRole, debug))
        );

        const commands = await buildCommands(isMonorepo, packageManager);

        await runCLICommand(commands, bitbucketCloneDir, debug);

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
main().catch((error) =>
    console.error(logSymbols.error, chalk.redBright(error))
);
