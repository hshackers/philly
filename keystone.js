// Load .env for development environments
require('dotenv').load();

// Initialise New Relic if an app name and license key exists
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
	require('newrelic');
}

/**
 * Application Initialisation
 */

var keystone = require('keystone'),
	pkg = require('./package.json');

keystone.init({

	'name': 'HS Hackers Philly',
	'brand': 'HS Hackers',
	'back': '/me',

	'favicon': 'public/favicon.ico',
	'less': 'public',
	'static': 'public',

	'views': 'templates/views',
	'view engine': 'jade',
	'view cache': false,
	
	'emails': 'templates/emails',

	'auto update': true,
	'mongo': process.env.MONGO_URI || 'mongodb://localhost/' + pkg.name,

	'session': true,
	'session store': 'mongo',
	'auth': true,
	'user model': 'User',
	'cookie secret': process.env.COOKIE_SECRET || 'hshackers',
	
	// the default mandrill api key is a *test* key. it will 'work', but not send emails.
	'mandrill api key': process.env.MANDRILL_KEY || 'v17RkIoARDkqTqPSbvrmkw',

	'google api key': process.env.GOOGLE_BROWSER_KEY,
	'google server api key': process.env.GOOGLE_SERVER_KEY,

	'ga property': process.env.GA_PROPERTY,
	'ga domain': process.env.GA_DOMAIN,
	
	'chartbeat property': process.env.CHARTBEAT_PROPERTY,
	'chartbeat domain': process.env.CHARTBEAT_DOMAIN,

	'basedir': __dirname
	
});

keystone.import('models');

keystone.set('routes', require('./routes'));

keystone.set('locals', {
	_: require('underscore'),
	moment: require('moment'),
	js: 'javascript:;',
	env: keystone.get('env'),
	utils: keystone.utils,
	plural: keystone.utils.plural,
	editable: keystone.content.editable,
	google_api_key: keystone.get('google api key'),
	ga_property: keystone.get('ga property'),
	ga_domain: keystone.get('ga domain'),
	chartbeat_property: keystone.get('chartbeat property'),
	chartbeat_domain: keystone.get('chartbeat domain')
});

keystone.set('email locals', {
	utils: keystone.utils,
	host: (function() {
		if (keystone.get('env') === 'staging') return 'http://hshackers-beta.herokuapp.com';
		if (keystone.get('env') === 'production') return 'http://hshackers.org';
		return (keystone.get('host') || 'http://localhost:') + (keystone.get('port') || '3000');
	})()
});

keystone.set('nav', {
	'meetups': ['meetups', 'talks', 'rsvps'],
	'members': ['users', 'organizations'],
	'posts': ['posts', 'post-categories', 'post-comments'],
	'links': ['links', 'link-tags', 'link-comments']
});

keystone.start();
