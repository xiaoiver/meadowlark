var main = require('./handlers/main.js');
var vacation = require('./handlers/vacation.js');

module.exports = function(app){
	// 主页和about页面
	app.get('/', main.home);
	app.get('/about', main.about);
	
	// 测试vacation
	app.get('/set-currency/:currency', vacation.setCurrency);
	app.get('/vacations', vacation.list);

	app.get('/notify-me-when-in-season', vacation.showNotify);
	app.post('/notify-me-when-in-season', vacation.updateNotify);

	// formidable上传图片
	app.get('/contest/vacation-photo', vacation.showUploadPhoto);
	app.post('/contest/vacation-photo/:year/:month', vacation.uploadPhoto);
};
