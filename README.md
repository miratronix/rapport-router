# rapport-router [![CircleCI](https://circleci.com/gh/miratronix/rapport-router.svg?style=svg)](https://circleci.com/gh/miratronix/rapport-router) [![Coverage Status](https://coveralls.io/repos/github/miratronix/rapport-router/badge.svg)](https://coveralls.io/github/miratronix/rapport-router)
[![NPM](https://nodei.co/npm/rapport-router.png)](https://npmjs.org/package/rapport-router)

Express style router plugin for Rapport, intended for use with [rapport-http](https://github.com/miratronix/rapport-http).

## Installation
Node: Install the plugin via NPM: `npm install --save rapport-router`
Browser: Attach `rapport.router.min.js` to your HTML page

Then add the plugin to rapport:
```javascript
// Globally
Rapport.use(require('rapport-router')); // In Node.js
Rapport.use(RapportRouter); // In the browser

// Or to a instance
Rapport(wsImplementation).use(require('rapport-router')); // In Node.js
Rapport(wsImplementation).use(RapportRouter); // In the browser
```

## Usage
This plugin adds a method to the global Rapport constructor. To create a new router, simply call it:
```javascript
const router = Rapport.Router();
```

Once you have a router, usage is similar to [express.js](https://expressjs.com/en/guide/routing.html):
```javascript
// Add a get route for /users
router.get('/users', (req, res, next) => {
    res.status(200).send({
        users: []
    });
});

// You can nest routers
const userRouter = Rapport.Router();
const mainRouter = Rapport.Router();
userRouter.get('/users', () => {});
mainRouter.use('/v1', userRouter); // The exposed route is now /v1/users

// Or add middleware to all routes
router.use((req, res, next) => {
    console.log('Got a request'); 
});

// Regex is supported
router.get('/user/:id', (req, res, next) => {
    console.log(req.params.id);
});

// Route arrays and multiple handlers are also supported
router.get(['/users', '/people'], () => {}, () => {}); // For routes
router.use(() => {}, () => {}); // For middleware
router.use(['/v1', '/v2'], router1, router2); // And for routers

// Returning a promise calls next automatically when the promise resolves
router.get('/user', 
    (req, res) => {
        return Promise.resolve();
    },
    (req, res) => {
        res.status(200).send({
            users: []
        });
    });

// You can add also add a error handler to all routes
router.error((err, req, res, next) => {
    console.log(`Encountered an error!`);
});
```

Once a router has been created, you can add it to the Rapport websocket:
```javascript
// To just the specific websocket
Rapport(wsImplementation).create('url', { router: router }); // Or
Rapport(wsImplementation).wrap(existingSocket, { router: router });

// Or to all the sockets created by the Rapport instance
Rapport(wsImplementation, { router: router }); // Or
Rapport(wsImplementation).configure({ router: router });

// Or to all sockets created by all Rapport instances
Rapport.configure({ router: router });
```
