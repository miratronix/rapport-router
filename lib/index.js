'use strict';

const Router = require('./router.js');
const extendWebsocket = require('./websocket.js');
const util = require('./util.js');

/**
 * Defines the Rapport plugin.
 */
const RapportPlugin = {

    /**
     * Adds HTTP request functionality to the websocket.
     *
     * @param {object} wrappedSocket The websocket to extend.
     * @param {object} requestCache The request cache for the socket.
     * @param {options} options Object of options.
     */
    extendWebsocket: (wrappedSocket, requestCache, options) => {
        if (options && options.router && !util.isObject(options.router) && !util.isFunction(options.router.handle)) {
            throw new TypeError('options.router must be a Rapport router');
        }

        extendWebsocket(wrappedSocket, requestCache, options);
    },

    /**
     * Adds the router constructor to the global rapport constructor.
     *
     * @param {object} Rapport The rapport constructor.
     */
    extendRapportConstructor: (Rapport) => {
        Rapport.Router = Router;
    },

    /**
     * Adds the router constructor to the rapport instance.
     *
     * @param {object} instance The rapport instance.
     */
    extendRapportInstance: (instance) => {
        instance.Router = Router;
    }
};

if (typeof window !== 'undefined') {
    window.RapportRouter = RapportPlugin;
}

if (typeof module !== 'undefined') {
    module.exports = RapportPlugin;
}
