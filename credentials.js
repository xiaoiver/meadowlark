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
	},
	authProviders: {
		github: {
			development: {
				appId: 'c8df987049e3b732624e',
				appSecret: '6846c877c8aa69b5fb79fa4143a2abf2f8327763'
			}
		}
	}
};