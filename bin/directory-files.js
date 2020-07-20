"use strict";
const { readDir, stat } = require('./fsp');
const path = require('path');

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
