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
    const sshDir = `${homeDir}/.ssh/`;
    const sshConfigDir = `/opt/atlassian/pipelines/agent/ssh`;
    const identityFile = `${sshConfigDir}/id_rsa_tmp`;
    const knownHostsFile = `${sshConfigDir}/known_hosts`;

    // Ensure the SSH directory exists
    const sshDirExists = await fs.promises
        .stat(sshDir)
        .then((stat) => stat.isDirectory());
    if (!sshDirExists) {
        await fs.promises.mkdir(sshDir, { recursive: true });
    }

    // Copy over the SSH identity file that Bitbucket has generated, if this fails then we should fail the whole pipeline
    try {
        console.log('Attempting to copy SSH identity file...');

        const pipelinesIdFile = `${sshDir}/pipelines_id`;
        await fs.promises.copyFile(identityFile, pipelinesIdFile);

        console.log(`Copied to ${pipelinesIdFile}`);
        console.log(`Adding identity file config to config file`);

        const configFile = `${sshDir}/config`;
        await fs.promises.appendFile(
            configFile,
            `IdentityFile ${pipelinesIdFile}`
        );
    } catch (e) {
        console.error(
            'Failed to update SSH configuration, check that SSH key configuration in Pipelines is valid. \n Check Pipelines -> SSH Keys.'
        );
        return;
    }

    // Copy over the known_hosts file that Bitbucket generated
    try {
        console.log('Piping known hosts into runtime ssh config');
        const knownHosts = await fs.promises
            .readFile(knownHostsFile)
            .then((buf) => buf.toString());
        const hostsFile = `${sshDir}/known_hosts`;
        await fs.promises.appendFile(hostsFile, knownHosts);
    } catch (e) {
        console.error(
            'Failed to update hosts file. \n Check Pipelines configuration for known hosts.'
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
