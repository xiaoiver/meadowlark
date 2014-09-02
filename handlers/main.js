// 模拟数据
var fortune = require('../lib/fortune.js');

// cookies,apitokens等需要保密
var credentials = require('../credentials.js');

// nodemailer
var nodemailer = require('nodemailer');
var mailTransport = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: credentials.gmailSmtp.user,
		pass: credentials.gmailSmtp.password,
	}
});

exports.home = function(req, res){
	res.render('home');
	res.cookie('monster', 'nom nom');
	res.cookie('signed_monster', 'nom nom', { signed: true });
};

exports.about = function(req, res){
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
};