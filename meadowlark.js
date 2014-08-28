var fortune = require('./lib/fortune.js');

// express
var express = require('express');
var app = express();

// handlebars模板引擎
var handlebars = require('express3-handlebars')
	.create({ 
		defaultLayout:'main',
		helpers: {
	        section: function(name, options){
	            if(!this._sections) this._sections = {};
	            this._sections[name] = options.fn(this);
	            return null;
	        }
    	}
	});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// formidable文件上传
var formidable = require('formidable');

// jquery-upload-file文件上传
var jqupload = require('jquery-file-upload-middleware');

// 设置端口
app.set('port', process.env.PORT || 3000);

// POST请求体parser
app.use(require('body-parser')());

// 静态资源目录
app.use(express.static(__dirname + '/public'));

// 判断非产品状态 并且查询字符串中有test=1 
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' && 
		req.query.test === '1';
	next();
});

// jquery-upload-file中间件
app.use('/upload', function(req, res, next){
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function(){
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function(){
			return '/uploads/' + now;
		},
	})(req, res, next);
});

// 开始路由
app.get('/', function(req, res){
	res.render('home');
});

app.get('/about', function(req, res){
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	});
});

// 页面跳转测试
app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});

// 展示请求头信息
app.get('/headers', function(req,res){
	res.set('Content-Type','text/plain');
	var s = '';
	for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
	res.send(s);
});

// 测试section
app.get('/test-jquery', function(req, res){
	res.render('test-jquery');
});

// 测试客户端handlebars
app.get('/test-client-side', function(req, res){
	res.render('test-client-side');
});
app.get('/data/test-client-side', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

// 测试form
app.get('/test-form',function(req, res){
	res.render('test-form', {csrf: 'CSRF token goes here'});
});
app.get('/thank-you',function(req, res){
	res.render('thank-you');
});
app.post('/process',function(req, res){
	if(req.xhr || req.accepts('json,html')==='json'){
		res.send({success: true});
	}else{
		console.log('Form (from querystring): ' + req.query.form);
		console.log('CSRF token (from hidden form field): ' + req.body._csrf);
		console.log('Name (from visible form field): ' + req.body.name);
		console.log('Email (from visible form field): ' + req.body.email);
		res.redirect(303, '/thank-you');
	}	
});

// formidable上传图片
app.get('/contest/vacation-photo',function(req,res){
	var now = new Date();
	res.render('contest/vacation-photo',{
		year: now.getFullYear(),month: now.getMonth()
	});
});
app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) return res.redirect(303, '/error');
		console.log('received fields:');
		console.log(fields);
		console.log('received files:');
		console.log(files);
		res.redirect(303, '/thank-you');
	});
});

// 测试jqfu上传
app.get('/test-jqfu',function(req,res){
	res.render('test-jqfu');
});

// custom 404 page
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log( 'Express started on http://localhost:' +
		app.get('port') + '; press Ctrl-C to terminate.' );
});