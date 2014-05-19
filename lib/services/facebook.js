// Load .env for development environments
require('dotenv').load();

var async = require('async'),
	_ = require('underscore');

var passport = require('passport'),
	passportFacebookStrategy = require('passport-facebook').Strategy;

var keystone = require('keystone'),
	User = keystone.list('User');

// Determine Environment
var production = process.env.NODE_ENV == 'production';

// Credentials
var credentials = {
	clientID: production ? '233432860156927' : '370618766416716',
	clientSecret: production ? '2e10b9ddde40318df7b0a46f93535cbb' : 'c8e2359c4308dc9e757f33c8e83fc6b0',
	callbackURL: production ? 'http://philly.hshackers.org/authentication/facebook?callback' : 'http://127.0.0.1.xip.io:3000/authentication/facebook?callback'
};

// Authenticate User
exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.facebook] - Triggered authentication process...' );
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		facebookUser: false, // FB user
		hsHackerUser: false // HS Hackers user
	}
	
	// Initalise Facebook credentials
	var facebookStrategy = new passportFacebookStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	
	});
	
	// Pass through authentication to passport
	passport.use(facebookStrategy);
	
	// Determine workflow
	var workflow = false;
	
	if ( _.has(req.query, 'callback' ) )
		workflow = 'save';
	
	// Function to process FB response and decide whether we should create or update a user
	var processFBUser = function(facebookUser) {
	
		data.facebookUser = facebookUser;
		
		// console.log(facebookUser);
		
		if (req.user) {
		
			console.log('[services.facebook] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.hsHackerUser = req.user;
			
			return saveSydJSUser();
		
		} else {
		
			console.log('[services.facebook] - No user signed in, attempting to match via email...');
			console.log('------------------------------------------------------------');
			
			var email = data.facebookUser.profile.emails;
			
			if ( !email.length ) {
				console.log("[services.facebook] - No email address detected, creating new user...");
				console.log('------------------------------------------------------------');
				return createSydJSUser();
			}
			
			User.model.findOne({ email: _.first(data.facebookUser.profile.emails).value }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.facebook] - No matching user found via email, creating new user...");
					console.log('------------------------------------------------------------');
					return createSydJSUser();
				}
				
				console.log("[services.facebook] - Matched user via email, updating user..." );
				console.log('------------------------------------------------------------');
				
				data.hsHackerUser = user;
				
				return saveSydJSUser();
				
			});
		
		}
	
	}
	
	// Function to create HS Hackers user
	var createSydJSUser = function() {
		
		console.log('[services.facebook] - Creating HS Hackers user...' );
		console.log('------------------------------------------------------------');
		
		// Define data
		var email = data.facebookUser.profile.emails;
		
		// Structure data
		var userData = {
			name: {
				first: data.facebookUser.profile.name.givenName,
				last: data.facebookUser.profile.name.familyName
			},
			email: email.length ? _.first(data.facebookUser.profile.emails).value : null,
			password: Math.random().toString(36).slice(-8)
		};
		
		console.log('[services.facebook] - HS Hackers user create data:', userData );
		
		// Create user
		data.hsHackerUser = new User.model(userData);
		
		console.log('[services.facebook] - Created new instance of HS Hackers user.' );
		console.log('------------------------------------------------------------');
		
		return saveSydJSUser();
		
	}
	
	// Function to save HS Hackers user
	var saveSydJSUser = function() {
		
		// Save the HS Hackers user data
		console.log('[services.facebook] - Saving HS Hackers user...' );
		console.log('------------------------------------------------------------');
		
		var userData = {
			services: {
				facebook: {
					isConfigured: true,
					
					profileId: data.facebookUser.profile.id,
					profileUrl: data.facebookUser.profile.profileUrl,
					username: data.facebookUser.profile.username,
					accessToken: data.facebookUser.accessToken
				}
			}
		};
		
		console.log('[services.facebook] - HS Hackers user update data:', userData );
		
		data.hsHackerUser.set(userData);
		
		data.hsHackerUser.save(function(err) {
			
			if (err) {
				console.log(err);
				console.log("[services.facebook] - Error saving HS Hackers user.");
				console.log('------------------------------------------------------------');
				return callback(err);
				
			} else {
				
				console.log("[services.facebook] - Saved HS Hackers user.");
				console.log('------------------------------------------------------------');
				
				if ( req.user )
					return callback();
				else
					return signinSydJSUser();
				
			}
			
		});
		
	}
	
	// Function to sign in HS Hackers user
	var signinSydJSUser = function() {
	
		console.log('[services.facebook] - Signing in HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.facebook] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.facebook] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin( String(data.hsHackerUser._id), req, res, onSuccess, onFail);
	
	}
	
	// Perform workflow
	switch( workflow ) {
	
		// Save Facebook user data once returning from Facebook
		case 'save':
		
			console.log('[services.facebook] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('facebook', {
				//
			}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.facebook] - Error retrieving Facebook account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.facebook] - Successfully retrieved Facebook account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processFBUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with Facebook
		default:
		
			console.log('[services.facebook] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('facebook', {
				scope: [ 'email' ]
			})(req, res, next);
	
	}
	
};
