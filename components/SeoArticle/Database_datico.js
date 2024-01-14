require("dotenv").config();

const mysql = require("mysql2");

const pool = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_DATICO_USER,
    password: process.env.DB_DATICO_PASSWORD,
    database: process.env.DB_DATICO_DB,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
  })
  .promise();

async function urlCheck(url) {
  const sql = `SELECT id FROM datico.seo_shorts where seo_url=?`;
  const values = [url];
  const [result] = await pool.execute(sql, values);
  const length = result.length;
  console.log(`There are ${length} entries with url "${url}".`);
  return length;
}

async function promptCheck(prompt) {
  const sql = `SELECT id FROM datico.seo_shorts where seo_prompt=?`;
  const values = [prompt];
  const [result] = await pool.execute(sql, values);
  const length = result.length;
  console.log(`There are ${length} entries with prompt "${prompt}".`);
  return length;
}

async function urlDelete(url) {
  const sql = `DELETE FROM datico.seo_shorts WHERE seo_url=?;`;
  const values = [url];
  const [result] = await pool.execute(sql, values);
  console.log(`${result.affectedRows} entries for ${url} deleted.`);
  return;
}

async function urlCreate(seoObject) {
  const sql = `
  INSERT INTO datico.seo_shorts (seo_url, main_prompt, main_url, seo_prompt, image_prompt, image_thumb, image_og, article_id, article_text)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    seoObject.seo_url,
    seoObject.main_prompt,
    seoObject.main_url,
    seoObject.seo_prompt,
    seoObject.image_prompt,
    seoObject.image_thumb,
    seoObject.image_og,
    seoObject.article_id,
    seoObject.article_text,
  ];
  try {
    const [result] = await pool.execute(sql, values);
    console.log(`New seo created with ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.log(error.sqlMessage);
    return 0;
  }
}

async function tasksGetAll() {
  const sql = `
  select * from seo_shorts_tasks;
  `;
  try {
    const [result] = await pool.execute(sql);
    return result;
  } catch (error) {
    console.log(error.sqlMessage);
    return [];
  }
}

async function urlGetAll() {
  const sql = `
  SELECT * FROM seo_shorts
  `;
  try {
    const [result] = await pool.execute(sql);
    return result;
  } catch (error) {
    console.log(error.sqlMessage);
    return [];
  }
}

async function tasksDeleteDone(id) {
  const sql = `
  DELETE FROM datico.seo_shorts_tasks WHERE id=?
  `;
  const values = [id];
  try {
    const [result] = await pool.execute(sql, values);
    console.log(`Seo task with ID ${id} deleted`);
    return result.insertId;
  } catch (error) {
    console.log(error.sqlMessage);
    // return 0;
    throw error;
  }
}

async function updateHtml(articleId, articleDesc, articleText) {
  const sql = `
  UPDATE datico.seo_shorts 
  SET 
  \`article_desc\` = ?,
  \`article_text\` = ?
  WHERE article_id = ?;
  `;
  const values = [articleDesc, articleText, articleId];
  const [result] = await pool.execute(sql, values);
  return result;
}

module.exports = {
  urlCheck,
  promptCheck,
  urlDelete,
  urlCreate,
  urlGetAll,
  tasksGetAll,
  tasksDeleteDone,
  updateHtml,
};
