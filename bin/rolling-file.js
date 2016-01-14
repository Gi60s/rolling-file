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

module.exports = function(directoryPath, configuration) {
    var activeFilePath;
    var buffer = [];
    var config = schema.normalize(options);
    var delimiterLength = config.delimiter.length;
    var factory = {};
    var findingPath = false;
    var size = 0;
    var stream;
    var terminal;

    function createNewStream() {
        if (!findingPath) {
            findingPath = dirFiles(directoryPath)
                .then(function(fileNames) {
                    var fileName = rfName(fileNames, config);
                    var fullPath;
                    var item;
                    var wrote;

                    // get the write stream file path
                    if (fileName === activeFilePath) fileName = rfName.increment(fileName);
                    fullPath = path.resolve(directoryPath, fileName);

                    // set globals to initial write state
                    activeFilePath = fullPath;
                    findingPath = false;
                    size = 0;
                    stream = fs.createWriteStream(fullPath, { flags: 'a', encoding: config.fileEncoding });

                    //empty the buffer into the stream
                    while (stream && buffer.length > 0) {
                        item = buffer[0];
                        wrote = write(item.data, item.callback, false);
                        if (wrote) buffer.shift();
                    }
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
        newData = size > 0 ? config.delimiter + data : data;
        len = data.length;
        newSize = size + len;

        // if the data size is greater than max file size then throw an error
        if (len > config.byteLimit) {
            if (typeof callback === 'function') callback(new Err.overflow());
            return true;
        }

        // if the remaining file space wont fit the content then start a new stream
        if (newSize > config.byteLimit) {
            stream = null;
            createNewStream();
            buffer.push({ data: data, callback: callback });
            return false;
        }

        // write to the active stream
        stream.write(newData, callback);
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
        terminal = true;
    };

    return factory;
};







var rxTime = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
var rxNumUnit = /^(\d+(?:\.\d+)?) *([kmgtpezy])?/i;

// TODO: this needs to hand back the same stream for same configurations

module.exports = function(directoryPath, configuration) {
    var activeFilePath;
    var buffer = [];
    var config = schema.normalize(options);
    var size = 0;
    var stream;
    var terminal;

    //create the stream to use
    createNewStream();

    function createNewStream() {
        rfPath(directoryPath, config)
            .then(function(filePath) {
                return fs.statAsync(filePath)
                    .then(function(stats) {
                        var item;

                        //if the old active file path is the same as the new file path then create a new index
                        if (activeFilePath === filePath) filePath = getNextFilePath(filePath, config.fileExtension);

                        //store the initial size and file path
                        activeFilePath = filePath;
                        size = stats.size;

                        //create the stream
                        stream = fs.createWriteStream(filePath, {
                            flags: 'a',
                            encoding: config.fileEncoding
                        });

                        //empty the buffer into the stream
                        while (stream && buffer.length > 0) {
                            item = buffer.shift();
                            write(item.data, item.callback);
                        }
                    });
            });
    }

    function end(data, callback) {

    }

    function write(data, callback) {
        var len = data.length;
        var newSize = size + len;
        if (!stream) {
            buffer.push({ data: data, callback: callback });
        } else if (newSize > config.byteLimit) {
            stream = null;
            buffer.push(data);
        } else if (newSize === config.byteLimit) {
            stream.write(data + '\n');
            createNewStream();
        } else {
            stream.write(data + '\n');
            createNewStream();
        }
    }

    return {
        end: function(data, callback) {
            //if (!terminal)
        },
        write: function(data, callback) {
            write(data, callback);
        }
    }
};

function getNextFilePath(filePath, ext) {
    var match;
    var string;

    string = path
        .basename(filePath, ext ? '.' + ext : '')
        .substring(config.fileName.length + 1);
    match = /^(\d{4}-\d{2}-\d{2}-\d{6}\.)(\d+)$/.exec(dateString);

    return match[1] + (parseInt(match[2]) + 1);
}