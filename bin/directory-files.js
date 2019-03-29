"use strict";
const fs              = require('fs');
const path            = require('path');
const Promise         = require('bluebird');

const readDir = Promise.promisify(fs.readdir);
const stat = Promise.promisify(fs.stat);

module.exports = function(directoryPath) {
    return readDir(directoryPath)
        .then(function(fileNames) {
            let promise;
            const promises = [];
            const results = [];

            fileNames.forEach(function(fileName) {
                promise = stat(path.resolve(directoryPath, fileName))
                    .then(function(stats) {
                        if (stats.isFile()) results.push(fileName);
                    }, function() {});
                promises.push(promise);
            });

            return Promise.all(promises)
                .then(function() {
                    return results;
                });
        });
};
