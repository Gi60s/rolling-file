"use strict";
var expect          = require('chai').expect;
var fs              = require('fs');
var path            = require('path');
var Promise         = require('bluebird');
var randomFs        = require('random-fs');
var rollingFile     = require('../bin/rolling-file');

var mkDir = Promise.promisify(fs.mkdir);
var readDir = Promise.promisify(fs.readdir);
var readFile = Promise.promisify(fs.readFile);
var stat = Promise.promisify(fs.stat);

describe('rolling-file', function() {
    var directory = path.resolve(__dirname, 'temp-rf');

    after(function() {
        return randomFs.wipe(directory);
    });

    beforeEach(function() {
        return randomFs.wipe(directory)
            .then(function() {
                return mkDir(directory);
            });
    });

    it('byte limit', function() {
        var config = { fileName: '', delimiter: '', byteLimit: 10 };
        var data = [];
        var i;

        //populate data to write
        for (i = 0; i < 36; i++) {
            data.push(i < 10 ? i : String.fromCharCode(55 + i));
        }

        return new Promise(function(resolve, reject) {
                var f = rollingFile(directory, config);
                while (data.length > 0) f.write(data.shift());
                f.end('', function(err) {
                    if (err) return reject(err);
                    readFiles(directory)
                        .then(function(result) {
                            resolve(result);
                        })
                        .catch(function(e) {
                            reject(e);
                        });
                });
            })
            .then(function(result) {
                var keys = Object.keys(result);

                expect(keys.length).to.be.equal(4);

                keys.forEach(function(key, index) {
                    var value = result[key];
                    switch (index) {
                        case 0:
                            expect(value).to.be.equal('0123456789');
                            break;
                        case 1:
                            expect(value).to.be.equal('ABCDEFGHIJ');
                            break;
                        case 2:
                            expect(value).to.be.equal('KLMNOPQRST');
                            break;
                        case 3:
                            expect(value).to.be.equal('UVWXYZ');
                            break;
                    }
                });
            });
    });

    it('time limit', function() {
        return new Promise(function(resolve, reject) {
                var i = 0;
                var id;
                var f = rollingFile(directory, { fileName: '', delimiter: '', interval: '1 second' });

                id = setInterval(function() {
                    f.write(i);
                    i++;
                    if (i === 10) {
                        clearInterval(id);
                        f.end('', function(err) {
                            if (err) return reject(err);
                            resolve();
                        })
                    }
                }, 500);
            })
            .then(function() {
                return readFiles(directory);
            })
            .then(function(result) {
                var keys = Object.keys(result);
                var length = keys.length;
                var sum = '';

                keys.forEach(function(key) {
                    sum += result[key];
                });
                expect(sum).to.be.equal('0123456789');

                expect(length).to.be.at.least(5);
            });
    });

});



function readFiles(directory) {
    var result = {};
    return readDir(directory)
        .then(function(fileNames) {
            var promise;
            var promises = [];

            fileNames.forEach(function(fileName) {
                var filePath = path.resolve(directory, fileName);
                promise = stat(filePath)
                    .then(function(stats) {
                        if (stats.isFile()) {
                            return readFile(filePath, 'utf8').then(function(content) {
                                result[fileName] = content;
                            });
                        }
                    });
                promises.push(promise);
            });

            return Promise.all(promises)
                .then(function() {
                    var keys = Object.keys(result);
                    var final = {};
                    keys.sort();
                    keys.forEach(function(key) {
                        final[key] = result[key];
                    });
                    return final;
                });
        });
}
