import { env } from "./env";
import { findServerlessYaml } from "./findServerlessYaml";
import { injectCfnRole } from "./injectCfnRole";
import { runCLICommand } from "./cmd";

findServerlessYaml(`${process.env.BITBUCKET_CLONE_DIR}/services`)
  .then((files) =>
    Promise.all(files.map((file) => injectCfnRole(file, process.env.CFN_ROLE)))
  )
  .then(() =>
    runCLICommand([
      "npm ci",
      `npx nx run-many -t deploy --stage ${env.stage} --aws-profile ${env.profile}`,
    ])
  );
