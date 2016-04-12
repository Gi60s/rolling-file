"use strict";
var directoryFiles      = require('../bin/directory-files');
var expect              = require('chai').expect;
var fs                  = require('fs');
var path                = require('path');
var Promise             = require('bluebird');
var randomFs            = require('random-fs');

var mkDir = Promise.promisify(fs.mkdir);

describe('directory-files', function() {
    var directory = path.resolve(__dirname, 'temp');

    after(function() {
        return randomFs.wipe(directory);
    });

    beforeEach(function() {
        return randomFs.wipe(directory)
            .then(function() {
                return mkDir(directory);
            });
    });

    it('read empty directory', function() {
        return directoryFiles(directory)
            .then(function(fileNames) {
                expect(fileNames.length).to.be.equal(0);
            });
    });

    it('rejects on non-directory', function() {
        return directoryFiles(__dirname + '/foo')
            .then(function() {
                throw Error('Should not have found directory.');
            }, function(e) {
                expect(e.code).to.equal('ENOENT');
            });
    });

    it('read populated directory', function() {
        var addedFiles = [];
        return randomFs({ path: directory, depth: 1, number: 25 })
            .then(function(results) {
                results.added.forEach(function(line) {
                    var baseName;
                    var dirName;
                    if (line.indexOf('[FILE]') === 0) {
                        line = line.substr(7);
                        baseName = path.basename(line);
                        dirName = path.dirname(line);
                        if (path.relative(directory, dirName) === '') addedFiles.push(baseName);
                    }
                });
                return directoryFiles(directory);
            })
            .then(function(foundFiles) {
                expect(foundFiles.sort()).to.be.deep.equal(addedFiles.sort());
            });
    });

});