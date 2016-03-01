
'use strict';


var Utils = {

	cheapUid: function(len) {
		return Math.random().toString(36).substr(2, len);
	},
	generateId: function(name,len) {
		return name.toLowerCase().replace(/\W+/g, '') +'-'+ this._cheapUid(len);
	},

};

module.exports = Utils;
