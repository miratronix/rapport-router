'use strict';

require('./index.js');
const routeChain = require('../lib/route.chain.js');

describe('Route Chain', () => {

    context('Can create a chain', () => {

        it('Throws when creating with no entries', () => {
            (() => {
                routeChain.create('all');
            }).should.throw(TypeError, 'At least one handler function must be supplied');
        });

        it('Throws when an entry is not a function', () => {
            (() => {
                routeChain.create('all', 42);
            }).should.throw(TypeError, 'Handlers must be functions');
        });

        it('Creates a chain when functions are supplied', () => {
            const handlerOne = () => {};
            const handlerTwo = () => {};
            const chain = routeChain.create('all', handlerOne, handlerTwo);

            chain.should.have.a.property('length').that.equals(2);
            chain[0].should.have.a.property('method').that.equals('all');
            chain[0].should.have.a.property('handle').that.equals(handlerOne);
            chain[1].should.have.a.property('method').that.equals('all');
            chain[1].should.have.a.property('handle').that.equals(handlerTwo);
        });
    });

    context('Can determine handled methods', () => {

        it('Set handled methods to true', () => {
            const chain = [{ method: 'all' }, { method: 'get' }];
            const handled = routeChain.handledMethods(chain);
            handled.should.have.a.property('all').that.equals(true);
            handled.should.have.a.property('get').that.equals(true);
        });

        it('Doesn\'t set unhandled methods', () => {
            const chain = [{ method: 'all' }, { method: 'get' }];
            const handled = routeChain.handledMethods(chain);
            handled.should.not.have.a.property('post');
            handled.should.not.have.a.property('put');
            handled.should.not.have.a.property('patch');
            handled.should.not.have.a.property('delete');
        });
    });

    context('Can append existing route chains', () => {

        it('Appends a route chain onto an existing one', () => {
            const chain = [{ method: 'all' }, { method: 'get' }];
            const newChain = [{ method: 'all' }, { method: 'put' }];
            routeChain.append(chain, newChain);
            chain.should.have.a.property('length').that.equals(4);
        });

        it('Returns the appended route chain', () => {
            const chain = [{ method: 'all' }, { method: 'get' }];
            const newChain = [{ method: 'all' }, { method: 'put' }];
            const returned = routeChain.append(chain, newChain);
            returned.should.equal(chain);
        });

        it('Appends multiple route chains', () => {
            const chain = [{ method: 'all' }, { method: 'get' }];
            const newChain = [{ method: 'all' }, { method: 'put' }];
            const newChainTwo = [{ method: 'all' }, { method: 'put' }];
            routeChain.append(chain, newChain, newChainTwo);
            chain.should.have.a.property('length').that.equals(6);
        });
    });

    context('Can traverse a route chain', () => {

        it('Calls handlers with a matching verb', () => {
            let gets = 0;
            let puts = 0;

            const chain = routeChain.append(
                routeChain.create('get', (req, res, next) => {
                    gets++;
                    next();
                }),
                routeChain.create('put', (req, res, next) => {
                    puts++;
                    next();
                })
            );

            routeChain.traverse({ method: 'put' }, {}, chain, (err) => {});
            puts.should.equal(1);
            gets.should.equal(0);
        });

        it('Calls handlers that are registered to "all"', () => {
            let gets = 0;
            let all = 0;

            const chain = routeChain.append(
                routeChain.create('get', (req, res, next) => {
                    gets++;
                    next();
                }),
                routeChain.create('all', (req, res, next) => {
                    all++;
                    next();
                })
            );

            routeChain.traverse({ method: 'get' }, {}, chain, (err) => {});
            all.should.equal(1);
            gets.should.equal(1);
        });

        it('Stops when a handler does not call next()', () => {
            let gets = 0;
            let all = 0;

            const chain = routeChain.append(
                routeChain.create('get', () => {
                    gets++;
                }),
                routeChain.create('all', (req, res, next) => {
                    all++;
                    next();
                })
            );

            routeChain.traverse({ method: 'get' }, {}, chain, (err) => {});
            all.should.equal(0);
            gets.should.equal(1);
        });

        it('Calls the error callback when a handler throws', () => {
            let errors = 0;

            const chain = routeChain.create('get', () => {
                throw new Error('error!');
            });

            routeChain.traverse({ method: 'get' }, {}, chain, () => {
                errors++;
            });

            errors.should.equal(1);
        });

        it('Gives an error to the handler when one is supplied', () => {
            let error = '';

            const chain = routeChain.append(
                routeChain.create('all', (err) => {
                    error = err;
                })
            );

            routeChain.traverse({ method: 'get' }, {}, chain, () => {}, new Error('Broken'));
            error.should.have.a.property('message').that.equals('Broken');
        });

        it('Calls next when a handler returns a promise', () => {
            return new Promise((resolve) => {
                const chain = routeChain.create('get', () => {
                    return Promise.resolve();
                }, resolve);
                routeChain.traverse({ method: 'get' }, {}, chain, () => {});
            });
        });

        it('Calls the error handler when a handler returns a rejected promise', () => {
            return new Promise((resolve, reject) => {
                const chain = routeChain.create('get', () => {
                    return Promise.reject();
                }, reject);
                routeChain.traverse({ method: 'get' }, {}, chain, () => {
                    resolve();
                });
            });
        });
    });
});
