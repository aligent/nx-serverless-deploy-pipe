import { runCLICommand } from "./cmd";
import { env } from "./env";
import { findServerlessYaml } from "./findServerlessYaml";
import { injectCfnRole } from "./injectCfnRole";
import { uploadDeploymentBadge } from "./uploadDeploymentBadge";

async function main() {
  let deploymentStatus = false;

  try {
    if (!env.awsAccessKeyId || !env.awsSecretAccessKey) {
      throw new Error("AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set");
    }

    const serverlessFiles = await findServerlessYaml(
      `${process.env.BITBUCKET_CLONE_DIR}/services`
    );
    await Promise.all(
      serverlessFiles.map((file) => injectCfnRole(file, env.cfnRole))
    );

    await runCLICommand([
      "npm ci",
      `npx serverless config credentials --provider aws --profile ${env.profile} --key ${env.awsAccessKeyId} --secret ${env.awsSecretAccessKey}`,
      `npx nx run-many -t deploy --stage ${env.stage} --aws-profile ${env.profile}`,
    ]);

    deploymentStatus = true;
  } catch (error) {
    console.error(
      "Deployment failed! Please check the logs for more details.Error:",
      error as Error
    );
    deploymentStatus = false;
  } finally {
    const statusCode = await uploadDeploymentBadge(deploymentStatus);
    process.exit(statusCode);
  }
}

// Execute the main function
main();
