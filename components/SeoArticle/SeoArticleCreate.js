const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const slugify = require("slugify");
const { Translate } = require("@google-cloud/translate").v2;
const fs = require("fs");
require("dotenv").config();
const ftp = require("./Ftp");
const db_d = require("./Database_datico");
const db_f = require("./Database_freud");
const index_google = require("./Indexing_google");
const index_yandex = require("./Indexing_yandex");
// const index_yandex = require("./components/Indexing_yandex");

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.CHATGPT_API_KEY,
});
const openai = new OpenAIApi(configuration);

//вводные данные
var MAIN_PROMPT = "Истероидный тип личности";
var MAIN_URL = "https://freud.online/types/eae/analysis";
var PROMPT_RUS = "истероидный тип личности примеры известных людей";

//рабочие переменные
var URL_ALIAS = "narcissicheskij-tip-lichnosti-primery-iz-filmov";
var PROMPT_ENG = "Narcissistic personality type movie examples";
var PROMPT_IMAGE =
  "Narcissistic personality type movie examples of a person holding a big red pen on a desk by fiona staples and dustin nguyen, cinematic lighting, hyperdetailed, artstation, cgsociety, deviantart,";
var PATH_IMAGE_OG = `C:\Users\Dimitri\OneDrive\Dokumente\Apps\images\narcissicheskij-tip-lichnosti-primery-iz-filmov-og.jpg`;
var PATH_IMAGE_OG_SERVER = `/www/freud.online/images/projects/apps/shorts/narcissicheskij-tip-lichnosti-primery-iz-filmov-og.jpg`;
var PATH_IMAGE_THUMB = `C:\Users\Dimitri\Apps\SeoOpt\images\narcissicheskij-tip-lichnosti-primery-iz-filmov-thumb.jpg`;
var PATH_IMAGE_THUMB_SERVER = `/www/freud.online/images/projects/apps/shorts/narcissicheskij-tip-lichnosti-primery-iz-filmov-thumb.jpg`;
var PATH_IMAGE_SERVER_FOLDER = "/www/freud.online/images/projects/apps/shorts/";
var TEXT_DESC = `Узнайте, что такое нарциссический тип личности и как он проявляется в кино. В статье приведены примеры из популярных фильмов, которые помогут понять этот психологический феномен.`;
var TEXT_ARTICLE = `Нарциссический тип личности: примеры из фильмов

Нарциссизм – это сочетание высокой самооценки и недостаточной эмпатии. Люди с таким типом личности обладают чрезмерным желанием внимания и похвал, а также склонностью к манипуляции окружающими. Давайте рассмотрим несколько примеров нарциссического поведения из фильмов.

1. Патрик Бейтмен («Американский психопат»)

Главный герой этого фильма – банковский служащий, который скрывает свою настоящую сущность за маской харизматичного и успешного человека. Он заботится только о своих интересах и игнорирует потребности других людей, что является классическим признаком нарциссистического типа личности.

2. Мирейлла Фоско («Изгой-один: Звездные войны. Истории»)

Мирейлла Фоско – лидер повстанческой группировки, которая использует любые средства для достижения своих целей. Она не признает авторитет других людей и даже своего командующего, игнорируя их мнение и инструкции. Такое поведение характерно для нарциссистических личностей.

3. Кайл Рен («Звездные войны: Пробуждение Силы»)

Кайл Рен – тёмный рыцарь первого ордена, который стремится к забвению прошлых ошибок своего деда – Дарт Вейдера. Он обладает высоким уровнем самомнения и жаждой контроля над окружающими, отказываясь признавать какие-либо ошибки или слабости.

В заключении можно сказать, что нарциссический тип личности может быть опасным для окружающих людей, если его хозяин не осознает свои недостатки и не работает над улучшением своего поведения. Кинематограф может быть полезным инструментом для изучения этого феномена и предупреждения возможных последствий его проявления в реальной жизни.`;
var ARTICLE_ID = 0;

