"use strict";

var request = require('request');
var IftttFetcher = {

	startIftttFetcher: function() {

	},

    fetchIfttt: function() {
        request('http://www.google.com', function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
            }
        });

    }

};

module.exports = IftttFetcher;
