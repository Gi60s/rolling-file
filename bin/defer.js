"use strict";
var Promise         = require('bluebird');

module.exports = Defer;

/**
 * Get a deferred object.
 * @returns {Defer}
 * @constructor
 */
function Defer() {
    let resolve;
    let reject;
    const factory = Object.create(Defer.prototype);
    const promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });

    /**
     * Get the resolve function.
     * @name Defer#resolve
     * @property
     * @readonly
     * @type {function}
     */
    Object.defineProperty(factory, 'resolve', { value: resolve });

    /**
     * Get the reject function.
     * @name Defer#reject
     * @property
     * @readonly
     * @type {function}
     */
    Object.defineProperty(factory, 'reject', { value: reject });

    /**
     * Get the resolve function.
     * @name Defer#promise
     * @property
     * @readonly
     * @type {Promise}
     */
    Object.defineProperty(factory, 'promise', { value: promise });

    return factory;
}