var util = require("util");
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "simnet",
  connectionLimit: 10,
});

var getConnection = function (callback) {
  pool.getConnection(function (err, connection) {
    callback(err, connection);
  });
};

module.exports = getConnection;

// Promisify for Node.js async/await.
// pool.query = util.promisify(pool.query);

// module.exports = pool;
