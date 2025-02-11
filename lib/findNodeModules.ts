import fs from 'fs';
import { join } from 'path';

export async function nodeModulesDirectoryExist(
    directoryPath: string
): Promise<boolean> {
    try {
        await fs.promises.access(
            join(directoryPath, 'node_modules'),
            fs.constants.F_OK
        );
        return true;
    } catch (error) {
        if (
            error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return false;
        }
        throw error;
    }
}
