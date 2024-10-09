import { existsSync } from 'fs';

type PackageManager = 'npm' | 'pnpm' | 'yarn';

export function detectPackageManager(directoryPath: string): PackageManager {
    if (existsSync(`${directoryPath}/yarn.lock`)) {
        return 'yarn';
    }

    if (existsSync(`${directoryPath}/pnpm-lock.yaml`)) {
        return 'pnpm';
    }

    return `npm`;
}

export function getInstallCommand(packageManager: PackageManager) {
    switch (packageManager) {
        case 'npm':
            return 'npm ci';
        case 'pnpm':
            return 'pnpm install --frozen-lockfile';
        case 'yarn':
            return 'yarn install --frozen-lockfile';
    }
}
