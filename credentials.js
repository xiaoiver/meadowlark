module.exports = {
	cookieSecret: 'your cookie secret goes here',
	sinaSmtp: {
		user: 'pyqiverson@sina.com',
		password: '1991411'
	},
	mongo: {
		development: {
			connectionString: 'mongodb://localhost:27017',
		},
		production: {
			connectionString: 'mongodb://localhost:27017',
		}
	}
};