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
            mockSocket.fire('message', JSON.stringify({ requestId: 'hey', body: 'yeah' }));
        });
    });

    context('Handles HTTP requests', () => {

        it('Dispatches to the router', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: () => {
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    requestId: 'hey',
                    body: { url: 'url', method: 'method', body: 'body' }
                }));
            });
        });

        it('Creates a request object', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req) => {
                            req.should.have.a.property('id').equals('hey');
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
                    requestId: 'hey',
                    body: { url: 'url', method: 'method', body: 'body' }
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
                    requestId: 'hey',
                    body: { url: 'url?test=hello', method: 'method', body: 'body' }
                }));
            });
        });

        it('Creates a response object', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req, res) => {
                            res.should.have.a.property('_status').that.equals(200);
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
                    requestId: 'hey',
                    body: { url: 'url', method: 'method', body: 'body' }
                }));
            });
        });


        it('Creates a response object that can respond', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req, res) => {
                            res.respond('yup');
                            res.sent.should.equal(true);
                            mockSocket.messagesSent.should.equal(1);

                            const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                            lastMessage.should.have.a.property('responseId').that.equals('hey');
                            lastMessage.should.have.a.property('body').that.equals('yup');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    requestId: 'hey',
                    body: { url: 'url', method: 'method', body: 'body' }
                }));
            });
        });

        it('Creates a response object that can respond with an error', () => {
            return new Promise((resolve) => {
                wrappedSocket = Rapport.wrap(mockSocket, {
                    router: {
                        handle: (req, res) => {
                            res.respondWithError('yup');
                            res.sent.should.equal(true);
                            mockSocket.messagesSent.should.equal(1);

                            const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                            lastMessage.should.have.a.property('responseId').that.equals('hey');
                            lastMessage.should.have.a.property('error').that.equals('yup');
                            resolve();
                        }
                    }
                });
                extendWebsocket(wrappedSocket);
                mockSocket.fire('message', JSON.stringify({
                    requestId: 'hey',
                    body: { url: 'url', method: 'method', body: 'body' }
                }));
            });
        });

        context('Creates a response object that can send a response', () => {

            it('Defaults the status to 200', () => {
                return new Promise((resolve) => {
                    wrappedSocket = Rapport.wrap(mockSocket, {
                        router: {
                            handle: (req, res) => {
                                res.send('yup');
                                res.sent.should.equal(true);
                                mockSocket.messagesSent.should.equal(1);

                                const lastMessage = JSON.parse(mockSocket.lastSentMessage);
                                lastMessage.should.have.a.property('responseId').that.equals('hey');
                                lastMessage.should.have.a.property('body');
                                lastMessage.body.should.have.a.property('status').that.equals(200);
                                lastMessage.body.should.have.a.property('body').that.equals('yup');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        requestId: 'hey',
                        body: { url: 'url', method: 'method', body: 'body' }
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
                                lastMessage.should.have.a.property('responseId').that.equals('hey');
                                lastMessage.should.have.a.property('body');
                                lastMessage.body.should.have.a.property('status').that.equals(250);
                                lastMessage.body.should.have.a.property('body').that.equals('250?');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        requestId: 'hey',
                        body: { url: 'url', method: 'method', body: 'body' }
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
                                lastMessage.should.have.a.property('responseId').that.equals('hey');
                                lastMessage.should.have.a.property('error');
                                lastMessage.error.should.have.a.property('status').that.equals(400);
                                lastMessage.error.should.have.a.property('body').that.equals('nope');
                                resolve();
                            }
                        }
                    });
                    extendWebsocket(wrappedSocket);
                    mockSocket.fire('message', JSON.stringify({
                        requestId: 'hey',
                        body: { url: 'url', method: 'method', body: 'body' }
                    }));
                });
            });
        });
    });
});
