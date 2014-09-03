//var https = require('https');
var http = require('http');
var fs = require('fs');

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
	        },
            static: function(name){
                return require('./lib/static.js').map(name);
            }
    	}
	});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// 设置js/css打包，使用默认_bundles
var bundler = require('connect-bundle')(require('./config.js'));
app.use(bundler);

// jquery-upload-file文件上传
var jqupload = require('jquery-file-upload-middleware');

// cookies,apitokens等需要保密
var credentials = require('./credentials.js');

// REST插件
var rest = require('connect-rest');

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
    secret: credentials.sessionSecret,
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

// 使用csrf
app.use(require('csurf')());
app.use(function(req, res, next){
    res.locals._csrfToken = req.csrfToken();
    next();
})

// 开始路由
require('./routes.js')(app);

// 页面跳转测试
app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});
app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
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

// 测试jqfu上传
app.get('/test-jqfu',function(req,res){
	res.render('test-jqfu');
});

// passport-github认证
var auth = require('./lib/auth.js')(app, {
        providers: credentials.authProviders,
        successRedirect: '/account',
        failureRedirect: '/unauthorized'
});
auth.init();
auth.registerRoutes();

//基于角色的认证
function allow(req,res,next,roles) {
    var user = req.user;
    if(user && roles.split(',').indexOf(user.role)!==-1) return true;
}

function customerOnly(req, res, next){
    var user = req.user;
    if(user && user.role==='customer') return next();
    res.redirect(303, '/unauthorized');
}

function employeeOnly(req, res, next){
    var user = req.user;
    if(user && user.role==='employee') return next();
    next('route');
}

app.get('/account', function(req, res, next){
    if(allow(req, res, next, 'customer,employee'))
        res.render('account',{user: req.user});
    else
        res.redirect(303, '/unauthorized');
});

app.get('/sales', employeeOnly, function(req, res){
    res.render('sales');
});

app.get('/unauthorized', function(req, res){
    res.render('unauthorized');
});


/*******rest api*********/
// api配置
var apiOptions = {
    //context: '/api',
    context: '/',
    domain: require('domain').create(),
};

// 为api配置domain
apiOptions.domain.on('error', function(err){
    console.log('API domain error.\n', err.stack);
    setTimeout(function(){
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    server.close();
    var worker = require('cluster').worker;
    if(worker) worker.disconnect();
});

// 把rest中间件加入管道，使用api子域名
var vhost = require('vhost');
app.use(vhost('api.*', rest.rester(apiOptions)));

// 使用REST插件提供api
var Attraction = require('./models/attraction.js');

rest.get('/attractions', function(req, content, cb){
    Attraction.find({ approved: true }, function(err, attractions){
        if(err) return cb({ error: 'Internal error.' });
        cb(null, attractions.map(function(a){
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('/attraction', function(req, content, cb){
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function(err, a){
        if(err) return cb({ error: 'Unable to add attraction.' });
        cb(null, { id: a._id });
    });
});

rest.get('/attraction/:id', function(req, content, cb){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return cb({ error: 'Unable to retrieve attraction.' });
        cb(null, {
            name: a.name,
            id: a._id,
            description: a.description,
            location: a.location,
        });
    });
});

// 404处理器
app.use(function(req, res, next){
	res.status(404);
	res.render('404');
});

// 500处理器
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

// https配置
// var options = {
//     key: fs.readFileSync(__dirname + '/ssl/meadowlark.pem'),
//     cert: fs.readFileSync(__dirname + '/ssl/meadowlark.crt')
// };

var server;

function startServer() {
    server = http.createServer(app).listen(app.get('port'), function(){
      console.log( 'Express started in ' + app.get('env') +
        ' mode on http://localhost:' + app.get('port') +
        '; press Ctrl-C to terminate.' );
    });
    // 使用https
    // server = https.createServer(options, app).listen(app.get('port'), function(){
    //   console.log( 'Express started in ' + app.get('env') +
    //     ' mode on http://localhost:' + app.get('port') +
    //     '; press Ctrl-C to terminate.' );
    // });
}

if(require.main === module){
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}