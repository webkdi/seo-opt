const db_d = require("./components/SeoArticle/Database_datico");
const db_f = require("./components/SeoArticle/Database_freud");
const create = require("./components/SeoArticle/SeoArticleCreate");
const words_y = require("./components/SeoArticle/Wordstat_yandex");
const words_g = require("./components/SeoArticle/Wordstat_google");

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
