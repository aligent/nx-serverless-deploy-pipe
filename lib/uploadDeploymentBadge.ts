import axios from 'axios';
import { makeBadge } from 'badge-maker';
import chalk from 'chalk';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import FormData from 'form-data';
import logSymbols from 'log-symbols';
import { env } from './env';

dayjs.extend(utc);
dayjs.extend(timezone);

// This function try to upload deployment badge the return exit status code
// Return 0 when both deployment & uploading badge was successful. Return 1 otherwise
export async function uploadDeploymentBadge(
    wasSuccessful: boolean
): Promise<number> {
    let statusCode = wasSuccessful ? 0 : 1;

    const {
        appUsername,
        appPassword,
        bitbucketBranch,
        bitbucketRepoSlug,
        bitbucketWorkspace,
        uploadBadge,
    } = env;

    try {
        if (!uploadBadge) {
            console.log(
                logSymbols.info,
                chalk.whiteBright('Skipping badge upload')
            );
            return statusCode;
        }

        if (!appUsername || !appPassword) {
            throw new Error(
                'APP_USERNAME or APP_PASSWORD not set, we cannot upload badge without them.'
            );
        }

        const badge = generateDeploymentBadge(wasSuccessful);

        const formData = new FormData();
        formData.append('files', badge, {
            filename: `${bitbucketBranch}_status.svg`,
            contentType: 'image/svg+xml',
        });

        await axios.post(
            `https://api.bitbucket.org/2.0/repositories/${bitbucketWorkspace}/${bitbucketRepoSlug}/downloads`,
            formData,
            {
                auth: {
                    username: appUsername,
                    password: appPassword,
                },
            }
        );
        return statusCode;
    } catch (error) {
        console.error(logSymbols.error, chalk.redBright(error));
        return 1;
    }
}

function generateDeploymentBadge(wasSuccessful: boolean) {
    const time = dayjs(new Date())
        .tz(env.timezone)
        .format('DD MMM, YYYY, HH:mm');

    return makeBadge({
        label: 'deployment',
        message: time,
        color: wasSuccessful ? 'green' : 'red',
    });
}
