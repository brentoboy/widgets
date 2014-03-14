var http = require('http')
var connect = require('connect')
var wtf = require('widgets');

// would be good to load a config file...
var siteConfig = {
	site: "www.sample.com",
	root: __dirname,
	port: 8080,
	staticOptions: { cache: false },
	logToConsole: true,
}

wtf.init(siteConfig);


var app = connect();
app.use(wtf.initLogs);
app.use(function(req, res, next){
  res.on('finish', function(){
    wtf.logRequest(req, res, function(){});
  });
  next();
});
app.use(wtf.chooseRoute);
app.use(wtf.extractParams);
app.use(wtf.dynamicCss);
app.use(wtf.dynamicJs);
app.use(wtf.chooseActionUx);
app.use(wtf.prepareResponse);
app.use(function(req,res,next) { wtf.sendResponse(req,res, function(){})});

var server = http.createServer(app).listen(siteConfig.port);

console.log("listening on " + siteConfig.port)

