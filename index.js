const serve = require('koa-static');
const mount = require('koa-mount');
const Koa = require('koa');
const app = new Koa();

// Mount serving the public directory
app.use(mount('/', serve('public')));

// Listen on port
app.listen(3000);
