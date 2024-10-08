import { existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

export async function isNxServerlessMonorepo(directoryPath: string) {
    const isNxFileExist = existsSync(path.join(directoryPath, 'nx.json'));

    const serverlessYmlFiles = await glob('serverless.{yml,yaml}', {
        cwd: directoryPath,
    });
    const isServerlessFileExist = serverlessYmlFiles.length > 0;

    return isNxFileExist && !isServerlessFileExist;
}
