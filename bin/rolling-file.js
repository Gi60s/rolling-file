"use strict";
// Manages a file write stream that automatically creates a new file once the file size limit has been reached.
var fs          = require('fs');
var path        = require('path');

module.exports = rollingFile;


function rollingFile(directoryPath, options) {

}

rollingFile.options = {
    byteLimit: {
        description: 'The maximum size for a file in bytes before output will be put into a new file.',
        defaultValue: '2GB',
        help: 'The value must be a number, optionally followed by a metric prefix ' +
            '(kilo, mega, giga, tera, peta, exa, zetta, yotta). For example: ' +
            '2000000 2G, 2 giga, 2 gigabytes, 2GB, 2000KB.',
        transform: function(value, error) {
            var i;
            var opt;
            var options = ['', 'k', 'm', 'g', 't', 'p', 'e', 'z', 'y'];
            var parts = getNumberAndUnit(value);

            if (!parts) throw error();

            for (i = 0; i < options.length; i++) {
                opt = options[i];
                if (parts.unit === opt) {
                    return Math.round(parts.number * Math.pow(1000, i));
                }
            }

            throw error('Invalid metric prefix.');
        },
        validate: function(value, validator) {
            return validator.number(value, { isNaN: false, min: 0, integer: true });
        }
    },

    timeLimit: {
        description: 'The maximum length of time for a file to be written to before output will be put into a new file.',
        defaultValue: '1D',
        transform: function(value) {
            var i;
            var num = parseInt(value);
            var unit = value.substr(('' + num).length).toLowerCase();
            var opt;
            var options = ['', 'k', 'm', 'g', 't', 'p', 'e', 'z', 'y'];
            for (i = 0; i < options.length; i++) {
                opt = options[i];
                if (unit === opt || unit === opt + 'b') {
                    return num * Math.pow(1000, i);
                }
            }
            return num;
        }
    }
};


function getNumberAndUnit(value) {
    var num;
    var unit;

    num = parseInt(value);
    if (isNaN(num)) return null;

    unit = value
        .substr(('' + num).length)
        .replace(/^ +/, '')
        .substr(0, 1)
        .toLowerCase();

    return {
        number: num,
        unit: unit
    };
}


/**
 * Produce a rolling file write stream that will automatically close and open new
 * streams as file size limits are reached.
 * @param {string} filePath The path of where to save the file.
 * @param {string, number} fileSize The size limit of the file before splitting
 * to a new file.
 * @returns {object}
 */
function rollingFile(filePath, fileSize) {
    var bytesLimit = parseFileSize(fileSize || '2GB');
    var bytesWritten = 0;
    var documentPath = path.resolve(process.cwd(), filePath);
    var factory = {};
    var stream;

    /**
     * Write to the rolling file.
     * @param {string} content
     */
    factory.write = function(content) {
        var length = content.length + 1;
        var suffix = new Date().toISOString().replace('.', ':').replace('T', '-').replace(/Z$/, '');

        //if the file size has hit its limit then start a new stream
        if (!stream || length + bytesWritten > bytesLimit) {
            if (stream) factory.end();
            stream = fs.createWriteStream(documentPath + '-' + suffix, { flags: 'w', encoding: 'utf8' });
            bytesWritten = 0;
        }

        //write the stream
        stream.write(content + '\n', 'utf8');
        bytesWritten += length;
    };

    /**
     * End writing.
     * @returns {Promise}
     */
    factory.end = function() {
        return new Promise(function(resolve, reject) {
            stream.write('', 'utf8', function() {
                stream.end();
            });
            stream.write = function() {};
            factory.write = function() {};
        });
    };

    return factory;
}

function parseFileSize(size) {
    var i;
    var num = parseInt(size);
    var unit = size.substr(('' + num).length).toLowerCase();
    var opt;
    var options = ['', 'k', 'm', 'g', 't'];
    for (i = 0; i < options.length; i++) {
        opt = options[i];
        if (unit === opt || unit === opt + 'b') {
            return num * Math.pow(1000, i);
        }
    }
    return num;
}