"use strict";
const expect          = require('chai').expect;
const fs              = require('fs');
const fsp             = require('../bin/fsp')
const path            = require('path');
const randomFs        = require('random-fs');
const rollingFile     = require('../bin/rolling-file');

const { mkDir, readDir, readFile, stat } = fsp

describe('rolling-file', function() {
    this.timeout(20000);
    const directory = path.resolve(__dirname, 'temp-rf');

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
        const config = { fileName: '', delimiter: '', byteLimit: 10 };
        const data = [];

        //populate data to write
        for (let i = 0; i < 36; i++) {
            data.push(i < 10 ? i : String.fromCharCode(55 + i));
        }

        return new Promise(function(resolve, reject) {
                const f = rollingFile(directory, config);
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
                const keys = Object.keys(result);

                expect(keys.length).to.be.equal(4);

                keys.forEach(function(key, index) {
                    const value = result[key];
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
        return new Promise(
            function(resolve, reject) {
                let i = 0;
                var f = rollingFile(directory, { fileName: '', delimiter: '', interval: '1 second' });

                const id = setInterval(function() {
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
                const keys = Object.keys(result);
                const length = keys.length;
                let sum = '';

                keys.forEach(function(key) {
                    sum += result[key];
                });
                expect(sum).to.be.equal('0123456789');

                expect(length).to.be.at.least(5);
            });
    });

    it('complex filename and extension name', () => {
        const config = { fileName: `a.b.c`, delimiter: '', fileExtension: `${process.pid}.log`, byteLimit: 10 };
        const data = [];

        //populate data to write
        for (let i = 0; i < 36; i++) {
            data.push(i < 10 ? i : String.fromCharCode(55 + i));
        }

        return new Promise(function(resolve, reject) {
            const f = rollingFile(directory, config);
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
              const keys = Object.keys(result);

              expect(keys.length).to.be.equal(4);

              keys.forEach(function(key, index) {
                  const value = result[key];
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
    })

    describe('can\'t create write stream', function() {

        it('access denied', function(done) {
            const dirPath = path.resolve(__dirname, '..', 'no-write');

            // remove the directory if it exists
            try {
                fs.rmdirSync(dirPath);
            } catch (e) {}

            // make the directory without read permissions
            fs.mkdirSync(dirPath, 0x444);
            expect(fs.statSync(dirPath).isDirectory()).to.equal(true);

            const f = rollingFile(dirPath, { fileName: '' });
            f.write('foo', function(err) {
                expect(err.code).to.equal('EACCES');
                fs.rmdirSync(dirPath);
                done();
            });
        });

        it('directory does not exist', function(done) {
            const dirPath = path.resolve(__dirname, 'dne');
            try { fs.rmdirSync(dirPath); } catch (e) {}

            const f = rollingFile(dirPath, { fileName: '' });
            f.write('foo', function(err) {
                expect(err.code).to.equal('ENOENT');
                done();
            });
        });

    });

});



function readFiles(directory) {
    const result = {};
    return readDir(directory)
        .then(function(fileNames) {
            let promise;
            const promises = [];

            fileNames.forEach(function(fileName) {
                const filePath = path.resolve(directory, fileName);
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
                    const keys = Object.keys(result);
                    const final = {};
                    keys.sort();
                    keys.forEach(function(key) {
                        final[key] = result[key];
                    });
                    return final;
                });
        });
}
