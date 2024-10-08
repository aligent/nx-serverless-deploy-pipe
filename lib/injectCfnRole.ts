import type { AWS } from '@serverless/typescript';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { dump, load } from 'js-yaml';
import { CLOUDFORMATION_SCHEMA } from 'js-yaml-cloudformation-schema';
import logSymbols from 'log-symbols';
import { env } from './env';

export async function injectCfnRole(
    serverlessYamlPath: string,
    cfnRole: string | undefined
) {
    try {
        // Parse yaml file as a JSON object, while extending the yaml schema with
        // AWS Intrinsic functions (!Sub, !Ref etc) as custom tags
        const yaml = await readFile(serverlessYamlPath, 'utf8');
        const serverless = load(yaml, { schema: CLOUDFORMATION_SCHEMA }) as AWS;

        if (env.debug) {
            console.log(
                logSymbols.info,
                chalk.white(JSON.stringify(serverless, null, 2))
            );
        }

        // Ensure iam exists in the provider block
        if (!('iam' in serverless.provider)) {
            serverless.provider.iam = {};
        }

        // if a role already exists DO NOT override it
        if (
            'cfnRole' in serverless.provider ||
            'deploymentRole' in serverless.provider.iam!
        ) {
            console.warn(
                logSymbols.warning,
                chalk.yellow(
                    'It looks like serverless.yaml already defines a CFN role.'
                )
            );

            if (cfnRole) {
                console.log(
                    logSymbols.warning,
                    chalk.yellow(
                        'This can now be injected by deploy pipe and removed from serverless.yaml'
                    )
                );
            } else {
                console.log(
                    logSymbols.warning,
                    chalk.yellow(
                        `This will be overwritten with ${cfnRole}. Please remove from serverless.yaml`
                    )
                );
            }

            return;
        }

        // If we don't have a role to inject no point writing the file
        if (!cfnRole) {
            console.warn(
                logSymbols.warning,
                chalk.yellow('Please provide a CFN role for deployment')
            );
            return;
        }

        // Ensure CFN role is defined once in the serverless configuration
        delete serverless.provider.cfnRole;
        serverless.provider.iam!.deploymentRole = cfnRole;

        // Convert back to yaml and overwrite the existing file
        const modifiedYaml = dump(serverless, {
            schema: CLOUDFORMATION_SCHEMA,
        });
        await writeFile(serverlessYamlPath, modifiedYaml, 'utf8');
        console.log(
            logSymbols.success,
            chalk.green(`Injected CFN role ${cfnRole} at ${serverlessYamlPath}`)
        );
    } catch (error) {
        console.error(logSymbols.error, chalk.red(error));
        throw new Error(
            `Failed to inject CFN role at path ${serverlessYamlPath}`
        );
    }
}
