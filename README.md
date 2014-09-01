# 《Web Development With Node And Express》
笔记
## ch3 start
express中路由的顺序很重要，如果404handler放在routes之前，都会指向404页面。

配置静态资源目录
`app.use(express.static(__dirname + '/public'));`
使用时，路径相对于public

`git init`创建一个新的repo
.gitignore中的条目也适用于子目录，所以*~将忽略所有备份文件

`git add`命令只是增加改变而不是文件。`git add -A`增加全部。
`git commit -m "message"`提交改变
`git remote add origin git@github.com:xiaoiver/meadowlark.git`
`git push -u origin master`

package.json包含了依赖。npm install进行安装
```javascript
{
    "dependencies": {
    "express": "^4.0.0",
    "express3-handlebars": "^0.5.0"
    }
}
```
exports可以封装方法供外界调用。

require加载路径`./`告诉node不去node_modules目录下查找

## ch5 qa
测试框架mocha，第三方js和css放在public/vendor下
assertion库chai

app.use中next()

### 页面跳转测试
headless browser PhantomJs,Zombie

zombie暂时还不支持windows平台

### 两个错误
* mocha默认时间太短导致测试出错，通过`--timeout 15000`[增加时间](http://stackoverflow.com/questions/16607039/in-mocha-testing-while-calling-asynchronous-function-how-to-avoid-the-timeout-er)，Gruntfile.js中添加在option属性中
* done()的位置，通知mocha我们的工作已经完成，否则会报timeout error

### 逻辑测试
`npm install -g mocha`全局安装

`mocha -u tdd -R spec qa/tests-unit.js`单元测试

### 检验框架
`npm install -g jshint`

`jshint meadowlark.js`

`if( app.thing == null ) console.log( 'bleat!' );`会提示使用===代替==

### 链接检测
检测死链接，循环链接[linkchecker](http://wummel.github.io/linkchecker)

`python setup.py build`需要安装request

* 首先安装pip`sudo apt-get install python-pip`
* 通过pip安装`pip install requests`

`python setup.py install`时报错“python.h 没有那个文件或目录”

原因是没有安装Python的头文件和静态库包`sudo apt-get install python-dev`

`linkchecker http://localhost:3000`检查

### Grunt自动运行测试任务
安装grunt命令行`sudo npm install -g grunt-cli`

安装grunt`npm install --save-dev grunt`

Grunt依赖插件完成工作如mocha,jshint和linkchecker。由于linkchecker没有对应插件
使用通用插件exec执行命令行。

`npm install --save-dev grunt-cafe-mocha`

`npm install --save-dev grunt-contrib-jshint`

`npm install --save-dev grunt-exec`

### 注意
* grunt-contrib-jshint只允许包含文件，不想包含node_modules和public/vendor下的文件
* `/**/`表示所有子文件夹下的文件
* `grunt.option()`可以接收命令行传递的参数`grunt deploy --target=staging`

### 持续集成
Travis CI

## ch6 req res
### 请求体
get请求没有请求体，post请求有

* application/x-www-form-urlencoded 编码后的键值对
* multipart/form-data 支持文件上传
* application/json ajax请求

### Request对象
* req.query 包含querystring(GET参数)中的键值对。
* req.body 包含POST参数，之所以叫"body"是因为POST参数包含在请求体中。
* req.cookies/req.signedCookies 从客户端传来的cookie，需要中间件支持
* req.headers 请求头
* req.xhr 来自ajax请求就返回true

### Response对象
* res.status(code) 状态码
* res.cookie(name, value, [options]), res.clearCookie(name, [options])
* res.redirect([status], url) 状态码默认302，永久转移301
* res.send(body), res.send(status, body)
* res.json(json), res.json(status, json)
* res.jsonp(json), res.jsonp(status, json)
* res.format(object) 根据请求头中Accept返回不同内容，通常用在API中
* res.attachment([filename]), res.download(path, [filename], [callback])两个方法都将响应头Content-Disposition设置成attachment，浏览器会下载而不是展示内容。两个方法区别是前者只是设置响应头，还需要继续发送内容到客户端
* res.locals, res.render(view, [locals], callback) ch7

### Express源码
p61

### 展示内容
即使没有用到next()，也要显式写出告诉Express这是错误处理
```javascript
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).render('error');
});
```

### 处理表单

```javascript
app.post('/process-contact', function(req, res){
    console.log('Received contact from ' + req.body.name +
        ' <' + req.body.email + '>');
    try {
        // save to database....
        return res.xhr ?
            res.render({ success: true }) :
            res.redirect(303, '/thank-you');
    } catch(ex) {
        return res.xhr ?
            res.json({ error: 'Database error.' }) :
            res.redirect(303, '/database-error');
    }
});
```

### 提供api
Restful GET,POST,PUT,DELETE，类似rails

app.get/post/put/del

## ch7 handlebars
js通过document.write生成html代码，但是存在问题
* 字符转意问题
* html代码中可能还包含js，让人抓狂
* 编辑中代码高亮等功能无效
* 可读性差

### Jade
Express[作者](http://jade-lang.com)

不需要闭合标签

### Handlebars基础
上下文对象`{ name: 'Buttercup' }`，在模板中通过`{{name}}`就能得到值

如果想要传递的是html代码，需要使用`{{{name}}}`

### 注释
`{{! super-secret comment }}`和<!-- not-so-secret comment -->的区别就是后者能通过查看源码看到。

### 块

```javascript
{
    currency: {
        name: 'United States dollars',
        abbrev: 'USD',
    },
    tours: [
        { name: 'Hood River', price: '$99.95' },
        { name: 'Oregon Coast', price, '$159.95' },
    ],
    specialsUrl: '/january-specials',
    currencies: [ 'USD', 'GBP', 'BTC' ],
}
```
使用`../`退回上一层上下文，`{{.}}`代表当前的上下文

```javascript
<ul>
    {{#each tours}}
        {{! I'm in a new block...and the context has changed }}
        <li>
            {{name}} - {{price}}
            {{#if ../currencies}}
                ({{../../currency.abbrev}})
            {{/if}}
        </li>
    {{/each}}
</ul>
```
if和each都有可选的else块。

如果有一个helper叫foo，`{{foo}}`指向它，而`{{./foo}}`指向当前上下文的同名属性。

### 服务端模板

安装handlebars`npm install --save express3-handlebars`

改变扩展名`require('express3-handlebars').create({ extname: '.hbs' })`

默认view cache只在生产模式下打开，在开发模式下打开`app.set('view cache', true);`

### partials
和rails中一样，存放在views/partials/文件夹下，也可以建立子文件夹。 

`{{> weather}}` `{{> social/facebook}}` ch10

### sections
handlebars中没有直接实现，但可以通过使用helper

```javascript
var handlebars = require('express3-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
```

### 完善模板
使用html5boilerplate

### 客户端handlebars
Handlebars.compile()将模板编译返回一个function，接受传入的参数

## ch8 表单处理
推荐使用303重定向而不是302响应表单提交

重定向到
* 成功/失败页面，优点是易于统计，缺点是需要分配额外的url，用户需要导航到之前的页面
* 当前页面，带有flash信息作为反馈
* 新的页面，带有flash信息作为反馈

### 使用Express处理表单
安装`npm install --save body-parser`来处理POST请求体

在这种情况下使用303（302），不能使用301永久。否则浏览器会缓存重定向目的地。当第二次提交表单时，浏览器会直接访问目的地，表单就得不到处理。

### 处理ajax表单
通过`req.xhr || req.accepts('json,html')==='json'`判断ajax请求

`res.send({success: true});`返回信息

### 文件上传
#### 使用Formidable，也可以使用ajax
`npm install --save formidable`

files就是上传文件数组，fields是参数数组
```javascript
var form = new formidable.IncomingForm();
form.parse(req, function(err, fields, files){});
```
#### 使用jquery-file-upload上传
依赖ImageMagick`apt-get install imagemagick`

[下载](https://github.com/blueimp/jQuery-File-Upload/releases)

[更多配置](https://github.com/blueimp/jQuery-File-Upload/wiki)

```javascript
jqupload.fileHandler({
    uploadDir: function(){
        return __dirname + '/public/uploads/' + now;
    },
    uploadUrl: function(){
        return '/uploads/' + now;
    },
})(req, res, next);
```

## ch9 cookies&sessions

`npm install --save cookie-parser`

`res.cookie('signed_monster', 'nom nom', { signed: true });`
options包括domain,path(包括子路径),maxAge(默认浏览器关闭就过期),secure(通过https发送),httpOnly(只允许server修改cookie，防止xss攻击)

实现session两种方式
* 都存放在cookie中
* cookie中只存唯一的标识，其他存在服务端

### 内存session
简单但是缺点是服务器重启则丢失，多个服务器session存放位置不确定。ch13

`npm install --save express-session`

接受options包括key(存放标识符的cookie名，默认是connect.sid),store(默认是MemoryStore),cookie

`req.session.userName`，通过delete删除，置为null并不会删除

### 使用session实现flash  message
通过在url中加入querystring也可以实现，但是丑陋而且会被加入书签保存。

## ch10 中间件

* app.VERB这样的路由处理器可以看成只处理一种http动词的中间件，反过来中间件也可以看成处理全部动词的处理器
* 路由处理器需要path作为第一个参数，/*匹配全部path
* 中间件可选path作为第一个参数，默认/*
* 2参数req,res 3参数req,res,next 4参数error,req,res,next
* 如果不调用next()，请求就会终止在这个中间件里，其他中间件和处理器不会得到调用。如果不通过res.send等方法返回客户端就会hang直到超时。

app.use接受function作为参数，js中function返回一个function是很常见的
`app.use(express.static(...));`

### 常用中间件
Connect中body-parser被移出了，需要单独安装
`npm install --save connect`
`var connect = require(connect);`

body-parser包含json和urlencoded

## ch11 email
### 接收邮件
[SimpleSMTP](http://bit.ly/simplesmtp) [Haraka](http://haraka.github.com)

### html邮件
阅读[html-email](http://bit.ly/writing_html_email)

简单[HTML Email Boilerplate](http://htmlemailboilerplate.com)

### Nodemailer
`npm install --save nodemailer`

默认使用smtp
`npm install nodemailer-smtp-transport`

Error: Greeting never received

## ch12 生产环境

### 日志
开发阶段使用Morgan，色彩化输出`npm install --save morgan`

生产环境使用express-logger，周期性记录日志`npm install --save express-logger`

修改`node_modules/express-logger/logger.js`中变量`defaultInterval`改变日志周期

`NODE_ENV=production node meadowlark.js`启动时改变生产环境

### 使用app cluster进行scaling out
每个cpu创建一个独立的server

如果script独立运行，`require.main === module`返回true，如果被其他脚本文件通过require加载，则返回false

书中验证当前响应请求worker的代码有错误，缺少next()导致浏览器hang

### 异常处理
简单的异常可以通过定义在所有路由之后的中间件处理：

```javascript
app.get('/fail', function(req, res){
    throw new Error('Nope!');
});
app.use(function(err, req, res, next){
    console.error(err.stack);
    app.status(500).render('500');

});
```

但是异步抛出的异常如setTimeout(nextTick就是第二个参数为0的定时器)，当Node在空闲的时候才会处理。
但是问题是此时该请求的上下文环境都没了，服务器只能关闭。

```javascript
app.get('/epic-fail', function(req, res){
    process.nextTick(function(){
        throw new Error('Kaboom!');
    });
});
```

使用cluster能解决这个问题，关闭一个worker会重启一个新的worker。

#### 如何优雅地关闭？uncaughtException和domains
推荐使用domains，位于所有路由和中间件之前

```javascript
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
// 其余中间件和路由
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Listening on port %d.', app.get('port'));
});
```

### 压力测试

`npm install --save loadtest`

p136

## ch13 持久化

### 文件系统持久化

```javascript
fs.mkdirSync(dir); //创建文件夹
fs.renameSync(photo.path, path); //就是移动，formidable会将临时路径放在path中
```
### 数据库持久化

NOSQL类型：文档，键值对

使用MongoDB

#### [Mongoose](http://mongoosejs.com/)
ODM 对象文档映射，类似ORM

`npm install --save mongoose`

之前rails时配置的mongodb，默认的journal有2-3G
`mongod --config /usr/local/MongoDB/mongod.conf --smallfiles`

#### 数据库连接
`mongoose.connect()`

#### 创建Model和Schema
view model将model提炼转换成更适合view展示的对象

find查询条件
```javascript
Vacation.find({ available: true }, function(err, vacations){
    
});
```

update()
`{ upsert: true }`当文档存在时，就更新，不然就创建。

`{ $push: {}}`表示添加进array

### 使用MongoDB存储session
放弃使用session-mongoose

`npm install --save session-mongoose`

使用[mongoose-session](https://github.com/TheRealCharDev/mongoose-session)

`npm install --save mongoose-session`

在数据库中：
update test.sessions query: { sid: "WNBIQ-sJoUbiJ0rt1UDfu_hUJwb6ZFso" }

使用Redis

## ch14



