"use strict";
var fs              = require('fs');
var path            = require('path');
var Promise         = require('bluebird');

var readDir = Promise.promisify(fs.readdir);
var stat = Promise.promisify(fs.stat);

module.exports = function(directoryPath) {
    return readDir(directoryPath)
        .then(function(fileNames) {
            var promise;
            var promises = [];
            var results = [];

            fileNames.forEach(function(fileName) {
                promise = stat(path.resolve(directoryPath, fileName))
                    .then(function(stats) {
                        if (stats.isFile()) results.push(fileName);
                    });
                promises.push(promise);
            });

            return Promise.all(promises)
                .then(function() {
                    return results;
                });
        });
};