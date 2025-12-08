var mysql = require('mysql');

var pool = mysql.createPool({
    host            : process.env.DBHOST,
    database        : process.env.DBNAME,
    user            : process.env.DBUSER,
    password        : process.env.DBPASS,
    connectionLimit : 10
});

pool.getConnection((err) => {
    if (err){
        console.log('Connection error: ' + err);
    }else{
        console.log('Connected to MYSQL database.');
    }
});

module.exports = pool;