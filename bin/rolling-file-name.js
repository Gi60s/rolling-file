"use strict";
const CustomError = require('custom-error-instance');
const schema      = require('./rolling-file-schema');
const moment      = require('moment');

const Err = CustomError('RollingPathError');
Err.extend('index', { code: 'EINDEX'});
Err.extend('name', { message: 'Invalid file name.', code: 'ENAME'});

const msPerDay = 86400000;

module.exports = FileName;


/**
 * Look through the provided array of names for the one that matches the date and configuration. If
 * one is not found then a new file name will be generated.
 * @param {string[]} fileNames
 * @param {object} configuration
 * @param {Date} [date]
 * @returns {string}
 */
function FileName(fileNames, configuration, date) {
    if (!date || !(moment.isDate(date) || moment.isMoment(date))) date = new Date();
    const matches = FileName.matches(fileNames, configuration, date);
    return matches.length > 0 ? matches.pop().full :  FileName.fileName(configuration, date, 0);
}

/**
 * Get the file name components from a string.
 * @param {string} fileName
 * @returns {object}
 */
FileName.components = function(fileName) {
    const rx = /^(?:([ \S]*?)\.)?(\d{4}-\d{2}-\d{2}-\d{6})(?:\.(\d+))?(?:\.([ \S]*?))?$/;
    if (typeof fileName !== 'string') throw new Err.name();
    const match = rx.exec(fileName);
    if (!match) return null;
    return {
        date: moment(match[2], 'YYYY-MM-DD-HHmmss').toDate(),
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
    const config = schema.normalize(configuration);
    let result = '';

    if (config.fileName) result += config.fileName + '.';

    // set the date object to an interval value if an interval is specified
    if (config.interval) {
        date = intervalDate(date, config);
    }

    // add time stamp to the file name
    result += dateString(date);

    // add index
    if (arguments.length < 3) index = 0;
    if (isNaN(index)) throw new Err.index('File path index parameter must be a number when included in parameters.');
    result += '.' + index;

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
    const o = FileName.components(fileName);
    if (!o || typeof o.index === 'undefined') return fileName;
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
    const config = schema.normalize(configuration);
    const dtString = date ? dateString(intervalDate(date, config)) : null;
    const results = [];

    fileNames.forEach(function(fileName) {
        const o = FileName.components(fileName);
        if (o) {
            const match = ((!config.fileName && typeof o.fileName === 'undefined') || config.fileName === o.fileName) &&
              ((!config.fileExtension && typeof o.extension === 'undefined') || config.fileExtension === o.extension) &&
              ((!config.interval && typeof o.index === 'undefined') || (config.interval && typeof o.index !== 'undefined')) &&
              (!config.interval || moment(o.dateString, 'YYYY-MM-DD-HHmmss').toDate().getTime() % config.interval === config.startOfDay) &&
              (!dtString || dtString === o.dateString);
            if (match) results.push(o);
        }
    });

    return results;
};


/**
 * Take a date object and get it's string equivalent.
 * @param {Date} date
 * @returns {string}
 */
function dateString(date) {
    return moment(date).format('YYYY-MM-DD-HHmmss')
}

/**
 * Get a number that represents milliseconds for the start of the day.
 * @returns {number}
 */
function getStartOfDay(date) {
    const ms = date.valueOf();
    return ms - (ms % msPerDay) + date.getTimezoneOffset() * 60000;
}

/**
 * Generate an interval date from the date supplied.
 * @param {Date} date
 * @param {object} config
 * @returns {Date}
 */
function intervalDate(date, config) {
    const now = typeof date === 'number' ? date : date.getTime();
    const startOfDay = getStartOfDay(date) + config.startOfDay;
    const interval = Math.floor((now - startOfDay) / config.interval);
    return new Date(new Date(startOfDay).getTime() + interval * config.interval);
}
