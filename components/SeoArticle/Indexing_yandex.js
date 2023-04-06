const axios = require("axios");
require("dotenv").config();

async function publishUrlForIndexing(inputUrl) {

  // Set your Yandex Webmaster API token
  const token = process.env.YANDEX_API_TOKEN;

  let data = JSON.stringify({
    url: inputUrl,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://api.webmaster.yandex.net/v4/user/172467933/hosts/https:freud.online:443/recrawl/queue",
    headers: {
      Authorization: `OAuth ${token}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      // const responseData = JSON.stringify(response.data);
      const quota_remainder = response.data.quota_remainder;
      // const task_id = response.task_id;
      console.log(`Yandex indexed, remaings ${quota_remainder}. Url: ${inputUrl}`);
      return quota_remainder;
    })
    .catch((error) => {
      console.log(error.response.data);
    });

}

module.exports = {
  publishUrlForIndexing,
};
