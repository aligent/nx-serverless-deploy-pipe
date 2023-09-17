# Aligent Nx Serverless Deploy Pipe

This pipe is used to deploy multiple Serverless Framework applications in an Nx monorepo.

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

To build the container locally: \
`docker build -t aligent/nx-pipe .`

To run the image locally and mount a local directory to the /app folder: \

`` docker run -it -e BITBUCKET_CLONE_DIR=/app/work -e STAGE=stg -e PROFILE=bitbucket-deployer -e CFN_ROLE=test-cfn-role -v `pwd`:/app/work --memory=4g --memory-swap=4g --memory-swappiness=0 --cpus=4 --entrypoint=/bin/bash {built container id}
 ``

## See also

https://nx.dev/ \
https://www.serverless.com/framework/docs/providers/aws/guide/deploying
