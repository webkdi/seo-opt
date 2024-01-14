const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  projectId: "freud-online",
  keyFile: "./freud-online-1d405901c901.json",
  scopes: ["https://www.googleapis.com/auth/indexing"],
});

const indexing = google.indexing({
  version: "v3",
  auth: auth,
});

async function publishUrlForIndexing(url, type) {
  return new Promise((resolve, reject) => {
    indexing.urlNotifications.publish(
      {
        requestBody: {
          url: url,
          type: type,
        },
      },
      (err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          // console.log(res.data);
          resolve(res.data);
        }
      }
    );
  });
}

// Example: submit a URL for indexing
const url = "https://freud.online/types/ear/analysis";
const type = "URL_UPDATED"; //or URL_DELETED
async function main() {
  try {
    const res = await publishUrlForIndexing(url, type);
    console.log(res);
  } catch (error) {
    console.error(error);
  }
}
// main();

module.exports = {
  publishUrlForIndexing,
};
