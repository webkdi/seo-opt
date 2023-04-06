const { google } = require("googleapis");
const auth = new google.auth.GoogleAuth({
  projectId: "freud-online",
  keyFile: "./freud-online-9ce1f75d5d28.json",
  scopes: ["https://www.googleapis.com/auth/adwords"],
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
// publishUrlForIndexing(url, type);

module.exports = {
  publishUrlForIndexing,
};
