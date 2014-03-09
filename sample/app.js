var http = require('http')
var connect = require('connect')
var wtf = require('widgets');

// would be good to load a config file...
var siteConfig = {
	site: "www.sample.com",
	root: __dirname,
	port: 8080,
	staticOptions: { cache: false },
}

wtf.init(siteConfig);


var app = connect();
app.use(connect.bodyParser());
app.use(wtf.responder);

var server = http.createServer(app).listen(siteConfig.port);

console.log("listening on " + siteConfig.port)

