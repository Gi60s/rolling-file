# rolling-file

Write to a file until limits you've defined are reached, after which a new file is created and written to until its limits are reached, and so on. Writing is done using write streams.

## Installation

```sh
npm install rolling-file
```

## Examples

### Roll by File Size

```js
var rollingFile = require('rolling-file');
var f = rollingFile('./logs', { fileName: 'foo', byteLimit: '500 MB' });
f.write('Hello, World!');
```

### Roll by Time Interval

```js
var rollingFile = require('rolling-file');
var f = rollingFile('./logs', { fileName: 'foo', interval: '1 day' });
f.write('Hello, World!');
```

### Roll by File Size and Time Interval

```js
var rollingFile = require('rolling-file');
var f = rollingFile('./logs', { fileName: 'foo', byteLimit: '500 MB', interval: '1 day' });
f.write('Hello, World!');
```

## API

### rollingFile ( directory, [, configuration ] )

**Parameters:**

 - **directory** - A required string that gives the directory path of where log files should be deposited.
 - **configuration** - A optional object that defines how the file rolling should occur.
 
**Returns:** An object with properties for writing to the data stream.

## Configuration

The configuration parameter has the following options:

 - **byteLimit** - The maximum size for a file in bytes before output will be put into a new file. The value must be a number, optionally followed by a metric prefix '(kilo, mega, giga, tera, peta, exa, zetta, yotta). For example: 2000000,  2G, 2 giga, 2 gigabytes, 2GB, 2000KB. The default value is 2 GB.
 - **delimiter** - The character to use to separate entries into the rolling file. The default value is '\n'.
 - **fileEncoding** - The encoding type to use on the file. All of NodeJS' encoding types are acceptable values. Defaults to 'utf8'.
 - **fileName** - The file name prefix to add to the start of the file.
 - **fileExtension** - The extension to add to the end of the file name. By default this value is '.log'.
 - **interval** - The size of the time interval for each file.
 - **startOfDay** - The time to consider as the start of the day. This does nothing unless an interval is specified.

## File Naming

The naming of files is an automated process through which you have some control. You can provide a file name prefix and the file extension. A timestamp and an index are also added to the file name automatically.

The timestamp is formatted as YYYY-MM-DD-HHMMSS and it will contain the time stamp for when it was first written to if no interval is provided. If an interval is provided then the time stamp will reflect that time that lines up with that interval.

The index is added after the timestamp and is used to split multiple files that fit the same timestamp.

See below for some configurations and their potential output:

```js
config = { fileName: 'foo', fileExtension: 'bar', byteLimit: '2 GB' };
possible_outputs = [
    'foo.2000-01-01-102345.0.bar',
    'foo.2000-01-01-102345.1.bar'
    'foo.2000-01-01-180200.0.bar'
]
```

```js
config = { fileName: '', interval: '1 day', byteLimit: '500 MB' };
possible_outputs = [
    '2000-01-01-000000.0.log',
    '2000-01-01-000000.1.log',
    '2000-01-02-000000.0.log',
    '2000-01-03-000000.0.log'
];
```