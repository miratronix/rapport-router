'use strict';

const Rapport = require('rapport');
const util = require('./index.js');
const extendWebsocket = require('../lib/websocket.js');

describe('Websocket', () => {

    let mockSocket;
    let wrappedSocket;

    beforeEach(() => {
        mockSocket = util.mockNodeWebsocket();
        wrappedSocket = Rapport.wrap(mockSocket);
    });

    it('Still handles messages', () => {
        extendWebsocket(wrappedSocket);
        return new Promise((resolve) => {
            wrappedSocket.onMessage((msg, ws) => {
                msg.isRequest.should.equal(false);
                msg.should.have.a.property('body');
                msg.body.should.have.a.property('hello').that.equals('world');
                ws.should.deep.equal(wrappedSocket);
                ws.should.not.have.a.property('_status');
                resolve();
            });
            mockSocket.fire('message', JSON.stringify({ hello: 'world' }));
        });
    });

    it('Handles double wrapping', () => {
        extendWebsocket(wrappedSocket);
        extendWebsocket(wrappedSocket);
        return new Promise((resolve) => {
            wrappedSocket.onMessage((msg, ws) => {
                msg.isRequest.should.equal(false);
                msg.should.have.a.property('body');
                msg.body.should.have.a.property('hello').that.equals('world');
                ws.should.deep.equal(wrappedSocket);
                ws.should.not.have.a.property('_status');
                resolve();
            });
            mockSocket.fire('message', JSON.stringify({ hello: 'world' }));
        });
    });

    it('Still handles requests', () => {
        extendWebsocket(wrappedSocket);
        return new Promise((resolve) => {
            wrappedSocket.onMessage((msg, res) => {
                msg.isRequest.should.equal(true);
                msg.should.have.a.property('id').equals('hey');
                msg.should.have.a.property('body').that.equals('yeah');
                res.should.have.a.property('sent').that.equals(false);
                res.should.have.a.property('send').that.equals(wrappedSocket.send);
                res.should.have.a.property('respond').that.is.a('function');
                res.should.have.a.property('respondWithError').that.is.a('function');
                res.should.not.have.a.property('_status');
                resolve();
            });
            mockSocket.fire('message', JSON.stringify({ _rq: 'hey', _b: 'yeah' }));
        });
    });

    context('Handles HTTP requests', () => {

        it('Dispatches to the router', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: resolve
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'hey',
                    _b: { _u: 'url', _m: 'method', _b: 'body' }
                }));
            });
        });

        it('Creates a request object', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('id').equals('hey');
                            req.should.have.a.property('responseExpected').that.equals(true);
                            req.should.have.a.property('url').that.equals('url');
                            req.should.have.a.property('method').that.equals('method');
                            req.should.have.a.property('body').that.equals('body');
                            req.should.have.a.property('query').that.is.an('object');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'hey',
                    _b: { _u: 'url', _m: 'method', _b: 'body' }
                }));
            });
        });

        it('Parses query strings', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('query').that.is.an('object');
                            req.query.should.have.a.property('test').that.equals('hello');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'hey',
                    _b: { _u: 'url?test=hello', _m: 'method', _b: 'body' }
                }));
            });
        });

        it('Parses query strings with two duplicate parameters', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('query').that.is.an('object');
                            req.query.should.have.a.property('test').that.deep.equals(['foo', 'bar']);
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'hey',
                    _b: { _u: 'url?test=foo&test=bar', _m: 'method', _b: 'body' }
                }));
            });
        });

        it('Parses query strings with three or more duplicate parameters', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('query').that.is.an('object');
                            req.query.should.have.a.property('test').that.deep.equals(['foo', 'bar', 'baz']);
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _rq: 'hey',
                    _b: { _u: 'url?test=foo&test=bar&test=baz', _m: 'method', _b: 'body' }
                }));
            });
        });

        context('Creates a response object', () => {

            it('Is created', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.should.have.a.property('_status').that.equals(200);
                                res.should.have.a.property('_body').that.equals(undefined);
                                res.should.have.a.property('sent').that.equals(false);
                                res.should.have.a.property('status').that.is.a('function');
                                res.should.have.a.property('respond').that.is.a('function');
                                res.should.have.a.property('respondWithError').that.is.a('function');
                                res.should.have.a.property('send').that.is.a('function');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });

            it('Can respond', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.respond('yup');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('_rs').that.equals('hey');
                                lastMessage.should.have.a.property('_b').that.equals('yup');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });

            it('Can respond with an error', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.respondWithError('yup');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('_rs').that.equals('hey');
                                lastMessage.should.have.a.property('_e').that.equals('yup');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });

            it('Defaults the status to 200', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.send('yup');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('_rs').that.equals('hey');
                                lastMessage.should.have.a.property('_b');
                                lastMessage._b.should.have.a.property('_s').that.equals(200);
                                lastMessage._b.should.have.a.property('_b').that.equals('yup');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });

            it('Can send a defined status', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.status(250).send('250?');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('_rs').that.equals('hey');
                                lastMessage.should.have.a.property('_b');
                                lastMessage._b.should.have.a.property('_s').that.equals(250);
                                lastMessage._b.should.have.a.property('_b').that.equals('250?');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });

            it('Sends an error when the status isn\'t 2xx', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.status(400).send('nope');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('_rs').that.equals('hey');
                                lastMessage.should.have.a.property('_e');
                                lastMessage._e.should.have.a.property('_s').that.equals(400);
                                lastMessage._e.should.have.a.property('_b').that.equals('nope');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _rq: 'hey',
                        _b: { _u: 'url', _m: 'method', _b: 'body' }
                    }));
                });
            });
        });
    });

    context('Handles HTTP messages', () => {

        it('Dispatches to the router', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: resolve
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _u: 'url',
                    _m: 'method',
                    _b: 'body'
                }));
            });
        });

        it('Creates a request object', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('id').equals(undefined);
                            req.should.have.a.property('responseExpected').that.equals(false);
                            req.should.have.a.property('url').that.equals('url');
                            req.should.have.a.property('method').that.equals('method');
                            req.should.have.a.property('body').that.equals('body');
                            req.should.have.a.property('query').that.is.an('object');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _u: 'url',
                    _m: 'method',
                    _b: 'body'
                }));
            });
        });

        it('Parses query strings', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('query').that.is.an('object');
                            req.query.should.have.a.property('test').that.equals('hello');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    _u: 'url?test=hello',
                    _m: 'method',
                    _b: 'body'
                }));
            });
        });

        context('Creates a no-op response object', () => {

            it('Is created', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.should.have.a.property('_status').that.equals(undefined);
                                res.should.have.a.property('sent').that.equals(undefined);
                                res.should.have.a.property('status').that.is.a('function');
                                res.should.have.a.property('respond').that.is.a('function');
                                res.should.have.a.property('respondWithError').that.is.a('function');
                                res.should.have.a.property('send').that.is.a('function');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }));
                });
            });

            it('Does nothing when status is called', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.status('yup');
                                res.should.have.a.property('_status').that.equals(undefined);
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }));
                });
            });

            it('Does nothing when send is called', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.send('yup');
                                res.should.have.a.property('sent').that.equals(undefined);
                                mockSocket.messagesSent.should.equal(0);
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }));
                });
            });

            it('Does nothing when respond is called', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.respond('yup');
                                res.should.have.a.property('sent').that.equals(undefined);
                                mockSocket.messagesSent.should.equal(0);
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }));
                });
            });

            it('Does nothing when respondWithError is called', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.respondWithError('yup');
                                res.should.have.a.property('sent').that.equals(undefined);
                                mockSocket.messagesSent.should.equal(0);
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        _u: 'url',
                        _m: 'method',
                        _b: 'body'
                    }));
                });
            });
        });
    });
});
