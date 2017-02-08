'use strict';

/**
 * Handles an HTTP style request.
 *
 * @param {object} wrappedSocket The wrapped websocket.
 * @param {object} router The rapport router.
 * @param {string} requestId The request ID.
 * @param {*} request The request.
 */
const handleHttpRequest = (wrappedSocket, router, requestId, request) => {

    // Parse query params
    const queryPresent = (request.url.indexOf('?') >= 0);
    const url = queryPresent ? request.url.substr(0, request.url.indexOf('?')) : request.url;
    const queryParams = queryPresent ? request.url.substr(request.url.indexOf('?') + 1).split('&') : [];
    const query = {};

    if (queryParams && queryParams.length > 0) {
        for (let i = 0; i < queryParams.length; i++) {
            const key = decodeURIComponent(queryParams[i].substr(0, queryParams[i].indexOf('=')));
            query[key] = decodeURIComponent(queryParams[i].substr(queryParams[i].indexOf('=') + 1));
        }
    }

    // Create request object
    const req = {
        id: requestId,
        method: request.method,
        body: request.body,
        url,
        query
    };

    // Create response object
    const res = {
        _status: 200,
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
            const response = { status: res._status, body };

            if (res._status >= 200 && res._status < 300) {
                res.respond(response);
            } else {
                res.respondWithError(response);
            }
        }
    };

    // Handle the request
    router.handle(req, res);
};

/**
 * Adds HTTP request functionality to a websocket.
 *
 * @param {object} wrappedSocket The websocket to extend.
 * @param {object} standardSocket The standard socket that is being wrapped.
 * @param {object} requestCache The request cache for the socket.
 * @param {options} options Object of options.
 */
module.exports = (wrappedSocket, standardSocket, requestCache, options) => {
    const router = options && options.router ? options.router : null;
    const handleRequest = wrappedSocket._functions.onMessage.handleRequest;

    wrappedSocket._functions.onMessage.handleRequest = (wrappedSocket, requestId, request, handler) => {
        if (router && request.method && request.url) {
            handleHttpRequest(wrappedSocket, router, requestId, request);
        } else {
            handleRequest(wrappedSocket, requestId, request, handler);
        }
    };
};
