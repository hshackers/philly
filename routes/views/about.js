var keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	locals.section = 'about';
	locals.page.title = 'About HS Hackers';
	
	locals.organizers = [
		{ name: 'Victor Lourng', image: '/images/organizer-victor.png', twitter: 'lablayers', title: 'Founder & Lead Organizer' },
	]
	
	view.render('site/about');
	
}
