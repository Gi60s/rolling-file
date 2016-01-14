"use strict";
var CustomError         = require('custom-error-instance');
var expect              = require('chai').expect;
var path                = require('path');
var Promise             = require('bluebird');
var rfPath              = require('../bin/rolling-file-path');

describe('rolling-file-path', function() {

    describe('#fileName', function() {

        describe('fileName with default extension', function() {
            var d = new Date(2000, 0, 1, 0, 0, 0);

            it('number fails', function() {
                var config = { fileName: 1 };
                expect(function() { rfPath.fileName(config, d) }).to.throw(Error);
            });

            it('object fails', function() {
                var config = { fileName: {} };
                expect(function() { rfPath.fileName(config, d) }).to.throw(Error);
            });

            it('empty string passes', function() {
                var config = { fileName: '' };
                expect(rfPath.fileName(config, d)).to.be.equal('2000-01-01-000000.log');
            });

            it('non-empty string passes', function() {
                var config = { fileName: 'hello' };
                expect(rfPath.fileName(config, d)).to.be.equal('hello.2000-01-01-000000.log');
            });

        });

        describe('filename with modified extension', function() {
            var d = new Date(2000, 0, 1, 0, 0, 0);

            it('number fails', function() {
                var config = { fileName: '', fileExtension: 1 };
                expect(function() { rfPath.fileName(config, d) }).to.throw(Error);
            });

            it('object fails', function() {
                var config = { fileName: '', fileExtension: {} };
                expect(function() { rfPath.fileName(config, d) }).to.throw(Error);
            });

            it('empty string passes', function() {
                var config = { fileName: '', fileExtension: '' };
                expect(rfPath.fileName(config, d)).to.be.equal('2000-01-01-000000');
            });

            it('non-empty string passes', function() {
                var config = { fileName: '', fileExtension: 'hello' };
                expect(rfPath.fileName(config, d)).to.be.equal('2000-01-01-000000.hello');
            });
        });

        describe('no interval means no index in path', function() {

            var config = { fileName: 'database' };
            var d = new Date(2000, 0, 1, 11, 20, 35);

            it('ignores omission', function() {
                expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-01-112035.log');
            });

            it('ignores number', function() {
                expect(rfPath.fileName(config, d, 0)).to.be.equal('database.2000-01-01-112035.log');
            });

            it('ignores other', function() {
                expect(rfPath.fileName(config, d, 'foo')).to.be.equal('database.2000-01-01-112035.log');
            });
        });

        describe('interval means index in path', function() {
            var d = new Date(2000, 0, 1, 11, 20, 35);

            describe('1 hour interval with multiple indexes', function() {
                var config = {
                    fileName: 'database',
                    interval: '1 hour'
                };

                it('defaults to zero', function() {
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-01-110000.0.log');
                });

                it('accepts an actual number', function() {
                    expect(rfPath.fileName(config, d, 2)).to.be.equal('database.2000-01-01-110000.2.log');
                });

                it('accepts a string number', function() {
                    expect(rfPath.fileName(config, d, '3')).to.be.equal('database.2000-01-01-110000.3.log');
                });

                it('throw an error for non-numbers', function() {
                    expect(function() { rfPath.fileName(config, d, 'foo') }).to.throw(CustomError.RollingPathError.index);
                });

            });

            describe('odd intervals', function() {
                var d = new Date(2000, 0, 7, 13, 42, 35);

                it('1 day interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '1 day'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-000000.0.log');
                });

                it('2 day interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '2 days'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-06-000000.0.log');
                });

                it('half day interval 1', function() {
                    var config = {
                        fileName: 'database',
                        interval: '.5 days'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('half day interval 2', function() {
                    var config = {
                        fileName: 'database',
                        interval: '0.5 days'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('2 hour interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '2 hours'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-120000.0.log');
                });

                it('30 minute interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '30 minutes'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-133000.0.log');
                });

                it('20 second interval', function() {
                    var config = {
                        fileName: 'database',
                        interval: '20 seconds'
                    };
                    expect(rfPath.fileName(config, d)).to.be.equal('database.2000-01-07-134220.0.log');
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
                    expect(function() { rfPath.fileName(c, d) }).to.throw(Error);
                });

                it('invalid string fails', function() {
                    var c = Object.assign({}, config, { startOfDay: 'abc' });
                    expect(function() { rfPath.fileName(c, d) }).to.throw(Error);
                });

                it('6:00 AM', function() {
                    var c = Object.assign({}, config, { startOfDay: '6:00' });
                    expect(rfPath.fileName(c, d)).to.be.equal('database.2000-01-02-060000.0.log');
                });

                it('11:30:15 AM', function() {
                    var c = Object.assign({}, config, { startOfDay: '11:30:15' });
                    expect(rfPath.fileName(c, d)).to.be.equal('database.2000-01-01-113015.0.log');
                });

                it('3:00 PM (15:00)', function() {
                    var c = Object.assign({}, config, { startOfDay: '15:00' });
                    expect(rfPath.fileName(c, d)).to.be.equal('database.2000-01-01-150000.0.log');
                });

            });

        });
    });

    describe('#components', function() {

        it('no filename, no index, no extension', function() {
            var o = rfPath.components('2000-01-01-000000');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.undefined;
        });

        it('no filename, no index, extension', function() {
            var o = rfPath.components('2000-01-01-000000.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.undefined;
        });

        it('no filename, index, no extension', function() {
            var o = rfPath.components('2000-01-01-000000.1');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.equal(1);
        });

        it('no filename, index, extension', function() {
            var o = rfPath.components('2000-01-01-000000.1.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.undefined;
            expect(o.index).to.be.equal(1);
        });

        it('filename, no index, no extension', function() {
            var o = rfPath.components('a.b.c.2000-01-01-000000');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.undefined;
        });

        it('filename, no index, extension', function() {
            var o = rfPath.components('a.b.c.2000-01-01-000000.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.undefined;
        });

        it('filename, index, no extension', function() {
            var o = rfPath.components('a.b.c.2000-01-01-000000.1');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.undefined;
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.equal(1);
        });

        it('filename, index, extension', function() {
            var o = rfPath.components('a.b.c.2000-01-01-000000.1.frog.log');
            expect(o.date.getTime()).to.equal(new Date(2000, 0, 1, 0, 0, 0).getTime());
            expect(o.dateString).to.equal('2000-01-01-000000');
            expect(o.extension).to.be.equal('frog.log');
            expect(o.fileName).to.be.equal('a.b.c');
            expect(o.index).to.be.equal(1);
        });

    });

    describe('#matches', function() {

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

            expect(rfPath.matches(final, { fileName: '', fileExtension: '' })).to.deep.equal(matches);
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

            expect(rfPath.matches(final, { fileName: 'foo', fileExtension: '' })).to.deep.equal(matches);
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

            expect(rfPath.matches(final, { fileName: '', fileExtension: 'bar' })).to.deep.equal(matches);
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

            expect(rfPath.matches(final, { fileName: 'foo', fileExtension: 'bar' })).to.deep.equal(matches);
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

            expect(rfPath.matches(final, { fileName: '', fileExtension: '', interval: '1 hour' })).to.deep.equal(matches);
        });

        it.only('no filename, interval, start of day, no extension', function() {
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

            expect(rfPath.matches(final, { fileName: '', fileExtension: '', interval: '1 hour', startOfDay: '0:30' })).to.deep.equal(matches);
        });


    });

});