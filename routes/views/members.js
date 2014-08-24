var keystone = require('keystone'),
	_ = require('underscore');

var User = keystone.list('User');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'members';
	locals.page.title = 'Members - HS Hackers';


	// Load Organisers
	view.on('init', function(next) {
		User.model.find()
		.sort('name.first')
		.where('isPublic', true)
		.where('isOrganiser', true)
		.exec(function(err, organizers) {
			if (err) res.err(err);
			locals.organizers = organizers;
			next();
		});
	});


	// Load Speakers

	view.on('init', function(next) {
		User.model.find()
		.sort('-talkCount name.first')
		.where('isPublic', true)
		.where('talkCount').gt(0)
		.exec(function(err, speakers) {
			if (err) res.err(err);
			locals.speakers = speakers;
			next();
		});
	});


	// Pluck IDs for filtering Community

	view.on('init', function(next) {
		locals.organizerIDs = _.pluck(locals.organizers, 'id');
		locals.speakerIDs = _.pluck(locals.speakers, 'id');
		next();
	});


	// Load Community

	view.on('init', function(next) {
		User.model.find()
		.sort('-lastRSVP')
		.where('isPublic', true)
		.where('_id').nin(locals.organizerIDs)
		.where('_id').nin(locals.speakerIDs)
		.exec(function(err, community) {
			if (err) res.err(err);
			locals.community = community;
			next();
		});
	});


	view.render('site/members');
}
