var keystone = require('keystone'),
  Types = keystone.Field.Types;

/**
 * Organizations Model
 * ===================
 */

var Organization = new keystone.List('Organization', {
  autokey: { path: 'key', from: 'name', unique: true }
});

Organization.add({
  name: { type: String, index: true },
  logo: { type: Types.CloudinaryImage },
  website: Types.Url,
  isHiring: Boolean,
  description: { type: Types.Markdown },
  location: Types.Location
});


/**
 * Relationships
 * =============
 */

Organization.relationship({ ref: 'User', refPath: 'organisation', path: 'members' });


/**
 * Registration
 * ============
 */

Organization.addPattern('standard meta');
Organization.defaultColumns = 'name, website, isHiring';
Organization.register();