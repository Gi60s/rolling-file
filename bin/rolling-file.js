"use strict";
// Manages a file write stream that automatically creates a new file once the file size limit has been reached.
var fs          = require('fs');
var path        = require('path');
var rfPath      = require('./rolling-file-path');

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