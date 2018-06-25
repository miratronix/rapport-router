'use strict';

const util = require('./util.js');

/**
 * Utility methods for dealing with route chains.
 */
const RouteChain = {

    /**
     * Converts an array of handlers to a handler chain.
     *
     * @param {string} method HTTP method for chain entries.
     * @param {...function|...function[]} handlers Handler functions to use.
     * @return {object[]} Array of handler objects (AKA a Route Chain).
     */
    create: (method, ...handlers) => {
        const chain = [];

        if (!handlers || handlers.length === 0) {
            throw new TypeError('At least one handler function must be supplied');
        }

        for (let i = 0; i < handlers.length; i++) {
            const handler = { method };
            if (util.isFunction(handlers[i])) {
                handler.handle = handlers[i];
                chain.push(handler);
            } else if (util.isArray(handlers[i])) {
                RouteChain.append(chain, RouteChain.create(method, ...handlers[i]));
            } else {
                throw new TypeError('Handlers must be functions');
            }
        }

        return chain;
    },

    /**
     * Gets an object of HTTP methods supported by a route chain.
     *
     * @param {object[]} chain The route chain to check.
     * @return {object} An object containing a key for every supported HTTP method with a value of true.
     */
    handledMethods: (chain) => {
        const handledMethods = {};

        for (let i = 0; i < chain.length; i++) {
            handledMethods[chain[i].method] = true;
        }
        return handledMethods;
    },

    /**
     * Steps through a route chain, calling each handler in turn.
     *
     * @param {object} req The request object to give to the handlers.
     * @param {object} res The response object to give to the handlers.
     * @param {object[]} chain The route chain to traverse.
     * @param {function} errorCallback Callback for when an error occurs.
     * @param {object} [err] The error to give to the handlers.
     */
    traverse: (req, res, chain, errorCallback, err) => {

        const next = () => {

            if (chain.length > 0) {
                const handler = chain.shift();

                // Only dispatch to handlers with a matching method or 'all'
                if (handler.method === 'all' || handler.method === req.method) {
                    try {
                        let returned;

                        if (err) {
                            returned = handler.handle(err, req, res, next);
                        } else {
                            returned = handler.handle(req, res, next);
                        }

                        // If the handler returned a promise, call next when it's done and error if it fails
                        if (returned && util.isFunction(returned.then)) {
                            returned.then(next, errorCallback);
                        }

                    } catch (err) {
                        errorCallback(err);
                    }

                // Route doesn't match, next one
                } else {
                    next();
                }
            }
        };

        next();
    },

    /**
     * Pushes route chains onto an existing chain.
     *
     * @param {object[]} chain The chain to push onto.
     * @param {...object[]} additional Chains to push onto the pushChain.
     * @return {object[]} The push chain after pushing is complete
     */
    append: (chain, ...additional) => {
        for (let i = 0; i < additional.length; i++) {
            if (additional[i] && additional[i].length !== 0) {
                chain.push(...additional[i]);
            }
        }
        return chain;
    }
};

module.exports = RouteChain;
