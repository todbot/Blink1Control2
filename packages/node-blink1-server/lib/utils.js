'use strict';

module.exports = {
    generateRandomHexColor: function() {
        return '#' + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase();
    },
    generateRandomHostId: function() {
        return ('000' + Math.floor(Math.random() * 0xffff).toString(16)).slice(-4).toUpperCase() +
               ('000' + Math.floor(Math.random() * 0xffff).toString(16)).slice(-4).toUpperCase();
    },
};
