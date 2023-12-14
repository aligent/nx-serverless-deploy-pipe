import { glob } from "glob";

export async function findServerlessYaml(basePath: string) {
  // Both yml and yaml are valid file extensions, so match either
  const globPattern = `${basePath}/**/serverless.{yml,yaml}`;

  console.log(`Fetching serverless configuration with pattern ${globPattern}`);

  const files = await glob(globPattern, { ignore: ["**/node_modules/**"] });

  for (const file of files) {
    console.log("Found serverless.yml at: ", file);
  }

  return files;
}
