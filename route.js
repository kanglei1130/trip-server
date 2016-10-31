var path = require('path');     //used for file path


var fs = require('fs-extra');
var jwt = require('jsonwebtoken');
var util = require('util');
var formidable = require('formidable');
var sqlite3 = require('sqlite3').verbose();


var loadTripFromSqlite = function(req, res, next) {
  const data = req.body;
  const path = data.path;
  const db = new sqlite3.Database(dbfile);
  db.all("select * from gps;", function(err, rows) {
    const msg = {};
    if (err) { 
      console.log(err); 
      msg = {status: 'err', data: null};
    } else {
      for(const i = 0; i < rows.length; ++i) {
        const row = rows[i];
        console.log(row);
      }
      msg = {status: 'success', data:rows};

    }    
    res.json(msg);
  });
}
 
var loadTripFromFile = function(req, res, next) {
  const dat = new  

}



module.exports.loadtrip = loadTripFromSqlite;






