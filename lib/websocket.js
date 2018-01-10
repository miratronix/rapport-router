'use strict';

const util = require('./util.js');

/**
 * Determines if a message is routable.
 *
 * @param {object} options The options for the rapport websocket.
 * @param {*} msg The message to check.
 * @return {boolean} True if the message is routable, false otherwise.
 */
const isRoutable = (options, msg) => {
    return !!(options && options.router && util.isObject(msg) && msg._m && msg._u);
};

/**
 * Creates a request object from a HTTP message.
 *
 * @param {*} request The request data.
 * @param {string} [requestId] The request ID.
 * @return {object} The request object.
 */
const createRequestObject = (request, requestId) => {

    // Parse query params
    const queryPresent = (request._u.indexOf('?') >= 0);
    const url = queryPresent ? request._u.substr(0, request._u.indexOf('?')) : request._u;
    const queryParams = queryPresent ? request._u.substr(request._u.indexOf('?') + 1).split('&') : [];
    const query = {};

    if (queryParams && queryParams.length > 0) {
        for (let i = 0; i < queryParams.length; i++) {
            const key = decodeURIComponent(queryParams[i].substr(0, queryParams[i].indexOf('=')));
            const value = decodeURIComponent(queryParams[i].substr(queryParams[i].indexOf('=') + 1));

            if (util.isUndefined(query[key])) {
                query[key] = value;
                continue;
            }

            if (!util.isArray(query[key])) {
                query[key] = [query[key]];
            }

            query[key].push(value);
        }
    }

    // Create request object
    return {
        id: requestId,
        responseExpected: !!requestId,
        method: request._m.toLowerCase(),
        body: request._b,
        url,
        query
    };
};

/**
 * Creates a responder object for an HTTP message.
 *
 * @param {object} [wrappedSocket] The wrapped socket to use for responding.
 * @param {string} [requestId] The request ID to respond to.
 * @return {object} The response object with real operations if it's a request, and no-op operations otherwise.
 */
const createResponderObject = (wrappedSocket, requestId) => {
    let res;

    // If we have a request ID, create a real response object
    if (requestId) {
        res = {
            _status: 200,
            _body: undefined,
            sent: false,
            status: (status) => {
                res._status = status;
                return res;
            },
            respond: (msg) => {
                res.sent = true;
                wrappedSocket.respond(requestId, msg);
            },
            respondWithError: (msg) => {
                res.sent = true;
                wrappedSocket.respondWithError(requestId, msg);
            },
            send: (body) => {
                res._body = body;
                const response = { _s: res._status, _b: res._body };

                if (res._status >= 200 && res._status < 300) {
                    res.respond(response);
                } else {
                    res.respondWithError(response);
                }
            }
        };

    // No response expected, return a no-op version of the response
    } else {
        res = {
            _status: undefined,
            _body: undefined,
            sent: undefined,
            status: () => {
                return res;
            },
            respond: () => {
                return res;
            },
            respondWithError: () => {
                return res;
            },
            send: () => {
                return res;
            }
        };
    }

    return res;
};

/**
 * Handles an HTTP style request.
 *
 * @param {object} wrappedSocket The wrapped websocket.
 * @param {object} router The rapport router.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 */
const handleHttpRequest = (wrappedSocket, router, requestId, request) => {
    router.handle(
        wrappedSocket._functions.onMessage.createRouterRequestObject(request, requestId),
        wrappedSocket._functions.onMessage.createRouterResponderObject(wrappedSocket, requestId)
    );
};

/**
 * Handles an HTTP style message.
 *
 * @param {object} wrappedSocket The wrapped websocket.
 * @param {object} router The rapport router.
 * @param {*} msg The message.
 */
const handleHttpMessage = (wrappedSocket, router, msg) => {
    router.handle(
        wrappedSocket._functions.onMessage.createRouterRequestObject(msg),
        wrappedSocket._functions.onMessage.createRouterResponderObject()
    );
};

/**
 * Adds HTTP request functionality to a websocket.
 *
 * @param {object} wrappedSocket The websocket to extend.
 */
module.exports = (wrappedSocket) => {
    const previousHandleRequest = wrappedSocket._functions.onMessage.handleRequest;
    const previousHandleMessage = wrappedSocket._functions.onMessage.handleMessage;

    // Add the createResponderObject and createRequestObject to onMessage
    wrappedSocket._functions.onMessage.createRouterResponderObject = createResponderObject;
    wrappedSocket._functions.onMessage.createRouterRequestObject = createRequestObject;

    // Replace the handle request function with one that checks for the router
    wrappedSocket._functions.onMessage.handleRequest = (standardSocket, wrappedSocket, requestCache, options, requestId, request, handler) => {
        if (isRoutable(options, request)) {
            handleHttpRequest(wrappedSocket, options.router, requestId, request);
        } else {
            previousHandleRequest(standardSocket, wrappedSocket, requestCache, options, requestId, request, handler);
        }
    };

    // Replace the handle message function with one that checks for the router
    wrappedSocket._functions.onMessage.handleMessage = (standardSocket, wrappedSocket, requestCache, options, msg, handler) => {
        if (isRoutable(options, msg)) {
            handleHttpMessage(wrappedSocket, options.router, msg);
        } else {
            previousHandleMessage(standardSocket, wrappedSocket, requestCache, options, msg, handler);
        }
    };
};
