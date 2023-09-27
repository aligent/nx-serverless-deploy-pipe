# Aligent Nx Serverless Deploy Pipe

This pipe is used to deploy multiple Serverless Framework applications in an Nx monorepo.

## YAML Definition

Add the following your `bitbucket-pipelines.yml` file:

> Please note: there is currently an issue when used with Bitbucket's node cache type. This cannot be used in the step until resolved.

```yaml
- step:
    name: "deploy service"
    script:
      - pipe: docker://aligent/nx-serverless-deploy-pipe:latest
        variables:
          AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
          AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
```

## Variables

| Variable              | Usage                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS_ACCESS_KEY_ID     | (Required) Injects AWS Access key                                                                                                              |
| AWS_SECRET_ACCESS_KEY | (Required) Injects AWS Secret key                                                                                                              |
| CFN_ROLE              | [CloudFormation service role](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html) to use for deployment |
| STAGE                 | Define the stage to deploy. Must be exact three characters. (Default: `stg`)                                                                   |
| DEBUG                 | Turn on extra debug information. (Accepted values: `true`/`false`)                                                                             |
| UPLOAD_BADGE          | Whether or not to upload a deployment badge to the repositories downloads section. (Accepted values: `true`/`false`)                           |
| APP_USERNAME          | The user to upload the badge as. Required if UPLOAD_BADGE is set to `true`.                                                                    |
| APP_PASSWORD          | The app password of the user uploading the badge. Required if UPLOAD_BADGE is set to `true`.                                                   |
| TIMEZONE              | Which time zone the time in the badge should use (Default: 'Australia/Adelaide')                                                               |

- Default pipelines variables that are available for builds: https://support.atlassian.com/bitbucket-cloud/docs/variables-and-secrets/
- Please check: https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/ for how to generate an app password.

## Monorepo structure

The pipe expects each application to be under a root folder called `services`, and to have a `serverless.yml` file in its own root folder.

```
services
  - application-one
    - serverless.yml
    - project.json
    ... other files
  - application-two
    - serverless.yml
    - project.json
    ... other files
```

Each application should also have a `project.json` file defining an `nx` target called `deploy`, which implements serverless deploy.

```json
{
  "targets": {
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "services/application-one",
        "color": true,
        "command": "sls deploy"
      }
    }
    //    ... other targets
  }
  // ... other nx configuration
}
```

## Development

To build the image locally: \
`docker build --build-arg="NODE_TAG=18-alpine" -t aligent/nx-pipe:18-alpine .`

To run the container locally and mount current local directory to the /app/work folder:

```bash
docker run -it --memory=4g --memory-swap=4g --memory-swappiness=0 --cpus=4 --entrypoint=/bin/sh \
  -v $(pwd):/app/work --workdir=/app/work \
  -e BITBUCKET_CLONE_DIR=/app/work \
  -e PROFILE=bitbucket-deployer \
  -e STAGE=stg \
  -e AWS_ACCESS_KEY_ID=test-access-key-id \
  -e AWS_SECRET_ACCESS_KEY=test-secret-access-key \
  -e CFN_ROLE=test-cfn-role \
  -e UPLOAD_BADGE=false \
  -e APP_USERNAME=test-app-username \
  -e APP_PASSWORD=test-app-password \
  aligent/nx-pipe:18-alpine
```

## See also

https://nx.dev/ \
https://www.serverless.com/framework/docs/providers/aws/guide/deploying \
https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials
