var http = require('http');
var fs = require('fs');

// 模拟数据
var fortune = require('./lib/fortune.js');

// 初始化数据
var Vacation = require('./models/vacation.js');
Vacation.find(function(err, vacations){
    if(vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' + 
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});

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

// cookies,apitokens等需要保密
var credentials = require('./credentials.js');

// nodemailer
var nodemailer = require('nodemailer');
var mailTransport = nodemailer.createTransport({
	host: 'smtp.sina.com',
	secureConnection: true,
	port: 465,
	auth: {
		user: credentials.sinaSmtp.user,
		pass: credentials.sinaSmtp.password,
	}
});

// 设置端口
app.set('port', process.env.PORT || 3000);

// domain处理异常
app.use(function(req, res, next){
    // 创建domain
    var domain = require('domain').create();
    domain.on('error', function(err){
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 给服务器最后5秒钟响应正在处理的请求，然后关闭
            setTimeout(function(){
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);
            // 如果在集群中，退出，集群将不会分配请求
            var worker = require('cluster').worker;
            if(worker) worker.disconnect();
            // 服务器不接受请求
            server.close();
            try {
                // 使用错误处理器响应出错的请求
                next(err);
            } catch(err){
                // 如果处理器抛出异常，使用Node的api响应
                console.error('Express error mechanism failed.\n', err.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch(err){
            // 如果都没法处理，客户端最终超时，记录日志
            console.error('Unable to send 500 response.\n', err.stack);
        }
    });
    // 添加res和req到domain中，两个对象任何方法抛出的异常都会被domain捕获
    domain.add(req);
    domain.add(res);
    // 在domain上下文中执行下一个中间件
    domain.run(next);
});

// 测试不同生产环境下的日志输出
switch(app.get('env')){
	case 'development':
		app.use(require('morgan')('dev'));
		break;
	case 'production':
		app.use(require('express-logger')({
			path: __dirname + '/log/requests.log'
		}));
		break;
}

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

// 连接Mongodb
var mongoose = require('mongoose');
var opts = {
	server: {
		socketOptions: { keepAlive: 1 }
	}
};
switch(app.get('env')){
	case 'development':
		mongoose.connect(credentials.mongo.development.connectionString, opts);
		break;
	case 'production':
		mongoose.connect(credentials.mongo.production.connectionString, opts);
		break;
	default:
		throw new Error('Unknown execution environment: ' + app.get('env'));
}

// cookie中间件
app.use(require('cookie-parser')(credentials.cookieSecret));

// session中间件 在mongoDB中存储session数据
var session    = require('express-session');
app.use(session({
	key: 'session',
    secret: credentials.cookieSecret,
    store: require('mongoose-session')(mongoose)
}));

// flash message中间件
app.use(function(req, res, next){
	// 显示之后就删除session中的flash信息
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

// cluster记录当前响应worker
app.use(function(req,res,next){
	var cluster = require('cluster');
	if(cluster.isWorker) console.log('Worker %d received request',
		cluster.worker.id);
	next();
});

// 开始路由
app.get('/', function(req, res){
	res.render('home');
	res.cookie('monster', 'nom nom');
	res.cookie('signed_monster', 'nom nom', { signed: true });
});

app.get('/about', function(req, res){
	// 测试发送邮件
	mailTransport.sendMail({
		from: '"xiaop" <pyqiverson@sina.com>',
		to: 'mf1332047@software.nju.edu.cn',
		subject: 'test',
		test: '测试内容'
	},function(err){
		if(err) console.error('发送失败：' + err);
	});

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

// 测试vacation
app.get('/set-currency/:currency', function(req,res){
	req.session.currency = req.params.currency;
	return res.redirect(303, '/vacations');
});

function convertFromUSD(value, currency){
	switch(currency){
		case 'USD': return value * 1;
		case 'GBP': return value * 0.6;
		case 'BTC': return value * 0.0023707918444761;
		default: return NaN;
	}
}

app.get('/vacations', function(req, res){
	Vacation.find({ available: true }, function(err, vacations){
		var currency = req.session.currency || 'USD';
		var context = {
			currency: currency,
			vacations: vacations.map(function(vacation){
				return {
					sku: vacation.sku,
					name: vacation.name,
					description: vacation.description,
					inSeason: vacation.inSeason,
					price: convertFromUSD(vacation.priceInCents/100, currency),
					qty: vacation.qty,
				}
			})
		};
		switch(currency){
			case 'USD': context.currencyUSD = 'selected'; break;
			case 'GBP': context.currencyGBP = 'selected'; break;
			case 'BTC': context.currencyBTC = 'selected'; break;
		}
		res.render('vacations', context);
	});
});

var VacationInSeasonListener = require('./models/vacationInSeasonListener.js');
app.get('/notify-me-when-in-season', function(req, res){
	res.render('notify-me-when-in-season', { sku: req.query.sku });
});
app.post('/notify-me-when-in-season', function(req, res){
	VacationInSeasonListener.update(
		{ email: req.body.email },
		{ $push: { skus: req.body.sku } },
		{ upsert: true },
		function(err){
		if(err) {
			console.error(err.stack);
			req.session.flash = {
				type: 'danger',
				intro: 'Ooops!',
				message: 'There was an error processing your request.',
			};
			return res.redirect(303, '/vacations');
		}
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You will be notified when this vacation is in season.',
		};
		return res.redirect(303, '/vacations');
		}
	);
});

// formidable上传图片
app.get('/contest/vacation-photo',function(req,res){
	var now = new Date();
	res.render('contest/vacation-photo',{
		year: now.getFullYear(),month: now.getMonth()
	});
});

var dataDir = __dirname + '/data';
var vacationPhotoDir = dataDir + '/vacation-photo';
fs.existsSync(dataDir) || fs.mkdirSync(dataDir);
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

function saveContestEntry(contestName, email, year, month, photoPath){
	//..
}

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if(err) return res.redirect(303, '/error');
		if(err){
			res.session.flash = {
				type: 'danger',
				intro: 'Oops!',
				message: 'There was an error processing your submission.'
					+ 'Please try again.'
			};
			return res.redirect(303, '/contest/vacation-photo');
		}
		var photo = files.photo;
		var dir = vacationPhotoDir + '/' + Date.now();
		var path = dir + '/' + photo.name;
		fs.mkdirSync(dir);
		fs.renameSync(photo.path, path);
		saveContestEntry('vacation-photo', fields.email, 
			req.params.year, req.params.month, path);
		req.session.flash = {
			type: 'success',
			intro: 'Good luck!',
			message: 'You have been entered into the contest.'
		};
		res.redirect(303, '/contest/vacation-photo/entries');
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

var server;

function startServer() {
    server = http.createServer(app).listen(app.get('port'), function(){
      console.log( 'Express started in ' + app.get('env') +
        ' mode on http://localhost:' + app.get('port') +
        '; press Ctrl-C to terminate.' );
    });
}

if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}