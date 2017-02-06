'use strict';

const util = require('./index.js');
const plugin = require('proxyquire')('../lib/index.js', {
    './websocket.js': (wrappedSocket) => {
        wrappedSocket.testMethod = () => {};
    }
});

describe('Plugin', () => {

    let Rapport;
    let rapport;

    beforeEach(() => {
        delete require.cache[require.resolve('rapport')];
        Rapport = require('rapport');
        rapport = Rapport();
    });

    it('Adds the router function to the rapport constructor', () => {
        Rapport.use(plugin);
        Rapport.should.have.a.property('Router').that.is.a('function');
    });

    it('Adds the router function to the rapport instance', () => {
        rapport.use(plugin);
        rapport.should.have.a.property('Router').that.is.a('function');
    });

    it('Throws when an invalid router is supplied', () => {
        rapport.use(plugin);
        (() => {
            rapport.wrap(util.mockNodeWebsocket(), { router: 'Invalid router' });
        }).should.throw(TypeError, 'options.router must be a Rapport router');
    });

    it('Extends the websocket when a valid router is supplied', () => {
        rapport.use(plugin);
        const wrappedSocket = rapport.wrap(util.mockNodeWebsocket(), { router: rapport.Router() });
        wrappedSocket.should.have.a.property('testMethod').that.is.a('function');
    });

    it('Adds itself to the window if it\'s present', () => {
        global.window = {};
        delete require.cache[require.resolve('../lib/index.js')];
        require('../lib/index.js');
        global.window.should.have.a.property('RapportRouter').that.is.a('object');
        delete global.window;
    });
});
