var User = require('../models/user.js'),
	passport = require('passport'),
	GithubStrategy = require('passport-github').Strategy;

// passport.use时调用，将_id存储在session中
passport.serializeUser(function(user, done){
	done(null, user._id);
});


passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		if(err || !user) return done(err, null);
		done(null, user);
	});
});


module.exports = function(app, options){
	if(!options.successRedirect)
		options.successRedirect = '/account';
	if(!options.failureRedirect)
		options.failureRedirect = '/login';
	return {
		init: function(){
			var env = app.get('env');
			var config = options.providers;

			passport.use(new GithubStrategy({
				clientID: config.github[env].appId,
				clientSecret: config.github[env].appSecret,
				callbackURL: '/auth/github/callback'
			}, function(accessToken, refreshToken, profile, done){
				var authId = 'github:' + profile.id;
				User.findOne({authId: authId}, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
						authId: authId,
						name: profile.displayName,
						created: Date.now(),
						role: 'customer'
					});
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));

			app.use(passport.initialize());
			app.use(passport.session());
		},
		registerRoutes: function(){
			app.get('/auth/github', function(req, res, next){
				passport.authenticate('github', {
					callbackURL: req.query.redirect ? '/auth/github/callback?redirect=' +
						encodeURIComponent(req.query.redirect) : '/auth/github/callback'
				})(req, res, next);
			});

			app.get('/auth/github/callback', function(req, res, next){
				passport.authenticate('github', {
					successRedirect: req.query.redirect || options.successRedirect,
					failureRedirect: options.failureRedirect
				})(req, res, next);
			});
		}
	};
};