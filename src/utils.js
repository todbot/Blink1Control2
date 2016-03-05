
'use strict';


var Utils = {
	cheesyClone: function(o) {
		return JSON.parse(JSON.stringify(o));
	},
	cheapUid: function(len) {
		return Math.random().toString(36).substr(2, len);
	},
	generateId: function(name,len) {
		return name.toLowerCase().replace(/\W+/g, '') +'-'+ this.cheapUid(len);
	},

	generateRandomHexColor: function() {
		return '#'+Math.floor(Math.random()*0xffffff).toString(16).toUpperCase();
	},

	generateRandomHostId: function() {
		return Math.floor(Math.random()*0xffff).toString(16).toUpperCase() +
		       Math.floor(Math.random()*0xffff).toString(16).toUpperCase();
	}
};

module.exports = Utils;
