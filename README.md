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



