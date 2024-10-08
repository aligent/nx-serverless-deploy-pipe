import * as fs from 'fs';

export async function nodeModulesDirectoryExist(
    directoryPath: string
): Promise<boolean> {
    return fs.promises
        .access(`${directoryPath}/node_modules`, fs.constants.F_OK)
        .then(() => true)
        .catch((error) => {
            if (error.code === 'ENOENT') {
                return false;
            } else {
                throw error;
            }
        });
}
