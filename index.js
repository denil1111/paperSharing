
/**
 * Module dependencies.
 */

var logger = require('koa-logger');
var route = require('koa-route');
var koa = require('koa');
var serve = require('koa-static');
var app = module.exports = koa();
var bibTex = require('bibTex');

// middleware

app.use(logger());

// route middleware
var routes = require('./routes.js');
app.use(route.get('/', routes.list));
app.use(route.get('/paper/new', routes.add));
app.use(route.get('/paper/:id', routes.show));
app.use(route.post('/paper', routes.create));
app.use(route.post('/search', routes.search));
// app.use(route.post('/paper/:id', routes.update));
// app.use(route.get('/paper/:id/edit', routes.edit));
app.use(route.get('/paper/:id/delete', routes.remove));
app.use(route.get('/paper/:id/download', routes.download));
// setInterval(bibTex.reset, 600000);

//file dir 
app.use(serve(__dirname + '/papers'));
app.use(serve(__dirname + '/lib'));

// listen
app.listen(3000);
console.log('listening on port 3000');

