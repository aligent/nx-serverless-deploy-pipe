import fs from 'fs';
import os from 'os';

/**
 * Sets up the SSH credentials for the pipeline.
 * This function copies the SSH identity file and known hosts file from the Bitbucket Pipelines agent to the local .ssh directory.
 * It also updates the SSH configuration file to include the identity file.
 *
 * @returns {Promise<void>} Resolves when the SSH credentials are setup or we fail to update the SSH configuration file (which doesn't fail the pipeline)
 */
export async function setupSshCredentials(): Promise<void> {
    const homeDir = os.homedir();
    const sshDir = `${homeDir}/.ssh`;

    // Bitbucket injects the SSH config into the container at these paths...
    const sshConfigDir = '/opt/atlassian/pipelines/agent/ssh';
    const identityFile = `${sshConfigDir}/id_rsa_tmp`;
    const knownHostsFile = `${sshConfigDir}/known_hosts`;

    // ...and we copy them to the user's .ssh directory
    const hostsFile = `${sshDir}/known_hosts`;
    const pipelinesIdFile = `${sshDir}/pipelines_id`;
    const configFile = `${sshDir}/config`;

    // Ensure the SSH directory exists, we're OK to create it if it doesn't exist
    if (!(await pathExists(sshDir))) {
        await fs.promises.mkdir(sshDir, { recursive: true });
    }

    // Ensure all the required directories and files exist
    // If these don't exist, we can't continue
    const pathsToCheck = [sshConfigDir, identityFile, knownHostsFile];
    for (const path of pathsToCheck) {
        if (!(await pathExists(path))) {
            console.error(
                `${path} not found. Check that the SSH configuration is valid.`,
            );
            return;
        }
    }

    // Copy the Bitbucket injected identity file to the local .ssh directory
    try {
        console.log('Attempting to copy SSH identity file...');

        await fs.promises.copyFile(identityFile, pipelinesIdFile);

        console.log(`Copied to ${pipelinesIdFile}`);
        console.log(`Adding identity file config to config file`);

        await fs.promises.appendFile(
            configFile,
            `\nIdentityFile ${pipelinesIdFile}\n`,
        );
    } catch (e) {
        console.error(
            `Failed to update SSH configuration, check that SSH key configuration in Pipelines is valid. \n Check Pipelines -> SSH Keys.\n\n ${
                (e as Error).message
            }`,
        );
        return;
    }

    // Copy the Bitbucket injected known hosts file to the local .ssh directory
    try {
        console.log('Piping known hosts into runtime ssh config');
        const knownHosts = await fs.promises
            .readFile(knownHostsFile)
            .then((buf) => `\n${buf.toString()}\n`);
        await fs.promises.appendFile(hostsFile, knownHosts);
    } catch (e) {
        console.error(
            'Failed to update hosts file. \n Check Pipelines configuration for known hosts.',
        );
        return;
    }

    console.log('Updating SSH directory permissions');

    await chmodRecursive(sshDir, 0o700);
}

/**
 * Recursively changes the permissions of a directory and its contents.
 *
 * @param {fs.PathLike} path - The path to the directory to change permissions for.
 * @param {fs.Mode} mode - The mode to set for the directory and its contents.
 * @throws {Error} If the directory or its contents cannot be changed.
 */
async function chmodRecursive(path: fs.PathLike, mode: fs.Mode): Promise<void> {
    await fs.promises.chmod(path, mode);

    const entries = await fs.promises.readdir(path, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`;
        if (entry.isDirectory()) {
            await chmodRecursive(fullPath, mode);
        } else {
            await fs.promises.chmod(fullPath, mode);
        }
    }
}

async function pathExists(path: fs.PathLike): Promise<boolean> {
    console.log(`Checking if ${path} exists`);
    // An error _typically_ means the object at `path` doesn't exist
    // Though we may want to check whether the error is a permission error
    // or a file not found error (the latter is OK)
    return fs.promises
        .stat(path)
        .then((_) => true)
        .catch((_) => false);
}
