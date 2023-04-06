const axios = require("axios");
const { Buffer } = require("buffer");
require("dotenv").config();

async function publishUrlForIndexing(url) {
  try {

    const response = await axios.get(url);


    const contentLength = response.data.length;
    const httpHtml = response.data;
    const getCurrentDate = () => {
      return new Date().toUTCString();
    };
    const currentDate = getCurrentDate();

    let message = 'HTTP/1.1 200 OK\r\n';
    message += `Date: ${currentDate}\r\n`;
    message += 'Accept-Ranges: bytes\r\n';
    message += `Content-Length: ${contentLength}\r\n`;
    message += 'Connection: close\r\n';
    message += 'Content-Type: text/html\r\n';
    message += '\r\n\r\n';
    message += httpHtml;

    const httpMessage = Buffer.from(message).toString("base64");

    const apiKey = process.env.BING_KEY;

    const apiEndpoint = `https://ssl.bing.com/webmaster/api.svc/json/SubmitContent?apikey=${apiKey}`;

    const requestData = {
      siteUrl: 'https://freud.online',
      url: url,
      httpMessage: httpMessage,
    //   contentType,
      structuredData: "",
      dynamicServing: "0"
    };
  
    const headers = {
      'Content-Type': 'application/json; charset=utf-8'
    };
  
    try {
      const response = await axios.post(apiEndpoint, requestData, { headers });
      console.log(response.status);

    } catch (error) {
        console.error(error.message);
      }


  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
    return null;
  }
}

module.exports = {
  publishUrlForIndexing,
};
