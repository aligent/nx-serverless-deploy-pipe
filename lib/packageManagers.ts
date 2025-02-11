import { existsSync } from 'fs';
import { join } from 'path';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export function detectPackageManager(directoryPath: string): PackageManager {
    if (existsSync(join(directoryPath, 'yarn.lock'))) {
        return 'yarn';
    }

    if (existsSync(join(directoryPath, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }

    return 'npm';
}

export function getInstallCommand(packageManager: PackageManager) {
    switch (packageManager) {
        case 'pnpm':
            return 'pnpm install --frozen-lockfile';
        case 'yarn':
            return 'yarn install --frozen-lockfile';
        case 'npm':
        default:
            return 'npm ci';
    }
}
