// Load .env for development environments
require('dotenv').load();

/**
 * Application Initialisation
 */

var keystone = require('keystone'),
	pkg = require('./package.json');

keystone.init({

	'name': 'HS Hackers',
	'brand': 'HS Hackers',
	'back': '/me',

	'favicon': 'public/favicon.ico',
	'less': 'public',
	'static': 'public',

	'views': 'templates/views',
	'view engine': 'jade',
	
	'emails': 'templates/emails',

	'auto update': true,
	'mongo': process.env.MONGO_URI || 'mongodb://localhost/' + pkg.name,

	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': process.env.COOKIE_SECRET || 'yOB~u{rQK`d17JFGn!@&pB9N%b_{rZa7+oVD+xVr&-u^SY^>u9Jy/-3eM+C37[4J',
	
	// the default mandrill api key is a *test* key. it will 'work', but not send emails.
	'mandrill api key': process.env.MANDRILL_KEY || 'v17RkIoARDkqTqPSbvrmkw',

	'google api key': process.env.GOOGLE_BROWSER_KEY,
	'google server api key': process.env.GOOGLE_SERVER_KEY,

	'ga property': process.env.GA_PROPERTY,
	'ga domain': process.env.GA_DOMAIN,
	
	'chartbeat property': process.env.CHARTBEAT_PROPERTY,
	'chartbeat domain': process.env.CHARTBEAT_DOMAIN
	
});

require('./models');

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
	keystoneURL: 'http://hshackers.org/keystone',
	logo: '/images/logo_email.jpg',
	logo_width: 120,
	logo_height: 112,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de'
	}
});

keystone.set('email tests', {
	'forgotten-password': {
		name: 'User',
		link: 'http://hshackers.org/reset-password/key'
	}
});

keystone.set('nav', {
	'meetups': ['meetups', 'talks'],
	'members': ['users', 'organizations'],
	'posts': ['posts', 'post-categories', 'post-comments'],
	'links': ['links', 'link-tags', 'link-comments']
});

keystone.start();
