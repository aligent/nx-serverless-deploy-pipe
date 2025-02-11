import chalk from 'chalk';
import { glob } from 'glob';
import logSymbols from 'log-symbols';
import { join } from 'path';

export async function findServerlessYaml(basePath: string) {
    // Both yml and yaml are valid file extensions, so match either
    const globPattern = join(basePath, '**', 'serverless.{yml,yaml}');

    console.log(
        logSymbols.info,
        chalk.whiteBright(
            `Searching serverless configuration with pattern: ${globPattern}`
        )
    );

    const files = await glob(globPattern, {
        ignore: ['**/node_modules/**'],
        nodir: true,
        absolute: true,
    });

    if (files.length > 0) {
        files.forEach((file) =>
            console.log(
                logSymbols.info,
                chalk.whiteBright('Found serverless configuration at:', file)
            )
        );
    }

    return files;
}
