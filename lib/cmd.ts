import chalk from 'chalk';
import { spawn, SpawnOptions } from 'child_process';
import logSymbols from 'log-symbols';
import { nodeModulesDirectoryExist } from '../lib/findNodeModules';
import { getInstallCommand, PackageManager } from '../lib/packageManagers';
import { env } from './env';

interface Command {
    command: string;
    args: ReadonlyArray<string>;
}

function splitCommandAndArgs(command: string): Command {
    // Split the command string at all white spaces excluding white spaces wrapped with single quotes
    const cmd = command.split(/\s(?=(?:[^']*'[^']*')*[^']*$)/g);
    return {
        command: cmd.shift() as string,
        args: cmd,
    };
}

// Wrap spawn in a promise
function asyncSpawn(
    command: string,
    args: ReadonlyArray<string>,
    options: SpawnOptions,
    debug = false
): Promise<number | null> {
    if (debug) {
        const commandWithArgs = `${command} ${args?.join(' ')}`;
        const optionsStr = JSON.stringify(options);
        console.log(
            logSymbols.info,
            chalk.whiteBright(
                `Executing command: ${commandWithArgs} with options: ${optionsStr}`
            )
        );
    }

    return new Promise((resolve, reject) => {
        const process = spawn(command, args, options);

        process.on('exit', (code) => {
            if (code !== 0) reject(code);
            else resolve(code);
        });

        process.on('error', (err) => reject(err));
    });
}

function runCommandString(
    command: string,
    workDir: string,
    debug = false
): Promise<number | null> {
    console.log(
        logSymbols.info,
        chalk.whiteBright(`Running command: ${command}`)
    );
    const cmd = splitCommandAndArgs(command);
    return asyncSpawn(
        cmd.command,
        cmd.args,
        {
            cwd: workDir,
            stdio: ['pipe', 'inherit', 'inherit'],
        },
        debug
    );
}

export async function runCLICommand(
    commandStr: Array<string>,
    workDir: string,
    debug = false
) {
    if (debug) {
        console.log(
            logSymbols.info,
            chalk.white(`Running commands in ${workDir}`)
        );
    }

    for (const cmd of commandStr) {
        await runCommandString(cmd, workDir, debug);
    }
}

export async function buildCommands(
    isMonorepo: boolean,
    packageManager: PackageManager
) {
    const {
        awsAccessKeyId,
        awsSecretAccessKey,
        bitbucketCloneDir,
        cmd,
        debug,
        profile,
        stage,
    } = env;

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

    return commands;
}
