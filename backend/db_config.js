const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hris_earist',
  port: 3306
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const createConnection = () => mysql.createConnection(dbConfig);

module.exports = {
  dbConfig,
  pool,
  createConnection
};
