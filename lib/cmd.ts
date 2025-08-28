import chalk from 'chalk';
import { SpawnOptions, spawn } from 'child_process';
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
    args: ReadonlyArray<string>,
    options: SpawnOptions
): Promise<number | null> {
    return new Promise(function (resolve, reject) {
        if (env.debug) {
            const commandWithArgs = `${command} ${args?.join(' ')}`;
            const optionsStr = JSON.stringify(options);
            console.log(
                logSymbols.info,
                chalk.whiteBright(
                    `Executing command: ${commandWithArgs} with options: ${optionsStr}`
                )
            );
        }

        const process = spawn(command, args, options);

        process.stdout?.on("data", function (data) {
            if (env.debug) {
                console.log(`stdout: ${data}`);
            }
        });

        process.stderr?.on("data", function (data) {
            if (env.debug) {
                console.log(`stderr: ${data}`);
            }
        });

        process.on('close', function (code) {
            if (env.debug) {
                console.log(`child process close all stdio with code ${code}`);
            }
        });

        process.on('disconnect', function () {
            if (env.debug) {
                console.log('child process disconnected');
            }
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
    workDir: string
): Promise<number | null> {
    console.log(
        logSymbols.info,
        chalk.whiteBright(`Running command: ${command}`)
    );
    const cmd = splitCommandAndArgs(command);
    return asyncSpawn(cmd.command, cmd.args, {
        cwd: workDir,
        stdio: ['pipe', 'inherit', 'inherit'],
    });
}

export async function runCLICommand(
    commandStr: Array<string>,
    workDir: string
) {
    console.log(logSymbols.info, chalk.white(`Running commands in ${workDir}`));

    for (const cmd of commandStr) {
        await runCommandString(cmd, workDir);
    }
}
