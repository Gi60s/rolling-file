"use strict";
var CustomError         = require('custom-error-instance');
var expect              = require('chai').expect;
var path                = require('path');
var Promise             = require('bluebird');
var rfName              = require('../bin/rolling-file-name');

describe('rolling-file-path', function() {

    describe('#', function() {

        describe('without interval', function() {
            var config = { fileName: 'foo' };

            var store = [
                'foo.2000-01-01-090000.0.log',
                'foo.2000-01-01-100000.0.log',
                'foo.2000-01-01-110000.0.log'
            ];

            it('finds existing', function() {
                var date = new Date(2000, 0, 1, 10, 0, 0);
                expect(rfName(store, config, date)).to.be.equal('foo.2000-01-01-100000.0.log');
            });

            it('creates new', function() {
                var date = new Date(2000, 0, 1, 12, 0, 0);
                expect(rfName(store, config, date)).to.be.equal('foo.2000-01-01-120000.0.log');
            });
        });

        describe('with interval', function() {
            var config = {
                fileName: 'foo',
                interval: '1 hour'
            };

            var store = [
                'foo.2000-01-01-090000.0.log',
                'foo.2000-01-01-090000.1.log',
                'foo.2000-01-01-090000.2.log',
                'foo.2000-01-01-100000.0.log',
                'foo.2000-01-01-100000.1.log',
                'foo.2000-01-01-100000.2.log',
                'foo.2000-01-01-100000.3.log',
                'foo.2000-01-01-110000.0.log',
                'foo.2000-01-01-110000.1.log',
                'foo.2000-01-01-110000.2.log'
            ];

            it('finds existing', function() {
                var date = new Date(2000, 0, 1, 10, 0, 0);
                expect(rfName(store, config, date)).to.be.equal('foo.2000-01-01-100000.3.log');
            });

            it('creates new', function() {
                var date = new Date(2000, 0, 1, 12, 0, 0);
                expect(rfName(store, config, date)).to.be.equal('foo.2000-01-01-120000.0.log');
            });
        });

    });

    describe('#components', function() {

        it('null for a non-matching file', function() {
            expect(rfName.components('qwe')).to.be.null;
        });

        it('no filename, no index, no extension', function() {
            var o = rfName.components('2000-01-01-000000');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.undefined;
        });

        it('no filename, no index, extension', function() {
            var o = rfName.components('2000-01-01-000000.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.undefined;
        });

        it('no filename, index, no extension', function() {
            var o = rfName.components('2000-01-01-000000.1');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.equal(1);
        });

        it('no filename, index, extension', function() {
            var o = rfName.components('2000-01-01-000000.1.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.equal(1);
        });

        it('filename, no index, no extension', function() {
            var o = rfName.components('a.b.c.2000-01-01-000000');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.undefined;
        });

        it('filename, no index, extension', function() {
            var o = rfName.components('a.b.c.2000-01-01-000000.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.undefined;
        });

        it('filename, index, no extension', function() {
            var o = rfName.components('a.b.c.2000-01-01-000000.1');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.equal(1);
        });

        it('filename, index, extension', function() {
            var o = rfName.components('a.b.c.2000-01-01-000000.1.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.equal(1);
        });

    });

    describe('#fileName', function() {

        describe('fileName with default extension', function() {
            var d = new Date(2000, 0, 1, 0, 0, 0);

            it('number fails', function() {
                var config = { fileName: 1 };
                expect(function() { rfName.fileName(config, d) }).to.throw(Error);
            });

            it('object fails', function() {
                var config = { fileName: {} };
                expect(function() { rfName.fileName(config, d) }).to.throw(Error);
            });

            it('empty string passes', function() {
                var config = { fileName: '' };
                expect(rfName.fileName(config, d)).to.be.equal('2000-01-01-000000.0.log');
            });

            it('non-empty string passes', function() {
                var config = { fileName: 'hello' };
                expect(rfName.fileName(config, d)).to.be.equal('hello.2000-01-01-000000.0.log');
            });

        });

        describe('filename with modified extension', function() {
            var d = new Date(2000, 0, 1, 0, 0, 0);

            it('number fails', function() {
                var config = { fileName: '', fileExtension: 1 };
                expect(function() { rfName.fileName(config, d) }).to.throw(Error);
            });

            it('object fails', function() {
                var config = { fileName: '', fileExtension: {} };
                expect(function() { rfName.fileName(config, d) }).to.throw(Error);
            });

            it('empty string passes', function() {
                var config = { fileName: '', fileExtension: '' };
                expect(rfName.fileName(config, d)).to.be.equal('2000-01-01-000000.0');
            });

            it('non-empty string passes', function() {
                var config = { fileName: '', fileExtension: 'hello' };
                expect(rfName.fileName(config, d)).to.be.equal('2000-01-01-000000.0.hello');
            });
        });

        describe('indexes', function() {
            var d = new Date(2000, 0, 1, 11, 20, 35);

            describe('1 hour interval with multiple indexes', function() {
                var config = {
                    fileName: 'database',
                    interval: '1 hour'
                };

                it('defaults to zero', function() {
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-01-110000.0.log');
                });

                it('accepts an actual number', function() {
                    expect(rfName.fileName(config, d, 2)).to.be.equal('database.2000-01-01-110000.2.log');
                });

                it('accepts a string number', function() {
                    expect(rfName.fileName(config, d, '3')).to.be.equal('database.2000-01-01-110000.3.log');
                });

                it('throw an error for non-numbers', function() {
                    expect(function() { rfName.fileName(config, d, 'foo') }).to.throw(CustomError.RollingPathError.index);
                });

            });

            describe('odd intervals', function() {
                var d = new Date(2000, 0, 7, 13, 42, 35);

                it('1 day interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '1 day'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-000000.0.log');
                });

                it('2 day interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '2 days'
                    };
                    var d = new Date(2000, 0, 6, 9, 42, 35);
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-06-000000.0.log');
                });

                it('half day interval 1', function() {
                    var config = {
                        fileName: 'database',
                        interval: '.5 days'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('half day interval 2', function() {
                    var config = {
                        fileName: 'database',
                        interval: '0.5 days'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('2 hour interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '2 hours'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('30 minute interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '30 minutes'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-133000.0.log');
                });

                it('20 second interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '20 seconds'
                    };
                    expect(rfName.fileName(config, d)).to.be.equal('database.2000-01-07-134220.0.log');
                });

            });

            describe('modified start of day', function() {
                var d = new Date(2000, 0, 2, 11, 20, 35);
                var config = {
                    fileName: 'database',
                    interval: '1 day'
                };

                it('number fails', function() {
                    var c = Object.assign({}, config, { startOfDay: 1 });
                    expect(function() { rfName.fileName(c, d) }).to.throw(Error);
                });

                it('invalid string fails', function() {
                    var c = Object.assign({}, config, { startOfDay: 'abc' });
                    expect(function() { rfName.fileName(c, d) }).to.throw(Error);
                });

                it('6:00 AM', function() {
                    var c = Object.assign({}, config, { startOfDay: '6:00' });
                    expect(rfName.fileName(c, d)).to.be.equal('database.2000-01-02-060000.0.log');
                });

                it('11:30:15 AM', function() {
                    var c = Object.assign({}, config, { startOfDay: '11:30:15' });
                    expect(rfName.fileName(c, d)).to.be.equal('database.2000-01-01-113015.0.log');
                });

                it('3:00 PM (15:00)', function() {
                    var c = Object.assign({}, config, { startOfDay: '15:00' });
                    expect(rfName.fileName(c, d)).to.be.equal('database.2000-01-01-150000.0.log');
                });

            });

        });
    });

    describe('#increment', function() {

        it('bad file name', function() {
            expect(function() { rfName.increment(null); }).to.throw(Error);
        });

        it('non-rolling-file file name', function() {
            var fileName = 'stdout.log';
            expect(rfName.increment(fileName)).to.be.equal(fileName);
        });

        it('file name without index', function() {
            var fileName = 'foo.2000-01-01-000000.bar';
            expect(rfName.increment(fileName)).to.be.equal(fileName);
        });

        it('file name with index', function() {
            expect(rfName.increment('foo.2000-01-01-000000.0.bar')).to.be.equal('foo.2000-01-01-000000.1.bar');
        });

    });

    describe('#matches', function() {

        describe('no date', function() {

            it('no filename, no interval, no start of day, no extension', function() {
                var matches = [
                    '2000-01-01-100000',
                    '2000-01-01-100010',
                    '2000-01-02-100000',
                    '2000-02-01-100000'
                ];

                var nonMatches = [
                    'foo.2000-01-01-100000',
                    '2000-01-01-100000.log',
                    'foo.2000-01-01-100000.log',
                    'foo.2000-01-01-100000.1',
                    '2000-01-01-100000.1.log',
                    'foo.2000-01-01-100000.1.log'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: '', fileExtension: '' }).map(mapFull)).to.deep.equal(matches);
            });

            it('filename, no interval, no start of day, no extension', function() {
                var matches = [
                    'foo.2000-01-01-100000',
                    'foo.2000-01-01-100010',
                    'foo.2000-01-02-100000',
                    'foo.2000-02-01-100000'
                ];

                var nonMatches = [
                    '2000-01-01-100000',
                    '2000-01-01-100000.log',
                    '2000-01-01-100000.1.log',
                    '2000-01-01-100000.1',
                    '2000-01-01-100000.1.log',
                    'bar.2000-01-01-100000.1.log'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: 'foo', fileExtension: '' }).map(mapFull)).to.deep.equal(matches);
            });

            it('no filename, no interval, no start of day, extension', function() {
                var matches = [
                    '2000-01-01-100000.bar',
                    '2000-01-01-100010.bar',
                    '2000-01-02-100000.bar',
                    '2000-02-01-100000.bar'
                ];

                var nonMatches = [
                    '2000-01-01-100000',
                    'foo.2000-01-01-100000',
                    'foo.2000-01-01-100000.1',
                    '2000-01-01-100000.baz',
                    'foo.2000-01-01-100000.baz',
                    'foo.2000-01-01-100000.1.baz',
                    '2000-01-01-100000.1.bar',
                    'foo.2000-01-01-100000.bar'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: '', fileExtension: 'bar' }).map(mapFull)).to.deep.equal(matches);
            });

            it('filename, no interval, no start of day, extension', function() {
                var matches = [
                    'foo.2000-01-01-100000.bar',
                    'foo.2000-01-01-100010.bar',
                    'foo.2000-01-02-100000.bar',
                    'foo.2000-02-01-100000.bar'
                ];

                var nonMatches = [
                    '2000-01-01-100000',
                    'foo.2000-01-01-100000',
                    'foo.2000-01-01-100000.1',
                    '2000-01-01-100000.baz',
                    'foo.2000-01-01-100000.baz',
                    'foo.2000-01-01-100000.1.baz',
                    '2000-01-01-100000.1.bar'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: 'foo', fileExtension: 'bar' }).map(mapFull)).to.deep.equal(matches);
            });

            it('no filename, interval, no start of day, no extension', function() {
                var matches = [
                    '2000-01-01-100000.0',
                    '2000-01-01-100000.1',
                    '2000-01-01-110000.0',
                    '2000-01-01-130000.0',
                    '2000-01-01-180000.0'
                ];

                var nonMatches = [
                    '2000-01-01-100000',
                    '2000-01-01-101000.0',
                    '2000-01-01-110030.0',
                    '2000-01-01-130001.0'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: '', fileExtension: '', interval: '1 hour' }).map(mapFull)).to.deep.equal(matches);
            });

            it('no filename, interval, start of day, no extension', function() {
                var matches = [
                    '2000-01-01-103000.0',
                    '2000-01-01-103000.1',
                    '2000-01-01-113000.0',
                    '2000-01-01-133000.0',
                    '2000-01-01-183000.0'
                ];

                var nonMatches = [
                    '2000-01-01-103000',
                    '2000-01-01-101000.0',
                    '2000-01-01-110030.0',
                    '2000-01-01-130001.0'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, { fileName: '', fileExtension: '', interval: '1 hour', startOfDay: '0:30' }).map(mapFull)).to.deep.equal(matches);
            });

        });

        describe('with date', function() {
            var config = {
                fileName: '',
                interval: '1 hour'
            };
            var date = new Date(2000, 0, 1, 13, 25, 40);

            it('finds matches', function() {
                var matches = [
                    '2000-01-01-130000.0.log',
                    '2000-01-01-130000.1.log',
                    '2000-01-01-130000.2.log',
                    '2000-01-01-130000.3.log'
                ];

                var nonMatches = [
                    '2000-01-01-120000.0.log',
                    '2000-01-01-110000.0.log',
                    '2000-01-01-133000.0.log'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, config, date).map(mapFull)).to.deep.equal(matches);
            });

            it('no matches', function() {
                var matches = [];

                var nonMatches = [
                    '2000-01-01-120000.0.log',
                    '2000-01-01-110000.0.log',
                    '2000-01-01-133000.0.log'
                ];

                var final = matches.concat(nonMatches);
                final.sort();

                expect(rfName.matches(final, config, date).map(mapFull)).to.deep.equal(matches);
            });

        });

        describe('non rolling-file produced log files', function() {

            it('ignored', function() {
                var nonMatches = [
                    'stdout.log'
                ];

                expect(rfName.matches(nonMatches, { fileName: ''}).map(mapFull)).to.deep.equal([]);
            });

        });

    });

});

function mapFull(components) {
    return components.full;
}