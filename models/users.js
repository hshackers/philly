var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Users Model
 * ===========
 */

var User = new keystone.List('User', {
	autokey: { path: 'key', from: 'name', unique: true }
});

var deps = {
	mentoring: { 'mentoring.available': true },
	
	github: { 'services.github.isConfigured': true },
	facebook: { 'services.facebook.isConfigured': true },
	twitter: { 'services.twitter.isConfigured': true }
}

User.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Email, initial: true, index: true },
	password: { type: Types.Password, initial: true },
	resetPasswordKey: { type: String, hidden: true }
}, 'Profile', {
	isPublic: Boolean,
	organization: { type: Types.Relationship, ref: 'Organization' },
	photo: { type: Types.CloudinaryImage },
	github: { type: String, width: 'short' },
	twitter: { type: String, width: 'short' },
	website: { type: Types.Url },
	bio: { type: Types.Markdown }
}, 
'Chipotle', {
	type: { type: Types.Select, options: 'burrito, burrito bowl, salad bowl, crispy tacos, soft tacos, taco kit, quesadilla', default: 'burrito bowl', index: true },
	meat: { type: Types.Select, options: 'no meat, chicken, steak, carnitas, barbacoa, veggie', default: 'chicken', index: true },
	beans: { type: Types.Select, options: 'no beans, black beans, pinto beans', default: 'black beans', index: true },
	rice: { type: Types.Select, options: 'no rice, white rice, brown rice', default: 'white rice', index: true },
	salsa: { type: Types.Select, options: 'no salsa, mild tomatoes, medium verde, hot sauce', default: 'mild tomatoes', index: true },
	cheese: Boolean,
	corn: Boolean,
	lettuce: Boolean,
	sourcream: Boolean,
	guacamole: Boolean,
	chips: Boolean,
	notes: { type: Types.Markdown }
}, 'Notifications', {
	notifications: {
		posts: Boolean,
		meetups: Boolean
	}
}, 'Mentoring', {
	mentoring: {
		available: { type: Boolean, label: 'Is Available', index: true },
		free: { type: Boolean, label: 'For Free', dependsOn: deps.mentoring },
		paid: { type: Boolean, label: 'For Payment', dependsOn: deps.mentoring },
		swap: { type: Boolean, label: 'For Swap', dependsOn: deps.mentoring },
		have: { type: String, label: 'Has...', dependsOn: deps.mentoring },
		want: { type: String, label: 'Wants...', dependsOn: deps.mentoring }
	}
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can Admin HS Hackers' }
}, 'Services', {
	services: {
		github: {
			isConfigured: { type: Boolean, label: 'GitHub has been authenticated' },
			
			profileId: { type: String, label: 'Profile ID', dependsOn: deps.github },
			profileUrl: { type: String, label: 'Profile URL', dependsOn: deps.github },
			
			username: { type: String, label: 'Username', dependsOn: deps.github },
			accessToken: { type: String, label: 'Access Token', dependsOn: deps.github }
		},
		facebook: {
			isConfigured: { type: Boolean, label: 'Facebook has been authenticated' },
			
			profileId: { type: String, label: 'Profile ID', dependsOn: deps.facebook },
			profileUrl: { type: String, label: 'Profile URL', dependsOn: deps.facebook },
			
			username: { type: String, label: 'Username', dependsOn: deps.facebook },
			accessToken: { type: String, label: 'Access Token', dependsOn: deps.facebook }
		},
		twitter: {
			isConfigured: { type: Boolean, label: 'Twitter has been authenticated' },
			
			profileId: { type: String, label: 'Profile ID', dependsOn: deps.twitter },
			
			username: { type: String, label: 'Username', dependsOn: deps.twitter },
			accessToken: { type: String, label: 'Access Token', dependsOn: deps.twitter }
		}
	}
});


/** 
	Relationships
	=============
*/

User.relationship({ ref: 'Post', refPath: 'author', path: 'posts' });
User.relationship({ ref: 'Talk', refPath: 'who', path: 'talks' });
User.relationship({ ref: 'RSVP', refPath: 'who', path: 'rsvps' });


/**
 * Virtuals
 * ========
 */

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
	return this.isAdmin;
});


/**
 * Methods
 * =======
*/

User.schema.methods.resetPassword = function(callback) {
	
	var user = this;
	
	this.resetPasswordKey = keystone.utils.randomString([16,24]);
	
	this.save(function(err) {
		
		if (err) return callback(err);
		
		new keystone.Email('forgotten-password').send({
			name: user.name.first || user.name.full,
			link: 'http://philly.hshackers.org/reset-password/' + user.resetPasswordKey,
			subject: 'Reset your HS Hackers Password'
		}, {
			to: user,
			from: {
				name: 'HS Hackers',
				email: 'contact@HS Hackers.com'
			}
		}, callback);
		
	});
	
}


/**
 * Registration
 * ============
*/

User.addPattern('standard meta');
User.defaultColumns = 'name, email, twitter, isAdmin';
User.register();
