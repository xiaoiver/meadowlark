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

## 页面跳转测试
headless browser PhantomJs,Zombie
zombie暂时还不支持windows平台
mocha默认时间太短导致测试出错，通过`--timeout 15000`[增加时间][mocha-timeout]

## 逻辑测试
`npm install -g mocha`全局安装
`mocha -u tdd -R spec qa/tests-unit.js`单元测试

## 检验框架
`npm install -g jshint`

`jshint meadowlark.js`

`if( app.thing == null ) console.log( 'bleat!' );`会提示使用===代替==

## 链接检测
检测死链接，循环链接[linkchecker][linkchecker-download]

`python setup.py build`需要安装request

* 首先安装pip`sudo apt-get install python-pip`
* 通过pip安装`pip install requests`

`python setup.py install`时报错“python.h 没有那个文件或目录”
原因是没有安装Python的头文件和静态库包`sudo apt-get install python-dev`

`linkchecker http://localhost:3000`检查

## Grunt自动运行测试任务
安装grunt`sudo npm install -g grunt-cli`
`npm install --save-dev grunt`

Grunt依赖插件完成工作如mocha,jshint和linkchecker。由于linkchecker没有对应插件
使用通用插件exec执行命令行。
`npm install --save-dev grunt-cafe-mocha`
`npm install --save-dev grunt-contrib-jshint`
`npm install --save-dev grunt-exec`


[mocha-timeout]: [http://stackoverflow.com/questions/16607039/in-mocha-testing-while-calling-asynchronous-function-how-to-avoid-the-timeout-er]
[linkchecker-download]: [http://wummel.github.io/linkchecker]