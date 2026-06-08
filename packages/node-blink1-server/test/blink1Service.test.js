'use strict';

// Unit tests for blink1Service.
// Tests state management, config, host ID, and listener wiring.
// No blink(1) hardware required — hardware calls are no-ops when
// Blink1.devices() returns [] (no device plugged in).

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const Blink1Service = require('../lib/blink1Service');

const noopEmitter = { emit: function() {} };

// ─── init() / start() ────────────────────────────────────────────────────────

describe('start() / conf', function() {
    it('stores the config object passed to start()', function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({ deviceRescan: false, enableGamma: true });
        assert.equal(Blink1Service.conf.deviceRescan, false);
        assert.equal(Blink1Service.conf.enableGamma, true);
    });

    it('defaults to empty conf when start() called with no argument', function() {
        Blink1Service.start();
        assert.deepEqual(Blink1Service.conf, {});
    });
});

// ─── hostId ──────────────────────────────────────────────────────────────────

describe('getHostId() / setHostId()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('generates a valid 8-char uppercase hex id when none is set', function() {
        const id = Blink1Service.getHostId();
        assert.match(id, /^[0-9A-F]{8}$/);
    });

    it('returns the same id on repeated calls (not re-generated)', function() {
        const a = Blink1Service.getHostId();
        const b = Blink1Service.getHostId();
        assert.equal(a, b);
    });

    it('returns the hostId present in conf if set at start()', function() {
        Blink1Service.start({ hostId: 'DEADBEEF' });
        assert.equal(Blink1Service.getHostId(), 'DEADBEEF');
    });

    it('setHostId accepts a valid 8-char hex string and returns true', function() {
        Blink1Service.start({});
        const ok = Blink1Service.setHostId('AABBCCDD');
        assert.equal(ok, true);
        assert.equal(Blink1Service.getHostId(), 'AABBCCDD');
    });

    it('setHostId upcases the input', function() {
        Blink1Service.start({});
        Blink1Service.setHostId('aabbccdd');
        assert.equal(Blink1Service.getHostId(), 'AABBCCDD');
    });

    it('setHostId rejects strings that are too short', function() {
        assert.equal(Blink1Service.setHostId('ABC'), false);
    });

    it('setHostId rejects strings that are too long', function() {
        assert.equal(Blink1Service.setHostId('AABBCCDD00'), false);
    });

    it('setHostId rejects non-hex characters', function() {
        assert.equal(Blink1Service.setHostId('ZZZZZZZZ'), false);
    });

    it('setHostId emits configChanged with key "hostId"', function() {
        Blink1Service.start({});
        let event = null;
        Blink1Service.init({ emitter: { emit: function(e, k, v) { event = { e: e, k: k, v: v }; } } });
        Blink1Service.setHostId('12345678');
        assert.deepEqual(event, { e: 'configChanged', k: 'hostId', v: '12345678' });
    });
});

// ─── IFTTT key ───────────────────────────────────────────────────────────────

describe('getIftttKey()', function() {
    it('is exactly 16 chars (hostId + 8-char serial or placeholder)', function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({ hostId: 'AABBCCDD' });
        const key = Blink1Service.getIftttKey();
        assert.equal(key.length, 16);
    });

    it('starts with the current hostId', function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({ hostId: 'CAFEBABE' });
        assert.ok(Blink1Service.getIftttKey().startsWith('CAFEBABE'));
    });
});

// ─── Device index mapping ─────────────────────────────────────────────────────

describe('idToBlink1Index()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('returns 0 for undefined', function() {
        assert.equal(Blink1Service.idToBlink1Index(undefined), 0);
    });

    it('returns 0 for null', function() {
        assert.equal(Blink1Service.idToBlink1Index(null), 0);
    });

    it('returns 0 for numeric 0', function() {
        assert.equal(Blink1Service.idToBlink1Index(0), 0);
    });

    it('returns 0 for an unknown serial (fallback)', function() {
        assert.equal(Blink1Service.idToBlink1Index('FFFFFFFF'), 0);
    });
});

// ─── Color state ──────────────────────────────────────────────────────────────

describe('fadeToColor() / getCurrentColor()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('getCurrentColor() returns an object with toHexString()', function() {
        const color = Blink1Service.getCurrentColor();
        assert.equal(typeof color.toHexString, 'function');
    });

    it('fadeToColor() updates the color returned by getCurrentColor()', function() {
        Blink1Service.fadeToColor(100, '#ff0000', 0, 0);
        assert.equal(Blink1Service.getCurrentColor(0, 0).toHexString(), '#ff0000');
    });

    it('fadeToColor() with a different color updates state', function() {
        Blink1Service.fadeToColor(100, '#0000ff', 0, 0);
        assert.equal(Blink1Service.getCurrentColor(0, 0).toHexString(), '#0000ff');
    });

    it('getCurrentMillis() returns the millis passed to fadeToColor()', function() {
        Blink1Service.fadeToColor(750, '#00ff00', 0, 0);
        assert.equal(Blink1Service.getCurrentMillis(0), 750);
    });
});

// ─── Serials / connection status ──────────────────────────────────────────────

describe('getAllSerials() / isConnected()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('getAllSerials() returns an array', function() {
        assert.ok(Array.isArray(Blink1Service.getAllSerials()));
    });

    it('isConnected() returns a number', function() {
        assert.equal(typeof Blink1Service.isConnected(), 'number');
    });

    it('getStatusString() returns a non-empty string', function() {
        const s = Blink1Service.getStatusString();
        assert.ok(typeof s === 'string' && s.length > 0);
    });
});

// ─── Change listeners ─────────────────────────────────────────────────────────

describe('addChangeListener() / removeChangeListener() / notifyChange()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('listener is invoked on notifyChange()', function() {
        let called = false;
        Blink1Service.addChangeListener(function() { called = true; }, 'test-cl');
        Blink1Service.notifyChange();
        Blink1Service.removeChangeListener('test-cl');
        assert.ok(called);
    });

    it('listener is not called after removeChangeListener()', function() {
        let count = 0;
        Blink1Service.addChangeListener(function() { count++; }, 'count-cl');
        Blink1Service.notifyChange();
        Blink1Service.removeChangeListener('count-cl');
        Blink1Service.notifyChange();
        assert.equal(count, 1);
    });

    it('deviceUpdated event emitted on _setupFoundDevices()', function() {
        let fired = false;
        Blink1Service.init({ emitter: { emit: function(e) { if (e === 'deviceUpdated') { fired = true; } } } });
        Blink1Service._setupFoundDevices();
        assert.ok(fired);
    });
});

// ─── setSendState() ──────────────────────────────────────────────────────────

describe('setSendState()', function() {
    before(function() {
        Blink1Service.init({ emitter: noopEmitter });
        Blink1Service.start({});
    });

    it('calls fn immediately with the current state object', function() {
        let received = null;
        Blink1Service.setSendState(function(state) { received = state; });
        assert.ok(received !== null, 'fn not called immediately');
        assert.equal(typeof received.currentColor, 'string');
        assert.ok(Array.isArray(received.allSerials));
        assert.equal(typeof received.isConnected, 'number');
        assert.equal(typeof received.hostId, 'string');
        Blink1Service.setSendState(null); // reset
    });

    it('state includes iftttKey', function() {
        let state = null;
        Blink1Service.setSendState(function(s) { state = s; });
        assert.ok(state && typeof state.iftttKey === 'string' && state.iftttKey.length === 16);
        Blink1Service.setSendState(null);
    });
});
