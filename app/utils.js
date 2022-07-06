
'use strict';

const crypto = require('crypto');
const encAlgorithm = 'aes-256-ctr';
const encKey = Buffer.from('16808abd2ec954b81e32dc46529ab5eed71a8b6d1ec', 'base64')
const encIVlen = 16;

var Utils = {
	cheesyClone: function(o) {
		return JSON.parse(JSON.stringify(o));
	},
	// cheapUid: function(len) {
	// 	return Math.random().toString(36).substr(2, len);
	// },
	generateId: function(name,len) {
		return name.toLowerCase().replace(/\W+/g, '') +'-'+ this.cheapUid(len);
	},

	generateRandomHexColor: function() {
		return '#'+Math.floor(Math.random()*0xffffff).toString(16).toUpperCase();
	},

	// Generate an 8-hexdigit random number for use as hostId
	generateRandomHostId: function() {
		return ("000"+Math.floor(Math.random()*0xffff).toString(16)).slice(-4).toUpperCase() +
			   ("000"+Math.floor(Math.random()*0xffff).toString(16)).slice(-4).toUpperCase();
	},

	encrypt: function(text) {
		let iv = crypto.randomBytes(encIVlen);
		let cipher = crypto.createCipheriv(encAlgorithm, Buffer.from(encKey, 'hex'), iv);
		let encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return iv.toString('hex') + ':' + encrypted.toString('hex');
	},

	decrypt: function(text) {
		let textParts = text.split(':');
		let iv = Buffer.from(textParts.shift(), 'hex');
		let encryptedText = Buffer.from(textParts.join(':'), 'hex');
		let decipher = crypto.createDecipheriv(encAlgorithm, Buffer.from(encKey, 'hex'), iv);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		return decrypted.toString();
	},

};

module.exports = Utils;
