// utils.js — Miscellaneous helper functions.
// generateRandomHexColor: returns a random CSS hex color string (e.g. '#A3F700').
// generateRandomHostId: returns a random 8-char uppercase hex string used as the
//   host portion of the IFTTT key.

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
