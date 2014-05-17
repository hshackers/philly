// Load .env for development environments
require('dotenv').load();

var async = require('async'),
	_ = require('underscore');

var passport = require('passport'),
	passportTwitterStrategy = require('passport-twitter').Strategy;

var keystone = require('keystone'),
	User = keystone.list('User');

// Determine Environment
var production = process.env.NODE_ENV == 'production';

// Credentials
var credentials = {
	consumerKey: production ? 'QNDEjGkgiPZC7QXwtLhhIg' : '8camoyIpjMee3vtmfXHwSA',
	consumerSecret: production ? '9d2Ay7RScNrNPA1E78ytrNG1uvUiXZoigPHITJ2vUY' : 'Kfr3biGGErA7fA2vJJvDR55VzokFHWdUoG17er3IU',
	callbackURL: production ? 'http://philly.hshackers.org/authentication/twitter?callback' : 'http://127.0.0.1.xip.io:3000/authentication/twitter?callback'
};

// Authenticate User
exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.twitter] - Triggered authentication process...');
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		twitterUser: false, // Twitter user
		hsHackerUser: false // HS Hackers user
	}
	
	// Initalise Twitter credentials
	var twitterStrategy = new passportTwitterStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	
	});
	
	// Pass through authentication to passport
	passport.use(twitterStrategy);
	
	// Determine workflow
	var workflow = false;
	
	if ( _.has(req.query, 'callback' ) )
		workflow = 'save';
	
	// Function to process Twitter response and decide whether we should create or update a user
	var processTwitterUser = function(twitterUser) {
	
		data.twitterUser = twitterUser;
		
		// console.log(twitterUser);
		
		if (req.user) {
		
			console.log('[services.twitter] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.hsHackerUser = req.user;
			
			return saveSydjsUser();
		
		} else {
		
			console.log('[services.twitter] - No user signed in, attempting to match via id...');
			console.log('------------------------------------------------------------');
			
			User.model.findOne({ 'services.twitter.profileId': data.twitterUser.profile.id }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.twitter] - No matching user found via id, creating new user..." );
					console.log('------------------------------------------------------------');
					return createSydjsUser();
				}
				
				console.log("[services.twitter] - Matched user via id, updating user..." );
				console.log('------------------------------------------------------------');
				
				data.hsHackerUser = user;
				
				return saveSydjsUser();
				
			});
		
		}
	
	}
	
	// Function to create HS Hackers user
	var createSydjsUser = function() {
		
		console.log('[services.twitter] - Creating HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		// Define data
		var splitName = data.twitterUser.profile && data.twitterUser.profile.displayName ? data.twitterUser.profile.displayName.split(' ') : [],
			firstName = (splitName.length ? splitName[0] : ''),
			lastName = (splitName.length > 1 ? splitName[1] : '');
		
		// Structure data
		var userData = {
			name: {
				first: firstName,
				last: lastName
			},
			email: null, // Twitter API does not return email
			password: Math.random().toString(36).slice(-8),
			
			twitter: data.twitterUser.profile.username
		};
		
		console.log('[services.twitter] - HS Hackers user create data:', userData );
		
		// Create user
		data.hsHackerUser = new User.model(userData);
		
		console.log('[services.twitter] - Created new instance of HS Hackers user.');
		console.log('------------------------------------------------------------');
		
		return saveSydjsUser();
		
	}
	
	// Function to save HS Hackers user
	var saveSydjsUser = function() {
		
		// Save the HS Hackers user data
		console.log('[services.twitter] - Saving HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		var userData = {
			twitter: data.twitterUser.profile.username,
			
			services: {
				twitter: {
					isConfigured: true,
					
					profileId: data.twitterUser.profile.id,
					username: data.twitterUser.profile.username,
					accessToken: data.twitterUser.accessToken
				}
			}
		};
		
		console.log('[services.twitter] - HS Hackers user update data:', userData );
		
		data.hsHackerUser.set(userData);
		
		data.hsHackerUser.save(function(err) {
			
			if (err) {
				console.log(err);
				console.log("[services.twitter] - Error saving HS Hackers user.");
				console.log('------------------------------------------------------------');
				return callback(err);
				
			} else {
				
				console.log("[services.twitter] - Saved HS Hackers user.");
				console.log('------------------------------------------------------------');
				
				if ( req.user )
					return callback();
				else
					return signinSydjsUser();
				
			}
			
		});
		
	}
	
	// Function to sign in HS Hackers user
	var signinSydjsUser = function() {
	
		console.log('[services.twitter] - Signing in HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.twitter] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.twitter] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin( String(data.hsHackerUser._id), req, res, onSuccess, onFail);
	
	}
	
	// Perform workflow
	switch( workflow ) {
	
		// Save Twitter user data once returning from Twitter
		case 'save':
		
			console.log('[services.twitter] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('twitter', {
				//
			}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.twitter] - Error retrieving Twitter account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.twitter] - Successfully retrieved Twitter account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processTwitterUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with Twitter
		default:
		
			console.log('[services.twitter] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('twitter', {
				scope: [ 'email' ]
			})(req, res, next);
	
	}
	
};
