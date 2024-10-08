import chalk from 'chalk';
import { glob } from 'glob';
import logSymbols from 'log-symbols';

export async function findServerlessYaml(basePath: string) {
    // Both yml and yaml are valid file extensions, so match either
    const globPattern = `${basePath}/**/serverless.{yml,yaml}`;

    console.log(
        logSymbols.info,
        chalk.white(
            `Fetching serverless configuration with pattern ${globPattern}`
        )
    );

    const files = await glob(globPattern, { ignore: ['**/node_modules/**'] });

    for (const file of files) {
        console.log(
            logSymbols.info,
            chalk.white('Found serverless.yml at: ', file)
        );
    }

    return files;
}