async function getImagePrompt(input_prompt) {
  const apiUrl = "https://api.replicate.com/v1/predictions";
  const apiToken = process.env.REPLICATE_API_TOKEN;

  const requestData = {
    version: "7349c6ce7eb83fc9bc2e98e505a55ee28d7a8f4aa5fb6f711fad18724b4f2389",
    input: {
      prompt: input_prompt,
    },
  };

  const headers = {
    Authorization: `Token ${apiToken}`,
    "Content-Type": "application/json",
  };

  const config = {
    method: "post",
    url: apiUrl,
    headers: headers,
    data: requestData,
  };

  const response = await axios(config);
  const jsonResponse = response.data;
  const predictionId = jsonResponse.id;

  // check prediction status repeatedly until it succeeds
  let predictionStatus = "";
  let jsonResponseRes = {};
  while (predictionStatus !== "succeeded") {
    const config = {
      method: "get",
      url: `https://api.replicate.com/v1/predictions/${predictionId}`,
      headers: headers,
    };

    const responseRes = await axios(config);
    jsonResponseRes = responseRes.data;
    predictionStatus = jsonResponseRes.status;

    await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before checking again
  }
  const output = jsonResponseRes.output;
  const imagePrompt = output.split("\n")[0].trim();
  return imagePrompt;
  //   console.log(`Image prompt: ${imagePrompt}`);
}

async function translateText(input) {
  // Create a new instance of the Translate API client
  const translate = new Translate({
    projectId: "freud-online",
    keyFilename: "./freud-online-9ce1f75d5d28.json",
  });
  const targetLanguage = "en";

  try {
    // Use the Translate API to translate the input text
    const [translation] = await translate.translate(input, targetLanguage);

    // Return the translated text
    return translation;
  } catch (error) {
    console.error(`Error translating text: ${error}`);
    return null;
  }
}

//create user-friendly-url
const friendlyUrl = async (input) => {
  const filename = slugify(input, {
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: "ru",
    transliterate: true,
  });
  return filename;
};

const getImageFromChatGPT = async (prompt) => {
  try {
    const response = await axios({
      method: "post",
      url: "https://api.openai.com/v1/images/generations",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
      },
      data: {
        model: "image-alpha-001",
        prompt: prompt,
        num_images: 1,
        size: "512x512",
        response_format: "url",
      },
    });
    // console.log(response.data.data[0].url);
    return response.data.data[0].url;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = error.response.data.error.message;
      console.error(`Error: ${errorMessage}`);
      throw new Error(errorMessage); // throw error
      // handle error appropriately
    } else {
      console.error("error in ChatGTP", errorMessage);
      // handle other errors
      throw new Error(errorMessage); // throw error
    }
  }
};

const getImages = async (prompt, fileName) => {
  const OUTPUT_FILENAME = `${fileName}`;
  const OUTPUT_FILENAME_THUMB = `${fileName}-thumb`;
  const OUTPUT_FILENAME_OG = `${fileName}-og`;
  // const OUTPUT_PATH = `${__dirname}/${OUTPUT_FILENAME}`;

  const dirTempName = "C:\\Users\\Dimitri\\Apps\\SeoOpt\\images";
  const OUTPUT_PATH = `${dirTempName}\\${OUTPUT_FILENAME}.png`;
  const OUTPUT_PATH_THUMB = `${dirTempName}\\${OUTPUT_FILENAME_THUMB}.jpg`;
  const OUTPUT_PATH_OG = `${dirTempName}\\${OUTPUT_FILENAME_OG}.jpg`;

  const downloadImage = async (url, path) => {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
    });

    await fs.promises.writeFile(path, response.data);
  };

  const editImage = async () => {
    const image = sharp(OUTPUT_PATH);

    let outputPath = path.parse(OUTPUT_PATH_THUMB);
    let outputFilename = outputPath.name + ".jpg";
    let outputDir = outputPath.dir;

    try {
      await image
        .clone()
        .resize(150, 150)
        .jpeg({ quality: 60 })
        .toFile(path.join(outputDir, outputFilename));
    } catch (err) {
      console.error("Error processing image:", err);
    }

    // Create 1260x630 pixel image
    outputPath = path.parse(OUTPUT_PATH_OG);
    outputFilename = outputPath.name + ".jpg";
    outputDir = outputPath.dir;

    try {
      await image
        .clone()
        .resize(1260, 630)
        .jpeg({ quality: 60 })
        .toFile(path.join(outputDir, outputFilename));
    } catch (err) {
      console.error("Error processing image:", err);
    }

    // Return paths to the newly created images
    // return { thumbnailPath, largeImagePath };
    return;
  };

  const imageUrl = await getImageFromChatGPT(prompt);

  await downloadImage(imageUrl, OUTPUT_PATH);

  editImage()
    .then(() => {
      console.log(`Large image created at ${OUTPUT_FILENAME_OG}`);
    })
    .catch((err) => console.error(err));

  const output = {
    PATH_IMAGE_OG: OUTPUT_PATH_OG,
    PATH_IMAGE_OG_SERVER:
      PATH_IMAGE_SERVER_FOLDER + OUTPUT_FILENAME_OG + ".jpg",
    PATH_IMAGE_THUMB: OUTPUT_PATH_THUMB,
    PATH_IMAGE_THUMB_SERVER:
      PATH_IMAGE_SERVER_FOLDER + OUTPUT_FILENAME_THUMB + ".jpg",
  };

  console.log("Загружаем картинки на сервер");
  await ftp.uploadFileToFTP(output.PATH_IMAGE_OG, output.PATH_IMAGE_OG_SERVER);
  await ftp.uploadFileToFTP(
    output.PATH_IMAGE_THUMB,
    output.PATH_IMAGE_THUMB_SERVER
  );

  //   fs.unlink(PATH_IMAGE_OG, (err) => {
  //     if (err) throw err;
  //     console.log(`Successfully deleted ${PATH_IMAGE_OG}`);
  //   });
  //   fs.unlink(PATH_IMAGE_THUMB, (err) => {
  //     if (err) throw err;
  //     console.log(`Successfully deleted ${PATH_IMAGE_THUMB}`);
  //   });
  fs.unlink(OUTPUT_PATH, (err) => {
    if (err) throw err;
    console.log(`Successfully deleted ${OUTPUT_PATH}`);
  });

  return output;
};

