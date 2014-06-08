// Load .env for development environments
require('dotenv').load();

var async = require('async'),
	_ = require('underscore');

var passport = require('passport'),
	passportGithubStrategy = require('passport-github').Strategy;

var keystone = require('keystone'),
	User = keystone.list('User');

// Determine Environment
var production = process.env.NODE_ENV == 'production';

// Credentials
var credentials = {
	// clientID: production ? '0d8268dbf3f4468d5a53' : '3a95bf0cc40f5943ea89',
	// clientSecret: production ? '6b78ed664e49a5f5a941b17801bcef49f908d590' : '2b166889264d0d53c44566a934763ec8d57ad95f',
	// callbackURL: production ? 'http://hshackers.org/authentication/github?callback' : 'http://localhost:3000/authentication/github?callback'
	clientID: production ? '8c000f8c600ab075767a' : 'b23df41c037a37ae36a4',
	clientSecret: production ? '709e73acffc016222c0bf37805109e20fbbae7fc' : 'f18559cb884d01b676c2528faa090938eaf1d17a',
	callbackURL: production ? 'http://hshackers.herokuapp.com/authentication/github?callback' : 'http://127.0.0.1.xip.io:3000/authentication/github?callback'

};

// Authenticate User
exports.authenticateUser = function(req, res, next, callback)
{
	// Begin process
	console.log('============================================================');
	console.log('[services.github] - Triggered authentication process...');
	console.log('------------------------------------------------------------');
	
	// Set placeholder variables to hold our data
	var data = {
		githubUser: false, // Github user
		hsHackerUser: false // HS Hackers user
	}
	
	// Initalise GitHub credentials
	var githubStrategy = new passportGithubStrategy(credentials, function(accessToken, refreshToken, profile, done) {
		
		done(null, {
			accessToken: accessToken,
			profile: profile
		});
	
	});
	
	// Pass through authentication to passport
	passport.use(githubStrategy);
	
	// Determine workflow
	var workflow = false;
	
	if ( _.has(req.query, 'callback' ) )
		workflow = 'save';
	
	// Function to process Github response and decide whether we should create or update a user
	var processGithubUser = function(githubUser) {
	
		data.githubUser = githubUser;
		
		// console.log(githubUser);
		
		if (req.user) {
		
			console.log('[services.github] - Existing user signed in, saving data...');
			console.log('------------------------------------------------------------');
			
			data.hsHackerUser = req.user;
			
			return saveSydJSUser();
		
		} else {
		
			console.log('[services.github] - No user signed in, attempting to match via id...');
			console.log('------------------------------------------------------------');
			
			User.model.findOne({ 'services.github.profileId': data.githubUser.profile.id }, function(err, user) {
				
				if (err || !user) {
					console.log("[services.github] - No matching user found via id, creating new user...");
					console.log('------------------------------------------------------------');
					return createSydJSUser();
				}
				
				console.log("[services.github] - Matched user via id, updating user...");
				console.log('------------------------------------------------------------');
				
				data.hsHackerUser = user;
				
				return saveSydJSUser();
				
			});
		
		}
	
	}
	
	// Function to create HS Hackers user
	var createSydJSUser = function() {
		
		console.log('[services.github] - Creating HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		// Define data
		var splitName = data.githubUser.profile && data.githubUser.profile.displayName ? data.githubUser.profile.displayName.split(' ') : [],
			firstName = (splitName.length ? splitName[0] : ''),
			lastName = (splitName.length > 1 ? splitName[1] : '');
		
		// Structure data
		var userData = {
			name: {
				first: firstName,
				last: lastName
			},
			email: null, // GitHub API should return emails but isn't
			password: Math.random().toString(36).slice(-8),
			
			github: data.githubUser.profile.username,
			website: data.githubUser.profile._json.blog
		};
		
		console.log('[services.github] - HS Hackers user create data:', userData );
		
		// Create user
		data.hsHackerUser = new User.model(userData);
		
		console.log('[services.github] - Created new instance of HS Hackers user.');
		console.log('------------------------------------------------------------');
		
		return saveSydJSUser();
		
	}
	
	// Function to save HS Hackers user
	var saveSydJSUser = function() {
		
		// Save the HS Hackers user data
		console.log('[services.github] - Saving HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		var userData = {
			github: data.githubUser.profile.username,
			website: data.githubUser.profile._json.blog,
			
			services: {
				github: {
					isConfigured: true,
					
					profileId: data.githubUser.profile.id,
					profileUrl: data.githubUser.profile.profileUrl,
					username: data.githubUser.profile.username,
					accessToken: data.githubUser.accessToken
				}
			}
		};
		
		console.log('[services.github] - HS Hackers user update data:', userData );
		
		data.hsHackerUser.set(userData);
		
		data.hsHackerUser.save(function(err) {
			
			if (err) {
				console.log(err);
				console.log("[services.github] - Error saving HS Hackers user.");
				console.log('------------------------------------------------------------');
				return callback(err);
				
			} else {
				
				console.log("[services.github] - Saved HS Hackers user.");
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
	
		console.log('[services.github] - Signing in HS Hackers user...');
		console.log('------------------------------------------------------------');
		
		var onSuccess = function(user) {
		
			console.log("[services.github] - Successfully signed in.");
			console.log('------------------------------------------------------------');
			
			return callback();
		
		}
		
		var onFail = function(err) {
			
			console.log("[services.github] - Failed signing in.");
			console.log('------------------------------------------------------------');
			
			return callback(true);
			
		}
		
		keystone.session.signin( String(data.hsHackerUser._id), req, res, onSuccess, onFail);
	
	}
	
	// Perform workflow
	switch( workflow ) {
	
		// Save GitHub user data once returning from GitHub
		case 'save':
		
			console.log('[services.github] - Callback workflow detected, attempting to process data...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('github', {
				//
			}, function(err, data, info) {
			
				if (err || !data) {
					console.log("[services.github] - Error retrieving GitHub account data - " + JSON.stringify(err) );
					return callback(true);
				}
				
				console.log('[services.github] - Successfully retrieved GitHub account data, processing...');
				console.log('------------------------------------------------------------');
				
				return processGithubUser(data);
				
			})(req, res, next);
		
		break;
		
		// Authenticate with GitHub
		default:
		
			console.log('[services.github] - Authentication workflow detected, attempting to request access...');
			console.log('------------------------------------------------------------');
			
			passport.authenticate('github', {
				scope: [ 'user:email' ]
			})(req, res, next);
	
	}
	
};
