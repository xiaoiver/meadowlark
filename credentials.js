module.exports = {
	cookieSecret: 'your cookie secret goes here',
	sessionSecret: 'your session secret goes here',
	gmailSmtp: {
		user: 'pyqiverson@gmail.com',
		password: 'pyq1991411'
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