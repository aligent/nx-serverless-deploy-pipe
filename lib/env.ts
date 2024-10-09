interface Env {
    debug: boolean;
    stage: string;
    profile: string;
    cmd: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    cfnRole?: string;
    uploadBadge: boolean;
    appUsername?: string;
    appPassword?: string;
    timezone: string;
    bitbucketBranch?: string;
    bitbucketCloneDir: string;
    bitbucketRepoSlug?: string;
    bitbucketWorkspace?: string;
    servicesPath: string;
}

export const env: Env = {
    debug: process.env.DEBUG === 'true',
    stage: process.env.STAGE || 'stg',
    profile: process.env.PROFILE || 'bitbucket-deployer',
    cmd: process.env.CMD || 'deploy',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cfnRole: process.env.CFN_ROLE,
    uploadBadge: process.env.UPLOAD_BADGE === 'true',
    appUsername: process.env.APP_USERNAME,
    appPassword: process.env.APP_PASSWORD,
    timezone: process.env.TIMEZONE || 'Australia/Adelaide',
    bitbucketBranch: process.env.BITBUCKET_BRANCH,
    bitbucketCloneDir: process.env.BITBUCKET_CLONE_DIR || '',
    bitbucketRepoSlug: process.env.BITBUCKET_REPO_SLUG,
    bitbucketWorkspace: process.env.BITBUCKET_WORKSPACE,
    servicesPath: process.env.SERVICES_PATH || 'services',
};
