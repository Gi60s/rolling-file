/*
 This file keeps a current list of file paths for a specific directory, removing the need to read the entire
 directory every time.
  */
"use strict";
var chokidar    = require('chokidar');
var path        = require('path');
var Promise     = require('bluebird');

var watchers = {};

/**
 * The the file names for all files within the specified directory.
 * @param {string} directoryPath
 * @returns {Promise}
 */
exports.watch = function(directoryPath) {
    var absDirectoryPath = path.resolve(process.cwd(), directoryPath);
    if (!watchers.hasOwnProperty(absDirectoryPath)) {
        watchers[absDirectoryPath] = new Promise(function(resolve, reject) {
            var filePaths = [];
            var watcher = chokidar.watch(absDirectoryPath, { depth: 0 });

            watcher.on('add', function(filePath) {
                filePaths.push(path.basename(filePath));
                filePaths.sort();
            });

            watcher.on('unlink', function(filePath) {
                var index = filePaths.indexOf(filePath);
                if (index !== -1) filePaths.splice(index, 1);
            });

            watcher.on('ready', function() {
                resolve(filePaths);
            });

        });
    }
    return watchers[absDirectoryPath];
};