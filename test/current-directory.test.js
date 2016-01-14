"use strict";
var current             = require('../bin/current-directory');
var expect              = require('chai').expect;
var path                = require('path');
var Promise             = require('bluebird');
var randomFs            = require('random-fs');

describe('current-directory', function() {
    var directory = path.resolve(__dirname, 'temp/current-directory');

    beforeEach(function() {
        return randomFs.wipe(directory)
    });

    afterEach(function() {
        return randomFs.wipe(directory);
    });

    it('keep added files in sync', function() {
        var addedFiles;
        var config = { path: directory, depth: 0 };
        var watchFiles;

        return randomFs(config)
            .then(function(results) {
                addedFiles = results.added.filter(filterFiles).map(mapFiles);
                return current.watch(config.path)
            })
            .then(function(results) {
                results.sort();
                watchFiles = results;
            })
            .then(function() {
                expect(addedFiles.length).to.be.equal(watchFiles.length);
                expect(addedFiles).to.be.deep.equal(watchFiles);
                return randomFs(config);
            })
            .then(function(results) {
                addedFiles = addedFiles.concat(results.added.filter(filterFiles).map(mapFiles));
                addedFiles.sort();
                return Promise.delay(500); //short delay to allow current-directory to catch up
            })
            .then(function() {
                expect(addedFiles.length).to.be.equal(watchFiles.length);
                expect(addedFiles).to.be.deep.equal(watchFiles);
            });
    });
});

function filterFiles(line) {
    return line.indexOf('[FILE]') === 0;
}

function mapFiles(line) {
    return path.basename(line);
}
