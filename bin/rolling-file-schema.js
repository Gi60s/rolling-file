"use strict";
var schemata    = require('object-schemata');
var path        = require('path');

var rxTime = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
var rxNumUnit = /^(\d+(?:\.\d+)?) *([kmgtpezy])?/i;
var rxTimeUnit = /^((?:\d*\.)?\d+) *([smhd])?/i;

module.exports = schemata({
    byteLimit: {
        description: 'The maximum size for a file in bytes before output will be put into a new file.',
        defaultValue: '2GB',
        help: 'The value must be a number, optionally followed by a metric prefix ' +
        '(kilo, mega, giga, tera, peta, exa, zetta, yotta). For example: ' +
        '2000000, 2G, 2 giga, 2 gigabytes, 2GB, 2000KB.',
        transform: getByteSize,
        validate: function(value, is) {
            return (is.number(value) && !is.nan(value) && value > 0) || (is.string(value) && rxNumUnit.test(value));
        }
    },
    delimiter: {
        description: 'The character to use to separate entries into the rolling file.',
        defaultValue: '\n',
        transform: function(value) {
            return '' + value;
        }
    },
    fileEncoding: {
        description: 'The file encoding to use.',
        defaultValue: 'utf8',
        help: 'This value must be a string and it must also be one of the supported encoding types.',
        transform: function(value) {
            return value.toLowerCase();
        },
        validate: function(value, is) {
            var encodings = ['ascii', 'base64', 'binary', 'hex', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'utf8', 'utf-8'];
            return is.string(value) && encodings.indexOf(value.toLowerCase()) !== -1;
        }
    },
    fileExtension: {
        description: 'The file extension to add to the end of the log file.',
        defaultValue: 'log',
        help: 'This value must be a string with only letters or numbers.',
        validate: function(value, is) {
            return is.string(value) && /^[a-z0-9]*$/i.test(value);
        }
    },
    fileName: {
        description: 'The name of the file to write to. A date suffix, and index, and and file extension will be added ' +
        'to this value. For example "data" will generate file with the name "data.2016-01-01-000000.1.log".',
        help: 'The value must be a string that is a file path to an existing directory.',
        defaultValue: '',
        validate: function(value, is) {
            return is.string(value);
        }
    },
    interval: {
        description: 'If specified then file names will have time component of the file name limited to valid intervals.',
        help: 'The value must be a number, optionally followed by S (seconds), M (minutes), H (hours), D (days). ' +
        'If not followed by one of those options then milliseconds will be the assumed unit.',
        transform: getTimeDuration,
        validate: function(value, is) {
            return is.string(value) && rxTimeUnit.test(value);
        }
    },
    startOfDay: {
        description: 'The time of day in 24 hour format where the day should start at. This only has a bearing if ' +
        'an interval duration is specified.',
        defaultValue: '0:00:00',
        help: 'The value must be formatted in 24 hour format. For example, 13:00:00 would start ' +
        'the day at 1:00 PM.',
        transform: getTimeStart,
        validate: function(value, is) {
            return is.string(value) && rxTime.test(value);
        }
    }
});

function getByteSize(value) {
    var index;
    var match;
    var num;
    var options = ['k', 'm', 'g', 't', 'p', 'e', 'z', 'y'];
    var unit;

    if (typeof value === 'number') return Math.round(value);

    match = rxNumUnit.exec(value);
    num = parseFloat(match[1]);
    unit = match[2].toLowerCase();

    index = options.indexOf(unit);
    return index === -1 ? num : Math.round(num * Math.pow(1000, index));
}

function getTimeDuration(value) {
    var match;
    var num;
    var unit;

    match = rxTimeUnit.exec(value);
    num = parseFloat(match[1]);
    unit = match[2] && match[2].toLowerCase();

    switch (unit) {
        case 's': return Math.round(num * 1000);
        case 'm': return Math.round(num * 60000);
        case 'h': return Math.round(num * 3600000);
        case 'd': return Math.round(num * 86400000);
        default: return Math.round(num);
    }
}

function getTimeStart(value) {
    var match = rxTime.exec(value);
    var seconds = match[3] ? 1000 * parseInt(match[3]) : 0;
    return 3600000 * parseInt(match[1]) +
        60000 * parseInt(match[2]) +
        seconds;
}