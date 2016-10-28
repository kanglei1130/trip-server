var express = require('express');    //Express Web Server 
var path = require('path');     //used for file path
var fs = require('fs-extra');       //File System - for file manipulation
var util = require('util');
var sqlite3 = require('sqlite3').verbose();

/*
var dir = "./databases/6c9b21c5b0db3074/";
var files = fs.readdirSync(dir);
*/

console.log("this is a log");

var test = function(input, callback) {
  var err = new Error("test");
  callback(err);
}

var input = {'test': 123};
test(input, function(err){
  Error.captureStackTrace(input);
  console.log(err.stack);
});

