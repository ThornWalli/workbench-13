"use strict";

var AmpersandCollection = require('ampersand-collection');
var AmpersandModel = require('ampersand-model');

var ItemSubCollection = AmpersandCollection.extend({
    model: AmpersandModel.extend(require('agency-pkg-base/dataTypeDefinition'),require('./itemTypeDefinition'), require('./itemAttributes'))
});
module.exports = ItemSubCollection;