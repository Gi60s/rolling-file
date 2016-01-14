"use strict";
var current     = require('./current-directory');
var CustomError = require('custom-error-instance');
var fs          = require('bluebird').promisifyAll(require('fs'));
var schema      = require('./rolling-file-schema');
var path        = require('path');
var Promise     = require('bluebird');

var Err = CustomError('RollingPathError');
Err.extend('index', { code: 'EINDEX'});


module.exports = FilePaths;


/**
 * Read the synced directory structure to determine what the next file name should be.
 * @param directoryPath
 * @param configuration
 * @returns {*}
 * @constructor
 */
function FilePaths(directoryPath, configuration) {
    return current(directoryPath).then(function(filePaths) {
        return FilePaths.current(filePaths, directoryPath, configuration);
    });
}

FilePaths.current = function(filePaths, directoryPath, configuration) {
    var config = schema.normalize(configuration);
    var rxString;
    var rx;
    var matches;

    // generate regular expression to test file names
    rxString = '^\\.\\d{4}-\\d{2}-\\d{2}-\\d{6}\\.\\d+\\.';
    if (config.fileExtension) rxString += config.fileExtension;
    rxString += '$';
    rx = RegExp(rxString);

    // get files that match the file name parameters for this configuration
    matches = filePaths.filter(function(fileName) {
        if (fileName.indexOf(config.fileName) !== 0) return false;
        return rx.test(fileName.substr(config.fileName.length));
    });

    return path.resolve(process.cwd(), directoryPath, getFileName(matches, config));
};

/**
 * Get the file name components from a string.
 * @param {string} fileName
 * @returns {object}
 */
FilePaths.components = function(fileName) {
    var rx = /^(?:([ \S]*?)\.)?(\d{4}-\d{2}-\d{2}-\d{6})(?:\.(\d+))?(?:\.([ \S]*?))?$/;
    var match = rx.exec(fileName);
    if (!match) return null;
    return {
        date: stringDate(match[2]),
        dateString: match[2],
        extension: match[4],
        fileName: match[1],
        index: match[3] ? parseInt(match[3]) : void 0
    };
};

/**
 * Generate a file name based on the configuration, date, and index passed in.
 * @param {object} configuration
 * @param {Date,number} date
 * @param {number} [index=0]
 */
FilePaths.fileName = function(configuration, date, index) {
    var config = schema.normalize(configuration);
    var result = '';

    if (config.fileName) result += config.fileName + '.';

    // set the date object to an interval value if an interval is specified
    if (config.interval) {
        date = intervalDate(date, config);
    }

    // add time stamp to the file name
    result += dateString(date);

    // add index
    if (config.interval && config.byteLimit) {
        if (arguments.length < 3) index = 0;
        if (isNaN(index)) throw new Err.index('File path index parameter must be a number when included in parameters.');
        result += '.' + index;
    }

    // add the file extension
    if (config.fileExtension) result += '.' + config.fileExtension;

    return result;
};

/**
 * Look through the store to determine which paths match the configuration.
 * @param {string[]} filePaths
 * @param {object} configuration
 * @returns {string[]}
 */
FilePaths.matches = function(filePaths, configuration) {
    var config = schema.normalize(configuration);
    return filePaths.filter(function(fileName) {
        var o = FilePaths.components(fileName);
        return ((!config.fileName && typeof o.fileName === 'undefined') || config.fileName === o.fileName) &&
            ((!config.fileExtension && typeof o.extension === 'undefined') || config.fileExtension === o.extension) &&
            ((!config.interval && typeof o.index === 'undefined') || (config.interval && typeof o.index !== 'undefined')) &&
            (!config.interval || stringDate(o.dateString).getTime() % config.interval === config.startOfDay);
    });
};

FilePaths.next = function(filePaths, directoryPath, configuration) {

};

function dateString(date) {
    return date.getFullYear() + '-' +
        leadingZeros(date.getMonth() + 1, 2) + '-' +
        leadingZeros(date.getDate(), 2) + '-' +
        leadingZeros(date.getHours(), 2) +
        leadingZeros(date.getMinutes(), 2) +
        leadingZeros(date.getSeconds(), 2);
}

function intervalDate(date, config) {
    var now = typeof date === 'number' ? date : date.getTime();
    var startOfDay = getStartOfDay() + config.startOfDay;
    var interval = Math.floor((now - startOfDay) / config.interval);
    return new Date(new Date(startOfDay).getTime() + interval * config.interval);
}

/**
 * Convert string to date.
 * @param str
 * @returns {Date}
 */
function stringDate(str) {
    return new Date(
        parseInt(str.substr(0, 4)),
        parseInt(str.substr(5, 2)) - 1,
        parseInt(str.substr(8, 2)),
        parseInt(str.substr(11, 2)),
        parseInt(str.substr(13, 2)),
        parseInt(str.substr(15, 2))
    );
}












/**
 * Get a string that represents the date component of a file name.
 * @param {Date} date
 * @returns {string}
 */
function getDateFileNameComponent(date) {
    return date.getFullYear() + '-' +
        leadingZeros(date.getMonth() + 1, 2) + '-' +
        leadingZeros(date.getDate(), 2) + '-' +
        leadingZeros(date.getHours(), 2) +
        leadingZeros(date.getMinutes(), 2) +
        leadingZeros(date.getSeconds(), 2) + '.';
}

/**
 * Get the file name to use based on the configuration and the current time.
 * @param {object} config
 * @returns {string}
 */
function getFileName(directoryFiles, config) {
    var date;
    var filePathStart = config.fileName + '.';
    var interval;
    var match;
    var matches;
    var now;
    var startOfDay;

    //if a time limit is specified then determine what the file path should be for the current file
    if (config.timeLimit) {
        now = Date.now();
        startOfDay = getStartOfDay() - config.startOfDay;
        interval = Math.floor((now - startOfDay) / config.timeLimit);
        date = new Date(new Date(startOfDay).getTime() + interval * config.timeLimit);
        filePathStart += getDateFileNameComponent(date);
    }

    // get files that match the expected start of file name
    matches = directoryFiles
        .filter(function(file) {
            return file.name.indexOf(filePathStart) === 0;
        });

    // if there are matches, check the file size
    if (matches.length > 0) {
        match = matches[matches.length - 1];
        if (match.size < config.byteLimit) return match.path;
    }

    // if there is no time limit then we need to add the timestamp to the file still
    if (!config.timeLimit) filePathStart += getDateFileNameComponent(new Date());

    // no matches so send back the path that we have
    return filePathStart + '0' + (config.fileExtension ? '.' + config.fileExtension : '');
}

/**
 * Get a number that represents milliseconds for the start of the day.
 * @returns {number}
 */
function getStartOfDay() {
    var ms = Date.now();
    var msPerDay = 86400 * 1000;
    return ms - (ms % msPerDay) + ((new Date).getTimezoneOffset() * 60 * 1000);
}

/**
 * Add leading zero's to a value
 * @params {*} value
 * @params {number} length
 * @returns {string}
 */
function leadingZeros(value, length) {
    value = value + '';
    while (value.length < length) {
        value = '0' + value;
    }
    return value;
}