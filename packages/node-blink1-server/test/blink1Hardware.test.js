'use strict';

// Hardware-in-the-loop tests for node-blink1-server.
// All tests are skipped automatically when no blink(1) device is connected.
//
// Run:  node --test test/blink1Hardware.test.js
//
// These tests actually light up the device, so run them in an environment
// where that's acceptable.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Blink1 = require('node-blink1');
const Blink1Service = require('../lib/blink1Service');
const PatternsService = require('../lib/patternsService');
const createBlink1Server = require('../index');

const connectedSerials = Blink1.devices();
const hasDevice = connectedSerials.length > 0;
const skipMsg = 'no blink(1) device connected';

const noopEmitter = { emit: function() {} };

// ─── blink1Service — hardware ─────────────────────────────────────────────────

describe('blink1Service — hardware', { skip: hasDevice ? false : skipMsg }, function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
        // Allow 600ms for _setupFoundDevices() timer to open the device.
        return new Promise(function(r) { setTimeout(r, 600); });
    });

    after(function() {
        Blink1Service.off();
    });

    it('isConnected() > 0 after start()', function() {
        assert.ok(Blink1Service.isConnected() > 0,
            'expected at least one connected device, got ' + Blink1Service.isConnected());
    });

    it('getAllSerials() matches Blink1.devices()', function() {
        const serials = Blink1Service.getAllSerials();
        assert.ok(serials.length > 0);
        // Every serial reported by the service should be one node-blink1 found
        const rawSerials = connectedSerials.map(function(s) { return s.toUpperCase(); });
        serials.forEach(function(s) {
            assert.ok(rawSerials.includes(s), 'serial ' + s + ' not in Blink1.devices() list');
        });
    });

    it('fadeToColor() does not throw', function() {
        assert.doesNotThrow(function() {
            Blink1Service.fadeToColor(100, '#ff0000', 0);
        });
    });

    it('fadeToColor() updates getCurrentColor()', function() {
        Blink1Service.fadeToColor(100, '#00ff00', 0);
        assert.equal(Blink1Service.getCurrentColor().toHexString(), '#00ff00');
    });

    it('off() does not throw', function() {
        assert.doesNotThrow(function() { Blink1Service.off(); });
    });

    it('writePatternToBlink1() does not throw', function() {
        const pattern = {
            colors: [
                { rgb: '#ff0000', time: 0.1, ledn: 0 },
                { rgb: '#000000', time: 0.1, ledn: 0 },
            ],
        };
        assert.doesNotThrow(function() {
            Blink1Service.writePatternToBlink1(pattern, false, 0);
        });
    });
});

// ─── patternsService — hardware ───────────────────────────────────────────────

describe('patternsService — hardware', { skip: hasDevice ? false : skipMsg }, function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
        return new Promise(function(r) { setTimeout(r, 600); });
    });

    after(function() {
        PatternsService.stopAllPatterns();
        Blink1Service.off();
    });

    it('playPatternFrom() with a system pattern does not throw', function() {
        assert.doesNotThrow(function() {
            PatternsService.playPatternFrom('test', 'red flash');
        });
    });

    it('playPatternFrom() with #hexcolor does not throw', function() {
        PatternsService.stopAllPatterns();
        assert.doesNotThrow(function() {
            PatternsService.playPatternFrom('test', '#0000ff');
        });
    });

    it('~blink meta-pattern does not throw', function() {
        PatternsService.stopAllPatterns();
        assert.doesNotThrow(function() {
            PatternsService.playPatternFrom('test', '~blink:#ff00ff-2-0.1');
        });
    });

    it('stopAllPatterns() leaves device dark', function(_, done) {
        PatternsService.playPatternFrom('test', '#ffffff');
        // Let it play briefly, then stop and verify color tracking
        setTimeout(function() {
            PatternsService.stopAllPatterns();
            Blink1Service.off();
            // getCurrentColor() should reflect the off command
            const color = Blink1Service.getCurrentColor();
            assert.equal(color.toHexString(), '#000000');
            done();
        }, 200);
    });
});

// ─── apiServer — hardware ─────────────────────────────────────────────────────

describe('apiServer — hardware', { skip: hasDevice ? false : skipMsg }, function() {
    const PORT = 19935; // separate port from the standard integration test
    const BASE = 'http://localhost:' + PORT;
    let server;

    async function get(path) {
        const res = await fetch(BASE + path);
        return { status: res.status, body: await res.json() };
    }

    before(async function() {
        server = createBlink1Server({ apiConfig: { port: PORT, host: 'localhost' } });
        server.start();
        await new Promise(function(r) { setTimeout(r, 650); });
    });

    after(function() {
        return new Promise(function(resolve) { server.stop(resolve); });
    });

    it('/blink1/id reports connected serials', async function() {
        const { body } = await get('/blink1/id');
        assert.ok(body.blink1_serialnums.length > 0, 'expected at least one serial in response');
    });

    it('/blink1/red sets device to red without error', async function() {
        const { status, body } = await get('/blink1/red');
        assert.equal(status, 200);
        assert.equal(body.rgb, '#ff0000');
    });

    it('/blink1/off sets device dark without error', async function() {
        const { status, body } = await get('/blink1/off');
        assert.equal(status, 200);
        assert.equal(body.rgb, '#000000');
    });

    it('/blink1/fadeToRGB reaches device without error', async function() {
        const { status, body } = await get('/blink1/fadeToRGB?rgb=%230000ff&time=0.1');
        assert.equal(status, 200);
        assert.equal(body.lastColor, '#0000ff');
        assert.equal(body.cmd, 'fadeToRGB');
    });

    it('/blink1/blink reaches device without error', async function() {
        const { status, body } = await get('/blink1/blink?rgb=%23ff00ff&count=2&time=0.1');
        assert.equal(status, 200);
        assert.equal(body.rgb, '#ff00ff');
        // Let the blink finish before the after() hook turns off the device
        await new Promise(function(r) { setTimeout(r, 500); });
    });

    it('/blink1/pattern/play with system pattern reaches device', async function() {
        const { body } = await get('/blink1/pattern/play?name=red+flash');
        assert.ok(body.status.includes('playing'));
        await new Promise(function(r) { setTimeout(r, 300); });
        await get('/blink1/pattern/stop');
    });
    
    it('/blink1/off sets device dark without error', async function() {
        const { status, body } = await get('/blink1/off');
        assert.equal(status, 200);
        assert.equal(body.rgb, '#000000');
    });
});
