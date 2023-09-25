import { runCLICommand } from "./cmd";
import { env } from "./env";
import { findServerlessYaml } from "./findServerlessYaml";
import { injectCfnRole } from "./injectCfnRole";
import { uploadDeploymentBadge } from "./uploadDeploymentBadge";

findServerlessYaml(`${process.env.BITBUCKET_CLONE_DIR}/services`)
  .then((files) =>
    Promise.all(files.map((file) => injectCfnRole(file, process.env.CFN_ROLE)))
  )
  .then(() =>
    runCLICommand([
      "npm ci",
      `npx serverless config credentials --provider aws --profile ${env.profile} --key ${process.env.AWS_ACCESS_KEY_ID} --secret ${process.env.AWS_SECRET_ACCESS_KEY}`,
      `npx nx run-many -t deploy --stage ${env.stage} --aws-profile ${env.profile}`,
    ])
  )
  .then(() => uploadDeploymentBadge(true))
  .catch(() => {
    console.error(`Something went wrong!`);
    uploadDeploymentBadge(false);
  });

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
});
