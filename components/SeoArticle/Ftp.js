const fs = require("fs");
const path = require("path");
const ftp = require("basic-ftp");

async function uploadFileToFTP(localFilePath, ftpPath) {

    const client = new ftp.Client();
    try {
      await client.access({
        host: "194.67.105.122",
        user: "dimitri.korenev",
        password: "dA3oA9xA3z",
        secure: true,
        secureOptions: {
          rejectUnauthorized: false
        }
      });
      await client.ensureDir(path.dirname(ftpPath));

      const localNormalPath = localFilePath.replace(/\\/g, '\\\\');
      await client.upload(fs.createReadStream(localNormalPath), ftpPath);
    } catch (err) {
      console.error(err);
    }
    client.close();
  }
  

module.exports = {
  uploadFileToFTP,
};
