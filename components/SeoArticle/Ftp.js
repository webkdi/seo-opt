const fs = require("fs");
const path = require("path");
const ftp = require("basic-ftp");

async function uploadFileToFTP(localFilePath, ftpPath) {
  const client = new ftp.Client();
  try {
    await client.access({
      host: "89.108.103.129",
      user: "dimitri.korenev",
      password: "oN6uI5vX2x",
      secure: false,
      secureOptions: {
        rejectUnauthorized: false,
      },
    });
    await client.ensureDir(path.dirname(ftpPath));

    const localNormalPath = localFilePath.replace(/\\/g, "\\\\");
    await client.upload(fs.createReadStream(localNormalPath), ftpPath);
  } catch (err) {
    console.error(err);
  }
  client.close();
}

module.exports = {
  uploadFileToFTP,
};
