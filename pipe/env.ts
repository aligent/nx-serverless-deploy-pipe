interface Env {
  debug: boolean;
  stage: string;
  profile: string;
}

export const env: Env = {
  debug: process.env.DEBUG === "true",
  stage: process.env.STAGE || "stg",
  profile: process.env.PROFILE || "bitbucket-deployer",
};
