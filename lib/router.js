'use strict';

const pathToRegex = require('path-to-regexp');
const routeChain = require('./route.chain.js');
const util = require('./util.js');

/**
 * Determines if a route is a regex route (contains any regex).
 *
 * @param {string} route The route to check.
 * @return {boolean} True if the route contains regex, false otherwise.
 */
const isRegexRoute = (route) => {
    const keys = [];
    pathToRegex(route, keys);
    return keys.length !== 0;
};

/**
 * Creates the main router object.
 *
 * @return {object} The router.
 */
const Router = () => {

    /**
     * Contains a map of all the routes -> their route info object. This contains the chain and handledMethods properties.
     */
    const routes = {};

    /**
     * Contains an array of regex routes objects. These contain the following properties: {route, keys, regex, handledMethods, chain}.
     */
    const regexRoutes = [];

    /**
     * Array of middleware functions that are added to every new route.
     */
    const middleware = [];

    /**
     * Contains an array of error handlers.
     */
    const errorHandlers = [];

    /**
     * Adds a single route or array of routes with a specified route chain.
     *
     * @param {string|string[]} route The route(s).
     * @param {object[]} chain The route chain.
     */
    const addRoute = (route, chain) => {

        // If the route is an array of routes, add em all
        if (util.isArray(route)) {
            for (let i = 0; i < route.length; i++) {
                addRoute(route[i], chain);
            }
            return;
        }

        if (!util.isString(route)) {
            throw new TypeError('Routes must be strings');
        }

        const cleanRoute = util.trimSlashes(route);

        if (isRegexRoute(cleanRoute)) {

            // Add chain to existing route if it's there and update the handled methods for the route
            for (let i = 0; i < regexRoutes.length; i++) {
                if (regexRoutes[i].route === cleanRoute) {
                    routeChain.append(regexRoutes[i].chain, chain);
                    regexRoutes[i].handledMethods = routeChain.handledMethods(regexRoutes[i].chain);
                    return;
                }
            }

            const keys = [];
            const regex = pathToRegex(cleanRoute, keys);
            const fullChain = routeChain.append([], middleware, chain);
            const handledMethods = routeChain.handledMethods(fullChain);

            // Push on a brand new regex route
            regexRoutes.push({ keys, regex, handledMethods, route: cleanRoute, chain: fullChain });

        } else {

            // Create a new route info entry if required
            if (!routes[cleanRoute]) {
                routes[cleanRoute] = { chain: routeChain.append([], middleware) };
            }

            // Not a regex route, just push the new chain onto the existing chain and recompute the handled methods
            routeChain.append(routes[cleanRoute].chain, chain);
            routes[cleanRoute].handledMethods = routeChain.handledMethods(routes[cleanRoute].chain);
        }
    };

    /**
     * Add a chain of error handlers.
     *
     * @param {object[]} chain The route chain.
     */
    const addErrorHandlers = (chain) => {
        routeChain.append(errorHandlers, chain);
    };

    /**
     * Adds the specified chain to all existing routes and add it to the middleware array that is used as the baseline
     * when creating new routes.
     *
     * @param {object[]} chain The route chain.
     */
    const addMiddleware = (chain) => {

        routeChain.append(middleware, chain);

        util.forEach(routes, (route, routeInfo) => {
            routeChain.append(routeInfo.chain, chain);
            routeInfo.handledMethods = routeChain.handledMethods(routeInfo.chain);
        });

        for (let i = 0; i < regexRoutes.length; i++) {
            routeChain.append(regexRoutes[i].chain, chain);
            regexRoutes[i].handledMethods = routeChain.handledMethods(regexRoutes[i].chain);
        }
    };

    /**
     * Adds all routes from a sub router.
     *
     * @param {string|string[]} route Base route(s) for the added router(s).
     * @param {object|object[]} router The router(s) to add.
     */
    const addRouter = (route, router) => {

        // If the route is an array of routes, add the router to all of them
        if (util.isArray(route)) {
            for (let i = 0; i < route.length; i++) {
                addRouter(route[i], router);
            }
            return;
        }

        // If the router is an array of routers, add all of them
        if (util.isArray(router)) {
            for (let i = 0; i < router.length; i++) {
                addRouter(route, router[i]);
            }
            return;
        }

        // Only string routes are allowed
        if (!util.isString(route)) {
            throw new TypeError('Routes must be strings');
        }

        // Only router objects are allowed
        if (!util.isObject(router) || !util.isFunction(router.getRoutes) || !util.isFunction(router.getRegexRoutes) || !util.isFunction(router.getErrorHandlers)) {
            throw new TypeError('Router must be a Rapport router');
        }

        util.forEach(router.getRoutes(), (subRoute, subRouteInfo) => {
            addRoute(util.combineUrls(route, subRoute), subRouteInfo.chain);
        });

        const subRegexRoutes = router.getRegexRoutes();
        for (let i = 0; i < subRegexRoutes.length; i++) {
            addRoute(util.combineUrls(route, subRegexRoutes[i].route), subRegexRoutes[i].chain);
        }

        addErrorHandlers(router.getErrorHandlers());
    };

    /**
     * The exported router object.
     */
    const router = {

        /**
         * Gets the route object in this router.
         *
         * @return {object} The object containing routes.
         */
        getRoutes: () => {
            return routes;
        },

        /**
         * Gets all the regex routes in this router.
         *
         * @return {object[]} The array of regex route objects.
         */
        getRegexRoutes: () => {
            return regexRoutes;
        },

        /**
         * Gets the error handlers associated with this router.
         *
         * @return {object[]} The error route chain for this router.
         */
        getErrorHandlers: () => {
            return errorHandlers;
        },

        /**
         * Adds a router to this router, or adds a router-wide handler function.
         *
         * @param {string|object|function} route The base path for the following router, the router itself, or a middleware function.
         * @param {object...|function...} router The routers or middleware functions to add.
         */
        use: (route, ...router) => {

            // We have a string route or array of routes as the first parameter, add the routers
            if (util.isString(route) || util.isArray(route)) {
                if (!router || router.length === 0) {
                    throw new TypeError('At least one Rapport router must be supplied');
                } else {
                    addRouter(route, router);
                }

            // We have a router as the first parameter, shortcut for ".use('', router)"
            } else if (util.isObject(route)) {
                addRouter('', [route, ...router]);

            // We have functions as the only parameters, attach to the end of ALL routes
            } else if (util.isFunction(route)) {
                addMiddleware(routeChain.create('all', ...[route, ...router]));

            // No idea what we have...
            } else {
                throw new TypeError('First parameter must be a string, Rapport router, or function');
            }
        },

        /**
         * Adds a series of handlers for a route covering all HTTP methods.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        all: (route, ...handlers) => {
            addRoute(route, routeChain.create('all', ...handlers));
        },

        /**
         * Adds a series of handlers for a PUT route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        put: (route, ...handlers) => {
            addRoute(route, routeChain.create('put', ...handlers));
        },

        /**
         * Adds a series of handlers for a POST route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        post: (route, ...handlers) => {
            addRoute(route, routeChain.create('post', ...handlers));
        },

        /**
         * Adds a series of handlers for a PATCH route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        patch: (route, ...handlers) => {
            addRoute(route, routeChain.create('patch', ...handlers));
        },

        /**
         * Adds a series of handlers for a GET route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        get: (route, ...handlers) => {
            addRoute(route, routeChain.create('get', ...handlers));
        },

        /**
         * Adds a series of handlers for a DELETE route.
         *
         * @param {string|string[]} route The route(s) to add.
         * @param {function[]} handlers The handlers to add.
         */
        delete: (route, ...handlers) => {
            addRoute(route, routeChain.create('delete', ...handlers));
        },

        /**
         * Adds a series of error handlers. These are used when any route in this router throws an error.
         *
         * @param {function[]} handlers The handlers to add.
         */
        error: (...handlers) => {
            addErrorHandlers(routeChain.create('all', ...handlers));
        },

        /**
         * Handles a request, dispatching req and res to the correct route chain.
         *
         * @param {object} req The request object.
         * @param {object} res The response object.
         */
        handle: (req, res) => {
            const route = util.trimSlashes(req.url);

            /**
             * Dispatches an error to the routers error route chain.
             *
             * @param err The error to dispatch.
             */
            const handleError = (err) => {
                const chain = routeChain.append([], router.getErrorHandlers());

                const sendError = (err) => {
                    let status = 500;

                    if (util.isObject(err) && err.status) {
                        status = err.status;
                        delete err.status;
                    }

                    try {
                        res.status(status).send(err);
                    } catch (err) {
                        // eslint-disable-next-line no-console
                        console.error('Failed to send error response. Set an error handler that explicitly catches errors to suppress this log:', err);
                    }
                };

                // No handlers defined, send the original error
                if (chain.length === 0) {
                    sendError(err);
                    return;
                }

                // Traverse the error chain. If there's an error in the error handler, send it
                routeChain.traverse(req, res, chain, sendError, err);
            };

            /**
             * Dispatches the request/response to the FIRST matching regex route. If there are no matches, a 404 is
             * thrown. If there is an error, it is dispatched to the error handlers.
             */
            const handleRegexRoutes = () => {
                const routes = router.getRegexRoutes();
                const chain = [];

                for (let i = 0; i < routes.length; i++) {
                    const routeInfo = routes[i];
                    const matches = route.match(routeInfo.regex);

                    if (matches !== null) {
                        matches.shift(); // Shift away the first parameter that matches the whole route

                        // Make sure the route supports the method
                        if (routeInfo.handledMethods.all || routeInfo.handledMethods[req.method]) {

                            // Construct the route params
                            req.params = {};
                            for (let i = 0; i < routeInfo.keys.length; i++) {
                                req.params[routeInfo.keys[i].name] = matches[i];
                            }

                            routeChain.append(chain, routeInfo.chain);
                            break;
                        }
                    }
                }

                // If a matching route is not found, dispatch a 404
                if (chain.length === 0) {
                    const err = new Error('Not Found');
                    err.status = 404;

                    handleError(err);
                    return;
                }

                // Traverse the route chain, if an error is encountered, dispatch it to the error chain
                routeChain.traverse(req, res, chain, handleError);
            };

            /**
             * Handles a regular route. If there are no matches, the regex routes are tried. If there is an error, it is
             * dispatched to the error handlers.
             */
            const handleRegularRoutes = () => {
                const routeInfo = router.getRoutes()[route];
                const chain = routeInfo ? routeChain.append([], routeInfo.chain) : [];

                // No route that matches exactly, or a route that matches but doesn't support the request method, try regex
                if (chain.length === 0 || (!routeInfo.handledMethods.all && !routeInfo.handledMethods[req.method])) {
                    handleRegexRoutes();
                    return;
                }

                routeChain.traverse(req, res, chain, handleError);
            };

            handleRegularRoutes();
        }
    };

    return router;
};

module.exports = Router;
