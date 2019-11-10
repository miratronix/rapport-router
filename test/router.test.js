'use strict';

require('./index.js');
const Router = require('../lib/router.js');

describe('Router', () => {

    let router;

    beforeEach(() => {
        router = Router();
    });

    it('Can add error handlers', () => {
        router.error(() => {}, () => {});
        const handlers = router.getErrorHandlers();
        handlers.should.have.a.property('length').that.equals(2);
        handlers[0].should.have.a.property('method').that.equals('all');
        handlers[1].should.have.a.property('method').that.equals('all');
        handlers[0].should.have.a.property('handle').that.is.a('function');
        handlers[1].should.have.a.property('handle').that.is.a('function');
    });

    context('Can add handlers to standard routes', () => {

        it('Can add an "all" handler', () => {
            router.all('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add an "put" handler', () => {
            router.put('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('put');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('put');
        });

        it('Can add an "post" handler', () => {
            router.post('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('post');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('post');
        });

        it('Can add an "patch" handler', () => {
            router.patch('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('patch');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('patch');
        });

        it('Can add an "get" handler', () => {
            router.get('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('get');
        });

        it('Can add an "delete" handler', () => {
            router.delete('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('delete');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('delete');
        });

        it('Can add multiple handlers to a route', () => {
            router.all('/test', () => {}, () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
            route.chain[1].should.have.a.property('method').that.equals('all');
        });

        it('Can add a flattened array of handlers to a route', () => {
            router.all('/test', [() => {}, () => {}], () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
            route.chain[1].should.have.a.property('method').that.equals('all');
            route.chain[2].should.have.a.property('method').that.equals('all');
        });

        it('Can add a handler to multiple routes', () => {
            router.all(['/test', '/yeah'], () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            router.getRoutes().should.have.a.property('yeah').that.is.an('object');

            const testRoute = router.getRoutes().test;
            testRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            testRoute.should.have.a.property('chain').that.is.an('array');
            testRoute.chain[0].should.have.a.property('method').that.equals('all');

            const yeahRoute = router.getRoutes().yeah;
            yeahRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            yeahRoute.should.have.a.property('chain').that.is.an('array');
            yeahRoute.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add a handler to an existing route', () => {
            router.put('/test', () => {});
            router.get('/test', () => {});
            router.getRoutes().should.have.a.property('test').that.is.an('object');
            const route = router.getRoutes().test;
            route.should.have.a.property('handledMethods').that.has.a.property('put');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('put');
            route.chain[1].should.have.a.property('method').that.equals('get');
        });

        it('Throws when a route is not a string', () => {
            (() => {
                router.all(42, () => {});
            }).should.throw(TypeError, 'Routes must be strings');
        });
    });

    context('Can add handlers to regex routes', () => {

        it('Can add a regex route', () => {
            router.all('/:id', () => {});
            const routes = router.getRegexRoutes();
            routes.should.be.an('array');
            routes[0].should.have.a.property('chain').that.is.an('array');
            routes[0].should.have.a.property('keys').that.is.an('array');
            routes[0].should.have.a.property('route').that.equals(':id');
            routes[0].should.have.a.property('regex').that.is.a('regexp');
        });

        it('Can add to the end of an existing regex route', () => {
            router.get('/:id', () => {});
            router.put('/:id', () => {});
            const routes = router.getRegexRoutes();
            routes.should.be.an('array');
            const route = routes[0];
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('handledMethods').that.has.a.property('put');
            route.should.have.a.property('chain').that.is.an('array');
            route.should.have.a.property('keys').that.is.an('array');
            route.should.have.a.property('route').that.equals(':id');
            route.should.have.a.property('regex').that.is.a('regexp');
            route.chain[0].should.have.a.property('method').that.equals('get');
            route.chain[1].should.have.a.property('method').that.equals('put');
        });
    });

    context('Can add routers', () => {

        it('Can add a router with a base path', () => {
            const subRouter = Router();
            subRouter.all('/', () => {});
            router.use('/test', subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test').that.is.a('object');
            const route = routes.test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add a router with an empty base path', () => {
            const subRouter = Router();
            subRouter.all('test', () => {});
            router.use('/', subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test').that.is.a('object');
            const route = routes.test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can combine two routers without base paths', () => {
            const subRouter = Router();
            subRouter.get('/', () => {});
            router.post('/', () => {});
            router.use(subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('').that.is.a('object');
            const route = routes[''];
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('handledMethods').that.has.a.property('post');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('post');
            route.chain[1].should.have.a.property('method').that.equals('get');
        });

        it('Can add a router that has a base path, with a base path', () => {
            const subRouter = Router();
            subRouter.all('/test', () => {});
            router.use('/test', subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test/test').that.is.a('object');
            const route = routes['test/test'];
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add a router without a base path', () => {
            const subRouter = Router();
            subRouter.all('test', () => {});
            router.use(subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test').that.is.a('object');
            const route = routes.test;
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add multiple routers to a route', () => {
            const testRouter = Router();
            const yeahRouter = Router();
            testRouter.all('test', () => {});
            yeahRouter.all('yeah', () => {});
            router.use(testRouter, yeahRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test').that.is.a('object');
            const testRoute = routes.test;
            testRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            testRoute.should.have.a.property('chain').that.is.an('array');
            testRoute.chain[0].should.have.a.property('method').that.equals('all');

            routes.should.have.a.property('yeah').that.is.a('object');
            const yeahRoute = routes.yeah;
            yeahRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            yeahRoute.should.have.a.property('chain').that.is.an('array');
            yeahRoute.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add a router to multiple base routes', () => {
            const subRouter = Router();
            subRouter.all('/test', () => {});
            router.use(['/test', '/yeah'], subRouter);
            const routes = router.getRoutes();

            routes.should.have.a.property('test/test').that.is.a('object');
            const testRoute = routes['test/test'];
            testRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            testRoute.should.have.a.property('chain').that.is.an('array');
            testRoute.chain[0].should.have.a.property('method').that.equals('all');

            routes.should.have.a.property('yeah/test').that.is.a('object');
            const yeahRoute = routes['yeah/test'];
            yeahRoute.should.have.a.property('handledMethods').that.has.a.property('all');
            yeahRoute.should.have.a.property('chain').that.is.an('array');
            yeahRoute.chain[0].should.have.a.property('method').that.equals('all');
        });

        it('Can add a regex route from a sub router', () => {
            const subRouter = Router();
            subRouter.all('/:id', () => {});
            router.use(subRouter);
            const routes = router.getRegexRoutes();

            routes.should.be.an('array');
            routes[0].should.have.a.property('chain').that.is.an('array');
            routes[0].should.have.a.property('keys').that.is.an('array');
            routes[0].should.have.a.property('route').that.equals(':id');
            routes[0].should.have.a.property('regex').that.is.a('regexp');
        });

        it('Throws when no router is supplied', () => {
            (() => {
                router.use('hello');
            }).should.throw(TypeError, 'At least one Rapport router must be supplied');
        });

        it('Throws when an invalid first parameter is supplied', () => {
            (() => {
                router.use(42);
            }).should.throw(TypeError, 'First parameter must be a string, Rapport router, or function');
        });

        it('Throws when a non-string base route is supplied', () => {
            (() => {
                router.use([42], () => {});
            }).should.throw(TypeError, 'Routes must be strings');
        });

        it('Throws when an invalid router is added', () => {
            (() => {
                router.use('/base', 42);
            }).should.throw(TypeError, 'Router must be a Rapport router');
        });
    });

    context('Can add middleware', () => {

        it('Can add middleware to new routes', () => {
            router.use(() => {});
            router.get('/', () => {});
            const routes = router.getRoutes();
            routes.should.have.a.property('').that.is.an('object');
            const route = routes[''];
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('all');
            route.chain[1].should.have.a.property('method').that.equals('get');
        });

        it('Can add middleware to existing standard routes', () => {
            router.get('/', () => {});
            router.use(() => {});
            const routes = router.getRoutes();
            routes.should.have.a.property('').that.is.an('object');
            const route = routes[''];
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('get');
            route.chain[1].should.have.a.property('method').that.equals('all');
        });

        it('Can add middleware to existing regex routes', () => {
            router.get('/:id', () => {});
            router.use(() => {});
            const routes = router.getRegexRoutes();
            const route = routes[0];
            route.should.have.a.property('handledMethods').that.has.a.property('all');
            route.should.have.a.property('handledMethods').that.has.a.property('get');
            route.should.have.a.property('chain').that.is.an('array');
            route.chain[0].should.have.a.property('method').that.equals('get');
            route.chain[1].should.have.a.property('method').that.equals('all');
        });
    });

    context('Can handle requests', () => {

        it('Calls handlers on a regular route', () => {
            const request = { method: 'get', url: 'test' };

            router.get('test', (req) => {
                req.handled = true;
            });

            router.handle(request, {});
            request.should.have.a.property('handled').that.equals(true);
        });

        it('Calls handlers on a regex route', () => {
            const request = { method: 'get', url: 'test/1' };

            router.get('test/:id', (req) => {
                req.handled = true;
            });

            router.handle(request, {});
            request.should.have.a.property('handled').that.equals(true);
        });

        it('Adds params to the request for a regex route', () => {
            const request = { method: 'get', url: 'test/1' };

            router.get('test/:id', () => {});
            router.handle(request, {});
            request.should.have.a.property('params');
            request.params.should.have.a.property('id').that.equals('1');
        });

        it('Sends a 404 when a no routes match', () => {
            const request = { method: 'get', url: 'test/1' };

            const response = {
                messageSent: '',
                statusSent: 200,
                send: (msg) => {
                    response.messageSent = msg;
                },
                status: (status) => {
                    response.statusSent = status;
                    return response;
                }
            };

            router.get('/test', () => {});
            router.all('/hello/:world', () => {});
            router.handle(request, response);
            response.statusSent.should.equal(404);
            response.messageSent.should.have.a.property('message').that.equals('Not Found');
        });

        it('Calls error handlers when a 404 happens', () => {
            const request = { method: 'get', url: 'test/1' };

            router.error((err, req) => {
                err.should.have.a.property('status').that.equals(404);
                err.should.have.a.property('message').that.equals('Not Found');
                req.error = true;
            });

            router.get('/test', () => {});
            router.all('/hello/:world', () => {});
            router.handle(request);
            request.should.have.a.property('error').that.equals(true);
        });

        it('Calls error handlers when a handler throws', () => {
            const request = { method: 'get', url: 'test' };

            router.error((err, req) => {
                err.should.have.a.property('message').that.equals('Nope');
                req.error = true;
            });

            router.get('/test', () => {
                throw new Error('Nope');
            });

            router.handle(request);
            request.should.have.a.property('error').that.equals(true);
        });

        it('Sends the error in the error handler if an error handler throws', () => {
            const request = { method: 'get', url: 'test/1' };

            const response = {
                messageSent: '',
                statusSent: 200,
                send: (msg) => {
                    response.messageSent = msg;
                },
                status: (status) => {
                    response.statusSent = status;
                    return response;
                }
            };

            router.error(() => {
                throw new Error('Error handler error!');
            });

            router.handle(request, response);
            response.statusSent.should.equal(500);
            response.messageSent.should.have.a.property('message').that.equals('Error handler error!');
        });

        it('Doesn\'t throw when the final error handler throws', () => {
            const request = { method: 'get', url: 'test/1' };

            const response = {
                messageSent: '',
                statusSent: 200,
                send: () => {
                    throw new Error('Whoops');
                },
                status: (status) => {
                    response.statusSent = status;
                    return response;
                }
            };

            router.error(() => {
                throw new Error('Error handler error!');
            });

            router.handle(request, response);
            response.statusSent.should.equal(500);
            response.messageSent.should.equal('');
        });
    });
});
