import chalk from 'chalk';
import * as cp from 'child_process';
import logSymbols from 'log-symbols';
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
    args?: ReadonlyArray<string>,
    options?: cp.SpawnOptionsWithoutStdio
): Promise<number | null> {
    return new Promise(function (resolve, reject) {
        if (env.debug) {
            const commandWithArgs = `${command} ${args?.join(' ')}`;
            const optionsStr = JSON.stringify(options);
            console.log(
                chalk.white(
                    `ℹ️ Executing command: ${commandWithArgs} with options: ${optionsStr}`
                )
            );
        }

        const process = cp.spawn(command, args, options);

        process.stdout.on('data', (data) => {
            console.log(logSymbols.info, chalk.white(data.toString()));
        });

        process.stderr.on('data', (data) => {
            console.error(logSymbols.error, chalk.red(data.toString()));
        });

        process.on('exit', function (code) {
            if (code !== 0) reject(code);
            resolve(code);
        });

        process.on('error', function (err) {
            reject(err);
        });
    });
}

function runCommandString(
    command: string,
    workDir?: string
): Promise<number | null> {
    console.log(logSymbols.info, chalk.white(`Running command: ${command}`));
    const cmd = splitCommandAndArgs(command);
    return asyncSpawn(cmd.command, cmd.args, { cwd: workDir });
}

export async function runCLICommand(commandStr: Array<string>) {
    const workDir = process.env.BITBUCKET_CLONE_DIR;
    console.log(logSymbols.info, chalk.white(`Running commands in ${workDir}`));

    for (const cmd of commandStr) {
        await runCommandString(cmd, workDir);
    }
}
