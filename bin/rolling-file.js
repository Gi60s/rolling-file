"use strict";
// Manages a file write stream that automatically creates a new file once the file size limit has been reached.
var CustomError = require('custom-error-instance');
var dirFiles    = require('./directory-files');
var fs          = require('fs');
var path        = require('path');
var rfName      = require('./rolling-file-name');
var schema      = require('./rolling-file-schema');

var Err = CustomError('RollingFileError');
Err.extend('terminal', { message: 'The datastream is terminal and cannot be written to.', code: 'ETERM' });
Err.extend('overflow', { message: 'Data to write exceeds max file size.', code: 'EOVER' });

var store = {};

/**
 * Get an interface that allows endless writing to a file system.
 * @param {string} directoryPath
 * @param {object} [configuration]
 * @returns {object}
 */
module.exports = function(directoryPath, configuration) {
    var config = schema.normalize(configuration || {});
    var key = directoryPath + JSON.stringify(config);
    if (!store.hasOwnProperty(key)) store[key] = getFactory(directoryPath, configuration);
    return store[key];
};

function getFactory(directoryPath, configuration) {
    var buffer = [];
    var config = schema.normalize(configuration);
    var end;
    var factory = {};
    var findingPath = false;
    var size = 0;
    var stream;
    var terminal;

    function createNewStream() {
        if (!findingPath) {
            findingPath = dirFiles(directoryPath)
                .then(function(fileNames) {
                    var fileName = rfName(fileNames, configuration);
                    var fullPath;
                    var item;
                    var wrote;

                    // get the write stream file path
                    while (fileNames.indexOf(fileName) !== -1) fileName = rfName.increment(fileName);
                    fullPath = path.resolve(directoryPath, fileName);

                    // set globals to initial write state
                    end = config.interval ? rfName.components(fileName).date.getTime() + config.interval : null;
                    findingPath = false;
                    size = 0;
                    stream = fs.createWriteStream(fullPath, { flags: 'a', encoding: config.fileEncoding });

                    //empty the buffer into the stream
                    while (stream && buffer.length > 0) {
                        item = buffer[0];
                        wrote = write(item.data, item.callback, false);
                        if (wrote) buffer.shift();
                    }
                }, function(err) {
                    while (buffer.length) {
                        var item = buffer.shift();
                        if (typeof item.callback === 'function') item.callback(err);
                    }
                    terminal = true;
                });
        }
    }

    function write(data, callback, writeToBuffer) {
        var len;
        var newData;
        var newSize;

        // if the stream is closed then open a stream and write to the buffer
        if (!stream) {
            if (!findingPath) createNewStream();
            if (writeToBuffer) buffer.push({ data: data, callback: callback });
            return false;
        }

        // determine space requirements
        data = '' + data;
        newData = size > 0 ? config.delimiter + data : data;
        len = data.length;
        newSize = size + len;

        // if the data size is greater than max file size then throw an error
        if (len > config.byteLimit) {
            if (typeof callback === 'function') callback(new Err.overflow());
            return true;
        }

        // if the remaining file space wont fit the content or time has expired then start a new stream
        if (newSize > config.byteLimit || (end && end <= Date.now())) {
            stream.end();
            stream = null;
            createNewStream();
            if (writeToBuffer) buffer.push({ data: data, callback: callback });
            return false;
        }

        // write to the active stream
        stream.write('' + newData, callback);
        size = newSize;
        return true;
    }

    factory.write = function(data, callback) {
        if (!terminal) {
            write(data, callback, true);
        } else if (typeof callback === 'function') {
            callback(new Err.terminal());
        }
    };

    factory.end = function(data, callback) {
        factory.write(data, callback);
        if (stream) stream.end();
        terminal = true;
    };

    return factory;
}