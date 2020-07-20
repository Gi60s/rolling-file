const fs = require('fs')

exports.mkDir = function (path, options = {}) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, err => {
        if (err) return reject(err)
        resolve()
    })
  })
}

exports.readDir = function (path, options = {}) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, options, (err, files) => {
        if (err) return reject(err)
        resolve(files)
    })
  })
}

exports.readFile = function (path, options = {}) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (err, data) => {
        if (err) return reject(err)
        resolve(data)
    })
  })
}

exports.stat = function (path, options = {}) {
  return new Promise((resolve, reject) => {
    fs.stat(path, options, (err, stats) => {
        if (err) return reject(err)
        resolve(stats)
    })
  })
}