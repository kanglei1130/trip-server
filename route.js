var path = require('path');     //used for file path


var fs = require('fs-extra');
var jwt = require('jsonwebtoken');
var util = require('util');
var formidable = require('formidable');
var sqlite3 = require('sqlite3').verbose();



var searchtrips = function (req, res, next) {
  var userid = req.body.userid;
  var start = req.body.start;
  var end = req.body.end;
  var trips = {};
  console.log(req.body);
  mysqltrip.searchTrips(userid, start, end, function(err, rows){
    if(err) {
      var msg = {status: 'fail', data: err.toString()};
      res.json(msg);
      return;
    }
    for(var i = 0; i < rows.length; ++i) {
      var row = rows[i];
      if(row.tripid in trips) {
        var gps = {time: row.time, lat: row.lat, lng: row.lng, alt: row.alt, curspeed: row.curspeed, curscore: row.curscore, curevent: row.curevent}; 
        trips[row.tripid].gps.push(gps);
      } else {
        var trip = new Trip();
        trip.fromObject(row);  
        trip.gps = [];
        var gps = {time: row.time, lat: row.lat, lng: row.lng, alt: row.alt, curspeed: row.curspeed, curscore: row.curscore, curevent: row.curevent};
        trip.gps.push(gps);
        trips[row.tripid] = trip; 
      }
    }
    var msg = {status: 'success', data:trips};
    res.json(msg);
  });  
};

var showtrips = function (req, res, next) {
  var userid = req.body.userid;
  var trips = {};
  mysqltrip.loadGPS(userid, function(err, rows){
    if(err) {
      var msg = {status: 'fail', data: err.toString()};
      res.json(msg);
      return;
    }
    for(var i = 0; i < rows.length; ++i) {
      var row = rows[i];
      if(row.tripid in trips) {
        var gps = {time: row.time, lat: row.lat, lng: row.lng, alt: row.alt, speed: row.speed, score: row.score, brake: row.event}; 
        trips[row.tripid].gps.push(gps);
      } else {
        var trip = new Trip();
        trip.fromObject(row);  
        trip.gps = [];
        var gps = {time: row.time, lat: row.lat, lng: row.lng, alt: row.alt, speed: row.speed, score: row.score, brake: row.event};
        trip.gps.push(gps);
        trips[row.tripid] = trip; 
      }
    }
    var msg = {status: 'success', data:trips};
    res.json(msg);
  }); 
};


var upload = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    var file = files.uploads;
    mysqluser.getUserIDByEmail(fields.email, function(err, id){
      if(err) {
        console.log(err);
        var msg = {status: 'fail', data: err.toString()};
        res.json(msg);
        return;
      } 
      var folder = path.join(__dirname, '../uploads/' + id + '/');
      fs.mkdirp(folder, function (err) {
        if(err) {
          console.log(err);
          var msg = {status: 'fail', data: err.toString()};
          res.json(msg);
          return;
        }
        //insert the data into database
        fields.userid = id;

        insertTripIntoDatabase(fields, file.path, function(err) {/*we do not care about err at this point*/});
        //backup the data
        fs.copy(file.path, path.join(folder, file.name), function(err){
          if (err) {
            console.error(err);
            var msg = {status: 'fail', data: err.toString()};
            res.json(msg);
          } else {
            var msg = {status: 'success', data: ''};
            res.json(msg);
          } 
        }); 
      });
    });
  });//end of paring form
}


/**
 * synchronize deletion with Android
 * handle two cases:
 * 1. android delete ---> send to server, server delete
 * 2. server delete ---> send to android --> step 1 
 * 
 */
var androidsync = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) { 
    var tnames = JSON.parse(fields.tripnames);
    var deviceid = fields.deviceid;
    mysqltrip.androidDeleteTrip(deviceid, tnames, function(err, sta) {
      if(err) {
        var msg = {status: 'fail', data: err.toString()};
        res.json(msg); 
        return;
      } 
      mysqltrip.getDeletedTrips(deviceid, function(err, rows){
        if(err) {
          var msg = {status: 'fail', data: err.toString()};
          res.json(msg); 
          return;
        }
        console.log(rows);
        var webdeletes = [];
        for(var i = 0; i < rows.length; ++i) {
          webdeletes.push(rows[i].starttime);
        }
        var msg = {status: 'success', data: JSON.stringify(webdeletes)};
        res.json(msg); 
      });    
    });
  });//end of paring form
}

var insertTripIntoDatabase = function (fields, dbfile, callback) {
  var trip = new Trip();
  trip.fromObject(fields);
  mysqltrip.insertTrip(trip, function(err, tripid) {
    if(err) {
      if(err.code == "ER_DUP_ENTRY") {
        callback(null);
      } else {
        callback(err);
      }
      return;
    }
    var db = new sqlite3.Database(dbfile);
    db.all("select * from gps;", function(err, rows) {
      if (err) { 
        console.log(err); 
        callback(err);
      } else {
        mysqltrip.insertGPS(tripid, rows, function(err){
          if(err) {
            console.log(err);
          }
          callback(err);
        }); 
      }
    });
  });
    //get userid etc. by email 
}
 




module.exports.searchtrips = searchtrips;






