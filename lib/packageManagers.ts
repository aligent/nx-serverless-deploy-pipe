import { existsSync } from 'fs';

const supportedPackageManagers = ['npm', 'pnpm', 'yarn'] as const;
type PackageManager = (typeof supportedPackageManagers)[number];

const installCommands: Record<PackageManager, string> = {
    npm: 'npm ci',
    pnpm: 'pnpm install --frozen-lockfile',
    yarn: 'yarn install --frozen-lockfile',
};
const debugFlags: Record<PackageManager, string> = {
    npm: '--verbose',
    pnpm: '--verbose',
    yarn: '--verbose',
};

export function detectPackageManager(directoryPath: string): PackageManager {
    if (existsSync(`${directoryPath}/yarn.lock`)) {
        return 'yarn';
    }

    if (existsSync(`${directoryPath}/pnpm-lock.yaml`)) {
        return 'pnpm';
    }

    return `npm`;
}

export function getInstallCommand(
    packageManager: PackageManager,
    debug: boolean = false,
): string {
    const installCommand = installCommands[packageManager];
    if (!installCommand) {
        const packageManagers = supportedPackageManagers.join(', ');
        throw new Error(
            `Unsupported package manager: "${packageManager}". Options are: ${packageManagers}`,
        );
    }

    const debugFlag = debug ? ` ${debugFlags[packageManager]}` : '';
    return `${installCommand}${debugFlag}`;
}
