"use strict";
//var rollingFile         = require('./bin/rolling-file');

/*
require('./bin/rolling-file-path')('./temp/');

var fs = require('fs');

var s1 = fs.createWriteStream('./temp/stream.txt', { flags: 'a', encoding: 'utf8' });
var s2 = fs.createWriteStream('./temp/stream.txt', { flags: 'a', encoding: 'utf8' });

for (var i = 0; i < 1000; i ++) {
    (function(i) {
        setTimeout(function() {
            var index = Math.floor(Math.random() * 2);
            if (index === 0) {
                s1.write('S1: ' + i + '\n');
            } else {
                s2.write('S2: ' + i + '\n');
            }
        }, i * 10);
    })(i);
}*/

var customError = require('./bin/custom-error.js');

var P = customError('PersonError');
var e = new P('Wrong person', { code: 'EWPER' });
console.log(e instanceof customError.PersonError);
console.log(e instanceof P);
console.log(P === customError.PersonError);
console.log(e.constructor.name);
console.log(e.code);
console.log(e.message);
console.log(e.stack);


customError('FooError', function(message, properties) {
    console.log(message);
    console.log(Object.keys(this));
    console.log(Object.keys(properties));
});
e = new customError.FooError('Bar');