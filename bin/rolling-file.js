"use strict";
// Manages a file write stream that automatically creates a new file once the file size limit has been reached.
const CustomError = require('custom-error-instance');
const dirFiles    = require('./directory-files');
const fs          = require('fs');
const path        = require('path');
const rfName      = require('./rolling-file-name');
const schema      = require('./rolling-file-schema');

const Err = CustomError('RollingFileError');
Err.terminal = CustomError(Err, { message: 'The datastream is terminal and cannot be written to.', code: 'ETERM' });
Err.overflow = CustomError(Err, { message: 'Data to write exceeds max file size.', code: 'EOVER' });

const store = {};

/**
 * Get an interface that allows endless writing to a file system.
 * @param {string} directoryPath
 * @param {object} [configuration]
 * @returns {object}
 */
module.exports = function(directoryPath, configuration) {
    const config = schema.normalize(configuration || {});
    const key = directoryPath + JSON.stringify(config);
    if (!store.hasOwnProperty(key)) store[key] = getFactory(directoryPath, configuration);
    return store[key];
};

function getFactory(directoryPath, configuration) {
    const buffer = [];
    const config = schema.normalize(configuration);
    const factory = {};
    let end;
    let findingPath = false;
    let size = 0;
    let stream;
    let terminal;

    function createNewStream() {
        if (!findingPath) {
            findingPath = dirFiles(directoryPath)
                .then(function(fileNames) {
                    let fileName = rfName(fileNames, configuration);
                    let fullPath;
                    let item;
                    let wrote;

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
                        const item = buffer.shift();
                        if (typeof item.callback === 'function') item.callback(err);
                    }
                    terminal = true;
                });
        }
    }

    function write(data, callback, writeToBuffer) {
        let len;
        let newData;
        let newSize;

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
