"use strict";
const directoryFiles      = require('../bin/directory-files')
const expect              = require('chai').expect
const { mkDir }           = require('../bin/fsp.js')
const path                = require('path')
const randomFs            = require('random-fs')

describe('directory-files', function() {
    const directory = path.resolve(__dirname, 'temp');

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
        const addedFiles = [];
        return randomFs({ path: directory, depth: 1, number: 25 })
            .then(function(results) {
                results.added.forEach(function(line) {
                    let baseName;
                    let dirName;
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