const getOpenAiText = async (prompt, task) => {
  let content = "";
  if (task == 1) {
    content = `Действуй как SEO специалист, продвигающий статьи в топ поисковиков Yandex и Google. Составь короткое описание статьи по поисковому запросу: "${prompt}" для og:description. Описание не должно превышать 150 печатных знаков. В случае неясности, к какой сфере относится запрос, всегда выбирай сферу "психология". Не нужно в начале повторять задание или предисловие. Не вставляй описание в кавычки.`;
  } else {
    content = `Действуй как SEO специалист, продвигающий статьи в топ поисковиков Yandex и Google. Напиши статью в 300-500 знаков, состоящую из 3 абзацев, по поисковому запросу: "${prompt}". Каждое из слов поискового запроса должно встречаться в статье не менее 3 раз. Начинай сразу со статьи. Не нужно в начале повторять поисковый запрос. Не нужно писать заголовок. В случае неясности, к какой сфере относится запрос, всегда выбирай сферу "психология".`;
  }

  const messagePrompt = [
    {
      role: "user",
      content: content,
    },
  ];

  const params = {
    // model: "text-davinci-003",
    model: "gpt-3.5-turbo-0301",
    // prompt: prompt,
    messages: messagePrompt,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  };

  try {
    const response = await openai.createChatCompletion(params);
    const text = response.data.choices[0].message.content;
    return text;
    // console.log('response', response.data.choices[0].message.content);
  } catch (error) {
    console.error(
      `An error occurred while executing the OpenAI API: ${error.message}`
    );
    if (error.response) {
      console.error(
        `Server responded with status code ${error.response.status}:`
      );
      console.error(error.response.data);
    }
    throw new Error("Failed to get response from OpenAI API");
  }
};

