import axios from "axios";
import { makeBadge } from "badge-maker";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import FormData from "form-data";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function uploadDeploymentBadge(wasSuccessful: boolean) {
  const {
    APP_USERNAME: appUsername,
    APP_PASSWORD: appPassword,
    BITBUCKET_BRANCH: bitbucketBranch,
    BITBUCKET_WORKSPACE: bitbucketWorkspace,
    BITBUCKET_REPO_SLUG: bitbucketRepoSlug,
    TIMEZONE: timezone,
    UPLOAD_BADGE: uploadBadge,
  } = process.env;

  if (!uploadBadge || uploadBadge === "false") {
    console.log("Skipping badge upload");
    return;
  }

  if (!appUsername || !appPassword) {
    console.error(
      "APP_USERNAME or APP_PASSWORD not set, we cannot upload badge without them."
    );
    throw new Error("Failed to upload deployment badge.");
  }

  const badge = generateDeploymentBadge(wasSuccessful, timezone);

  const formData = new FormData();
  formData.append("files", badge, {
    filename: `${bitbucketBranch}_status.svg`,
    contentType: "image/svg+xml",
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
}

function generateDeploymentBadge(wasSuccessful: boolean, timezone = "UTC") {
  const time = dayjs(new Date()).tz(timezone).format("DD MMM, YYYY, HH:mm");

  return makeBadge({
    label: "deployment",
    message: time,
    color: wasSuccessful ? "green" : "red",
  });
}
