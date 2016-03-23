
/**
 * Module dependencies.
 */

var logger = require('koa-logger');
var route = require('koa-route');
var koa = require('koa');
var serve = require('koa-static');
var app = module.exports = koa();

// middleware

app.use(logger());

// route middleware
var routes = require('./routes.js');
app.use(route.get('/', routes.list));
app.use(route.get('/paper/new', routes.add));
app.use(route.get('/paper/:id', routes.show));
app.use(route.post('/paper', routes.create));
app.use(route.post('/paper/:id', routes.update));
app.use(route.get('/paper/:id/edit', routes.edit));
app.use(route.get('/paper/:id/delete', routes.remove));

//file dir 
app.use(serve(__dirname + '/papers'));

// listen
app.listen(3000);
console.log('listening on port 3000');

