const axios = require("axios");
require("dotenv").config();

// Set your Yandex Webmaster API token
const token = process.env.YANDEX_API_TOKEN;
const url = "https://api-sandbox.direct.yandex.ru/v4/json";
const locale = "ru"; // or 'ru' for Russian, 'en';

async function CreateNewWordstatReport() {
  const body = {
    method: "CreateNewWordstatReport",
    param: {
      /* NewWordstatReportInfo */
      Phrases: ["интроверт"],
      GeoID: [0],
    },
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error.response);
  }
}
// CreateNewWordstatReport();

async function GetWordstatReportList() {
  const body = {
    method: "GetWordstatReportList",
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

async function GetWordstatReport(reportId) {
  const body = {
    method: "GetWordstatReport",
    param: reportId,
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("error", error);
  }
}
// GetWordstatReport(7823728);

async function GetClientsUnits() {
  const body = {
    method: "GetClientsUnits",
    param: ["dimitri.korenev@andex.com"],
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
// GetClientsUnits();

async function GetKeywordsSuggestion() {
  const body = {
    method: "GetKeywordsSuggestion",
    param: {
      Keywords: ["интроверт"],
    },
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
// GetKeywordsSuggestion();

async function deleteWordstatReport() {
  const body = {
    method: "GetClientsUnits",
    param: ["dimitri.korenev@andex.ru"],
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

async function getRegions() {
  const body = {
    method: "GetRegions",
    token,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const response = await axios.post(url, body, { headers });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
// getRegions();

async function getKeywords() {
  const reportGenerated = await CreateNewWordstatReport();
  const reportId = reportGenerated.data;

  while (
    Array.isArray((result = await GetWordstatReport(reportId)).data) === false
  ) {
    console.log(
      `GetWordstatReport отчет ${reportId} с ошибкой ${result.error_code}, ${result.error_str}, try again`
    );
    // console.log(result);
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // переведёт промис в состояние fulfilled с результатом "result"
        resolve("result");
      }, 500);
    });
  }
  const resSearchedWith = result.data[0].SearchedWith;
  for (let i = 0; i < resSearchedWith.length; i++) {
    const val = resSearchedWith[i];
    resSearchedWith[i];
    console.log(`Entry ${i}, фраза: "${val.Phrase}", проказов: ${val.Shows}`);
  }

  //////////////////////////////// что вернуть
  //то что нужно
  // let resultData = result.data.map(function (item) {
  //   return item.SearchedWith[0].Shows;
  // });
  // let returningData = {};
  // returningData.length = resultData.length;
  // returningData.string = resultData.join("\n");
  // return returningData;

  // console.log(result.data[0].SearchedAlso);
  // console.log(result.SearchedAlso);
  // console.log(result.SearchedWith);
}

// getKeywords();

module.exports = {
  // CreateNewWordstatReport,
};
