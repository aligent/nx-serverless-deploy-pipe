import { existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

export async function isNxServerlessMonorepo(directoryPath: string) {
    const isNxFileExist = existsSync(join(directoryPath, 'nx.json'));

    const serverlessYmlFiles = await glob('serverless.{yml,yaml}', {
        cwd: directoryPath,
        ignore: ['**/node_modules/**'],
        nodir: true,
    });
    const isServerlessFileExist = serverlessYmlFiles.length > 0;

    return isNxFileExist && !isServerlessFileExist;
}
