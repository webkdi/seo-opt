require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_FREUD_USER,
  password: process.env.DB_FREUD_PASSWORD,
  database: process.env.DB_FREUD_DB,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
});

async function urlCheck(url) {
  const sql = `SELECT id FROM freud.main_content where alias=?`;
  const values = [url];
  const [result] = await pool.execute(sql, values);
  const length = result.length;
  console.log(`In Freud, there are ${length} entries with url "${url}".`);
  return length;
}

async function urlDelete(url) {
  const sql = `DELETE FROM freud.main_content WHERE alias=?;`;
  const values = [url];
  const [result] = await pool.execute(sql, values);
  console.log(`In Freud, ${result.affectedRows} entries for ${url} deleted.`);
  return;
}

async function urlCreate(article) {
  const sql = `
  INSERT INTO main_content (title, alias, introtext, \`fulltext\`, images, state, access, catid, created_by, created, publish_up, publish_down)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    article.title,
    article.alias,
    article.introtext,
    article.fulltext,
    article.images,
    article.state,
    article.access,
    article.catid,
    article.created_by,
    article.created,
    article.publish_up,
    article.publish_down,
  ];

  try {
    const [result] = await pool.execute(sql, values);
    console.log(`New article created with ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.log(error.sqlMessage);
    return 0;
  }
}

async function updateHtml(id, html) {
  const sql = `
  UPDATE freud.main_content 
  SET 
  \`introtext\` = ?,
  \`fulltext\` = ?
  WHERE id = ?;
  `;
  const values = [html.TEXT_DESC, html.TEXT_ARTICLE, id];
  const [result] = await pool.execute(sql, values);
  return result;
}

module.exports = {
  urlCheck,
  urlDelete,
  urlCreate,
  updateHtml,
};
