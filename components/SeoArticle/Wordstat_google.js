const { GoogleAdsApi } = require("google-ads-api");
const { GoogleAuth } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

const keyFilePath = path.join(
  __dirname,
  "../../freud-online-1d405901c901.json"
);
try {
  fs.readFileSync(keyFilePath);
  // console.log(`File ${keyFilePath} is here`);
} catch (err) {
  console.error(`Error reading file at path '${keyFilePath}': ${err}`);
  process.exit(1);
}

const auth = new GoogleAuth({
  credentials: {
    client_email: "freud-online@appspot.gserviceaccount.com", //process.env.CLIENT_EMAIL,
    private_key: fs.readFileSync(keyFilePath),
  },
  scopes: ["https://www.googleapis.com/auth/adwords"],
});

const getClient = async () => {
  const auth = new GoogleAuth({
    credentials: {
      client_email: "freud-online@appspot.gserviceaccount.com",
      private_key: fs.readFileSync(keyFilePath),
    },
    scopes: ["https://www.googleapis.com/auth/adwords"],
  });

  const authClient = await auth.getClient();
  const client = new GoogleAdsApi({
    version: "v8",
    auth: authClient,
  });

  return client;
};

async function main() {
    const client = await getClient();
    console.log(client.getService('CampaignService')); // should output an instance of the CampaignService client
    console.log(client.config); // should output the client configuration options
  }
  
  main();