const createArticle = async (
  urlAlias,
  textArticle,
  promptRus,
  pathImageThumbServer,
  mainUrl,
  mainPrompt,
  pathImageOgServer
  //textDesc
) => {
  //check of article exists
  const countUlr = await db_f.urlCheck(urlAlias);
  //entries with this url?
  if (countUlr > 0) {
    await db_f.urlDelete(urlAlias);
  }

  //create a new publishing date
  let currentDate = new Date();
  let timestampMinus6Hours = new Date(currentDate - 6 * 60 * 60 * 1000);
  let timestampString = timestampMinus6Hours
    .toISOString()
    .replace("T", " ")
    .substr(0, 19);

  /////////////create an article HTML code/////////////
  const html = await createMainHtml(
    textArticle,
    pathImageThumbServer,
    promptRus,
    mainUrl,
    mainPrompt
  );

  const images = `
  {"image_intro":"","image_intro_alt":"","image_intro_caption":"","float_intro":"","image_fulltext":"images\/projects\/apps\/shorts\/${urlAlias}-og.jpg#joomlaImage:\/\/local-images\/projects\/apps\/shorts\/${urlAlias}-og.jpg?width=1260&height=630","image_fulltext_alt":"","image_fulltext_caption":"","float_fulltext":""}
  `;

  // Create a new article
  const article = {
    title: promptRus,
    alias: urlAlias,
    introtext: html.TEXT_DESC, //textDesc,
    fulltext: html.TEXT_ARTICLE,
    images: images,
    state: 1,
    access: 1,
    catid: 142, // ID of the category where the article belongs
    created_by: 7, // ID of the user who created the article
    created: timestampString,
    publish_up: timestampString,
    publish_down: "9999-12-31 23:59:59",
  };

  const articleId = await db_f.urlCreate(article);
  return articleId;
};

const createMainHtml = async (
  textArticle,
  pathImageThumbServer,
  promptRus,
  mainUrl,
  mainPrompt
) => {
  const read_more_link = `
  <div
    id="read_more_section"
    style="
      overflow: hidden;
      background-color: rgba(55, 145, 55, 0.2);
      padding: 6px;
      border-radius: 4px;
      margin-top: 16px;
      margin-bottom: 16px;
    "
  >
    <div id="image_here" itemscope="" itemtype="http://schema.org/ImageObject">
      <a href="types/ear/analysis"
        ><img
          src="${convertFtpPathToHttpsUrl(pathImageThumbServer)}" 
          alt="${promptRus}"
          width="120"
          height="120"
          style="float: left; margin: 4px; margin-right: 6px; border-radius: 2px"
          itemprop="contentUrl"
        />
      </a>
    </div>
    <p style="margin-bottom: 0px;">
      Это только короткое описание для Вашего запроса
    </p>
    <h1 style="margin-top: 0px; margin-bottom: 0px; line-height: 100%;">${promptRus}</h1>
    <p style="margin-top: 0px;">
      Полную, всеобемлющую информацию читайте в статье
      <a href="${mainUrl}">"${mainPrompt}"</a>
    </p>
    <p style="margin-bottom: 0px;"><a href="${mainUrl}"><strong>ЧИТАТЬ ПОЛНУЮ СТАТЬЮ &gt;&gt;&gt;</strong></a></p>
  </div>
  `;
  const read_more_button = `
  <div id="read_more_line" style="overflow: hidden; background-color: rgba(55, 145, 55, 0.2); padding: 8px; border-radius: 4px; margin-bottom: 8px;">Продолжение - в статье <a href="${mainUrl}">"${mainPrompt}"</a></div>
  <div class="centering">
    <button 
      onclick="location.href='${mainUrl}'" 
      class="dima-button-bitrix"
    >Узнать больше и детальнее</button>
  </div>
  `;

  //remove newline in beginning
  const textNoNewline = textArticle.trimStart();
  // const textFinal = textNoNewline.replace(/\n\n/g, "</p><p>");

  // const inputText = "This is the first paragraph.\n\nThis is the second paragraph.\n\nThis is the third paragraph.";
  const inputText = textNoNewline;
  // Split input text into paragraphs
  const paragraphs = inputText.split("\n\n");

  // Store first paragraph in TEXT_DESC and remaining paragraphs in TEXT_ARTICLE
  const TEXT_DESC = paragraphs[0];
  const paragraphs_article = paragraphs.slice(1);

  // Add <p> tags to each paragraph
  const formattedParagraphs = paragraphs_article.map(
    (paragraph) => `<p>${paragraph}</p>`
  );

  // Add read more section to beginning of array
  formattedParagraphs.unshift(read_more_link);

  // Insert read more section after the first paragraph
  // formattedParagraphs.splice(1, 0, read_more_link);

  // Insert read more button after the last paragraph
  formattedParagraphs.push(read_more_button);
  // Add heading section at the beginning
  // formattedParagraphs.unshift(`<h1>${promptRus}</h1>`);
  // Join formatted paragraphs into a single string
  const TEXT_ARTICLE = formattedParagraphs.join("");

  // return (html = formattedHtml);
  return { TEXT_DESC, TEXT_ARTICLE };
};

