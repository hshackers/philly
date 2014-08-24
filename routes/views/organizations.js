var keystone = require('keystone');

var Organization = keystone.list('Organization');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// locals.section = 'members';
	
	view.query('organizations', Organization.model.find().sort('name'), 'members');
	
	view.render('site/organizations');
	
}
