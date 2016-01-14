"use strict";
var CustomError = require('custom-error-instance');
var schema      = require('./rolling-file-schema');

var Err = CustomError('RollingPathError');
Err.extend('index', { code: 'EINDEX'});
Err.extend('name', { message: 'Invalid file name.', code: 'ENAME'});


module.exports = FileName;


/**
 * Look through the provided array of names for the one that matches the date and configuration. If
 * one is not found then a new file name will be generated.
 * @param {string[]} fileNames
 * @param {object} configuration
 * @returns {string}
 */
function FileName(fileNames, configuration, date) {
    var matches;
    if (!date || !(date instanceof Date)) date = new Date();
    matches = FileName.matches(fileNames, configuration, date);
    return matches.length > 0 ? matches.pop().full :  FileName.fileName(configuration, date, 0);
}

/**
 * Get the file name components from a string.
 * @param {string} fileName
 * @returns {object}
 */
FileName.components = function(fileName) {
    var rx = /^(?:([ \S]*?)\.)?(\d{4}-\d{2}-\d{2}-\d{6})(?:\.(\d+))?(?:\.([ \S]*?))?$/;
    var match;
    if (typeof fileName !== 'string') throw new Err.name();
    match = rx.exec(fileName);
    if (!match) return null;
    return {
        date: stringDate(match[2]),
        dateString: match[2],
        extension: match[4],
        full: fileName,
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
FileName.fileName = function(configuration, date, index) {
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
 * Take a file name and get the same name back with an incremented index. If the file name
 * does not have an index then the same file name will be returned.
 * @param fileName
 */
FileName.increment = function(fileName) {
    var o = FileName.components(fileName);
    if (typeof o.index === 'undefined') return fileName;
    return (o.fileName ? o.fileName + '.' : '') +
        o.dateString + '.' +
        (o.index + 1) +
        (o.extension ? '.' + o.extension : '');
};

/**
 * Look through the store to determine which paths match the configuration. If a date is provided then
 * the date must also match.
 * @param {string[]} fileNames
 * @param {object} configuration,
 * @param {Date} [date=null]
 * @returns {string[]}
 */
FileName.matches = function(fileNames, configuration, date) {
    var config = schema.normalize(configuration);
    var dtString = date ? dateString(intervalDate(date, config)) : null;
    var results = [];

    fileNames.forEach(function(fileName) {
        var o = FileName.components(fileName);
        var match = ((!config.fileName && typeof o.fileName === 'undefined') || config.fileName === o.fileName) &&
            ((!config.fileExtension && typeof o.extension === 'undefined') || config.fileExtension === o.extension) &&
            ((!config.interval && typeof o.index === 'undefined') || (config.interval && typeof o.index !== 'undefined')) &&
            (!config.interval || stringDate(o.dateString).getTime() % config.interval === config.startOfDay) &&
            (!dtString || dtString === o.dateString);
        if (match) results.push(o);
    });

    return results;
};


/**
 * Take a date object and get it's string equivalent.
 * @param {Date} date
 * @returns {string}
 */
function dateString(date) {
    return date.getFullYear() + '-' +
        leadingZeros(date.getMonth() + 1, 2) + '-' +
        leadingZeros(date.getDate(), 2) + '-' +
        leadingZeros(date.getHours(), 2) +
        leadingZeros(date.getMinutes(), 2) +
        leadingZeros(date.getSeconds(), 2);
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
 * Generate an interval date from the date supplied.
 * @param {Date} date
 * @param {object} config
 * @returns {Date}
 */
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