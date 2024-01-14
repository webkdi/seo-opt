const db_d = require("./components/SeoArticle/Database_datico");
const db_f = require("./components/SeoArticle/Database_freud");
const create = require("./components/SeoArticle/SeoArticleCreate");
const words_y = require("./components/SeoArticle/Wordstat_yandex");
// const words_g = require("./components/SeoArticle/Wordstat_google");
// const people = require("./components/SeoArticle/google_people_api");

async function runTasks() {
  const tasks = await db_d.tasksGetAll();
  for (let i = 0; i < tasks.length; i++) {
    const start = Date.now(); // Get the current time in milliseconds

    // for (let i = 0; i < 3; i++) {
    const task = tasks[i];
    const { main_prompt, main_url, seo_prompt, id } = task;
    try {
      console.log("executing: ", main_prompt, main_url, seo_prompt, id);
      const alreadyExist = await db_d.promptCheck(seo_prompt);
      if (alreadyExist == 0) {
        await create.executeSteps(main_prompt, main_url, seo_prompt);
      }
      await db_d.tasksDeleteDone(id);
    } catch (err) {
      console.error(`Error executing task ${i}:`, err);
      // continue with the next task
      continue;
    }

    const end = Date.now(); // Get the current time in milliseconds
    const executionTime = (end - start) / 1000; // Calculate the execution time in seconds
    console.log(`Execution time: ${executionTime} seconds`);
  }
}
//основная процедура
// runTasks();

async function updateHtml() {
  const urls = await db_d.urlGetAll();
  const filtered = urls;
  // .filter((item) => item.main_prompt.includes("Маниакальный"))
  // .slice(0, 2);
  for (let i = 0; i < filtered.length; i++) {
    const seo = filtered[i];
    const url = "https://freud.online/shorts/" + seo.seo_url;
    const articleId = seo.article_id;
    const html = await create.createMainHtml(
      seo.article_text,
      seo.image_thumb,
      seo.seo_prompt,
      seo.main_url,
      seo.main_prompt
    );
    const update = await db_f.updateHtml(articleId, html);
    // const update_datico = await db_d.updateHtml(articleId, '_', seo.article_text);
    console.log(`${update.affectedRows} record updated for url: ${url}`);
  }
}
// updateHtml();

async function indexAllInYandex() {
  const urls = await db_d.urlGetAll();
  const filtered = urls;
  // urls
  // .filter((item) => item.main_prompt.includes("Маниакальный"))
  // .slice(0, 2);

  const index_yandex = require("./components/SeoArticle/Indexing_yandex");

  for (let i = 0; i < filtered.length; i++) {
    const seo = filtered[i];
    const url = "https://freud.online/shorts/" + seo.seo_url;
    const articleId = seo.article_id;
    const update = await index_yandex.publishUrlForIndexing(url);
  }
}
// indexAllInYandex();

async function indexAllInBing() {
  const index_bing = require("./components/SeoArticle/Indexing_bing");
  const url =
    "https://freud.online/shorts/primery-personazhej-s-psihopaticheskim-tipom-lichnosti";
  const update = await index_bing.publishUrlForIndexing(url);
}
// indexAllInBing();

async function getWords() {
  const words = await words_y.CreateNewWordstatReport();
}
// getWords();


async function updateArticlesMetaDesc() {
  let articles = await db_f.getArticlesWoMetadesc();
  articles = articles.slice(0, 2);
  for (const article of articles) {
    const regex = /(<([^>]+)>)/ig;
    let newMeta = article.introtext.replace(regex, "");
    newMeta = newMeta.replace(/&nbsp;/g, ' ').replace(/\r?\n|\r/g, ' ').trim();
    const lg = newMeta.length;
    if (lg > 300) {
      let lastSpaceIndex = newMeta.lastIndexOf(' ', 296);
      newMeta = newMeta.substring(0, lastSpaceIndex) + ' ...';
    } else if (lg < 30) { 
      console.log("id:", article.id, "link:",`https://freud.online/articles/${article.alias}`);
      console.log(article,"\n");
      continue; 
    }
    const updateDesc = await db_f.updateArticleMedaDesc(article.id, newMeta)

    // console.log(`"${article.introtext}"`);
    // console.log(`"${newMeta}"`);
    console.log("id:", article.id, "link:",`https://freud.online/articles/${article.alias}`);
    console.log(newMeta,"\n");

  }
}
// updateArticlesMetaDesc();