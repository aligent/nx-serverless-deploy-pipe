import { runCLICommand } from "./cmd";
import { env } from "./env";
import { findServerlessYaml } from "./findServerlessYaml";
import { injectCfnRole } from "./injectCfnRole";
import { uploadDeploymentBadge } from "./uploadDeploymentBadge";

findServerlessYaml(`${process.env.BITBUCKET_CLONE_DIR}/services`)
  .then((files) =>
    Promise.all(files.map((file) => injectCfnRole(file, env.cfnRole)))
  )
  .then(() => {
    if (!env.awsAccessKeyId || !env.awsSecretAccessKey) {
      throw new Error("AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set");
    }

    runCLICommand([
      "npm ci",
      `npx serverless config credentials --provider aws --profile ${env.profile} --key ${env.awsAccessKeyId} --secret ${env.awsSecretAccessKey}`,
      `npx nx run-many -t deploy --stage ${env.stage} --aws-profile ${env.profile}`,
    ]);
  })
  .then(() => uploadDeploymentBadge(true))
  .catch((error) => {
    console.error(error);
    uploadDeploymentBadge(false);
  });

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
});