const storeSeoUlr = async (seoObject) => {
  const countUlr = await db_d.urlCheck(seoObject.seo_url);
  //entries with this url?
  if (countUlr > 0) {
    await db_d.urlDelete(seoObject.seo_url);
  }
  await db_d.urlCreate(seoObject);
};

function convertFtpPathToHttpsUrl(input) {
  // Remove the leading slash and "www"
  const trimmed = input.replace(/^\/www\//, "");

  // Replace the remaining slashes with "https://"
  const output = `https://${trimmed.replace(/\//g, "/")}`;

  return output;
}

async function executeSteps(mainPrompt, mainUrl, seoPrompt) {
  MAIN_PROMPT = mainPrompt; // var MAIN_PROMPT = "Истероидный тип личности";
  MAIN_URL = mainUrl; // var MAIN_URL = "https://freud.online/types/eae/analysis";
  PROMPT_RUS = seoPrompt; // var PROMPT_RUS = "истероидный тип личности примеры известных людей";

  try {
    console.log("Создаем читабельный URL");
    URL_ALIAS = await friendlyUrl(PROMPT_RUS);
    console.log("Переводим текст");
    PROMPT_ENG = await translateText(PROMPT_RUS);
    console.log("Ищем затравку для картинок");
    PROMPT_IMAGE = await getImagePrompt(PROMPT_ENG);

    console.log("Генерируем и скачиваем картинки");
    try {
      const imageData = await getImages(PROMPT_IMAGE, URL_ALIAS);
      PATH_IMAGE_OG = imageData.PATH_IMAGE_OG;
      PATH_IMAGE_OG_SERVER = imageData.PATH_IMAGE_OG_SERVER;
      PATH_IMAGE_THUMB = imageData.PATH_IMAGE_THUMB;
      PATH_IMAGE_THUMB_SERVER = imageData.PATH_IMAGE_THUMB_SERVER;
    } catch (error) {
      console.error(`An error occurred while creating image`);
      return;
    }

    // console.log("Ищем короткое описание");
    // TEXT_DESC = await getOpenAiText(PROMPT_RUS, 1);
    console.log("Ищем текст статьи");
    try {
      TEXT_ARTICLE = await getOpenAiText(PROMPT_RUS, 2);
    } catch (error) {
      console.error(
        `An error occurred while getting the text: ${error.message}`
      );
      return;
    }
    console.log("Создаем статью на сайте");
    ARTICLE_ID = await createArticle(
      URL_ALIAS,
      TEXT_ARTICLE,
      PROMPT_RUS,
      PATH_IMAGE_THUMB_SERVER,
      MAIN_URL,
      MAIN_PROMPT,
      PATH_IMAGE_OG_SERVER
    );

    const seoObject = {
      main_url: MAIN_URL,
      main_prompt: MAIN_PROMPT,
      seo_url: URL_ALIAS,
      seo_prompt: PROMPT_RUS,
      image_prompt: PROMPT_IMAGE,
      image_thumb: PATH_IMAGE_THUMB_SERVER,
      image_og: PATH_IMAGE_OG_SERVER,
      article_id: ARTICLE_ID,
      article_desc: TEXT_DESC,
      article_text: TEXT_ARTICLE,
    };
    console.log("Сохраняем все данные в рабочую таблицу");
    await storeSeoUlr(seoObject);
    console.log("Индексируем в Гугле и Яндексе");
    (async () => {
      // try {
      const url_indexing = "https://freud.online/shorts/" + URL_ALIAS;
      const indexGoogle = await index_google.publishUrlForIndexing(
        url_indexing,
        "URL_UPDATED"
      );
      console.log(indexGoogle);
      const indexYandex = await index_yandex.publishUrlForIndexing(
        url_indexing
      );
      console.log("Все сделано!");
      // } catch (error) {
      //   console.error(error);
      // }
    })();

    // const url_indexing = "https://freud.online/shorts/" + URL_ALIAS;
    // const indexGoogle = await index_google.publishUrlForIndexing(
    //   url_indexing,
    //   "URL_UPDATED"
    // );
    // console.log(indexGoogle);
    // console.log("Все сделано!");
  } catch (error) {
    throw error;
  }
}

module.exports = {
  executeSteps,
  createMainHtml,
};
