var mysql = require('mysql');

console.log('Showing mySQL URL: ', process.env.MYSQL_URL);
var dbConnection = mysql.createConnection(process.env.MYSQL_URL);

//Create Recipe database if it doesn't exist
exports.createDatabase = function () {
  return new Promise(function(resolve, reject) {
    dbConnection.connect(function(err) {
      if (err) {
        console.error('There was an error while connecting to MySQL', err);
        reject(err);
      } else {
        console.log('Welcome to MySQL');
        resolve();
      }
    });
  })
  .then(function() {
    return new Promise(function(resolve, reject) {
        dbConnection.query('CREATE DATABASE IF NOT EXISTS ' + 'recipes', function(err) {
          if (err) {
            console.error('There was an error when creating the database', err);
            reject(err);
          } else {
            console.log('Recipe database is present');
            dbConnection.end();
            resolve();
          }
        });
      });
    });
  };
