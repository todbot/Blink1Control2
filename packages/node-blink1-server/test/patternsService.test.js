'use strict';

// Unit tests for patternsService.
// No HTTP, no blink(1) hardware required.
// blink1Service.fadeToColor() is called during pattern playback but is a
// safe no-op when no device is connected.

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const PatternsService = require('../lib/patternsService');

// Shared no-op emitter — replaced per-describe where events are checked.
const noopEmitter = { emit: function() {} };

// ─── initialize() ────────────────────────────────────────────────────────────

describe('initialize()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('populates system patterns', function() {
        assert.ok(PatternsService.getAllPatterns().length > 0);
    });

    it('system patterns include "red flash"', function() {
        const rf = PatternsService.getAllPatterns().find(function(p) { return p.name === 'red flash'; });
        assert.ok(rf, 'red flash missing');
        assert.ok(Array.isArray(rf.colors) && rf.colors.length > 0);
        assert.equal(rf.system, true);
        assert.equal(rf.locked, true);
    });

    it('system patterns include "policecar"', function() {
        const pc = PatternsService.getAllPatterns().find(function(p) { return p.name === 'policecar'; });
        assert.ok(pc, 'policecar missing');
    });

    it('pre-loads user patterns passed in', function() {
        PatternsService.initialize({}, [{
            name: 'preloaded',
            pattern: '2,#ff0000,0.3,0,#000000,0.3,0',
            playing: false,
        }]);
        const found = PatternsService.getAllPatterns().find(function(p) { return p.name === 'preloaded'; });
        assert.ok(found, 'preloaded pattern missing');
        assert.ok(Array.isArray(found.colors));
    });

    it('second initialize() replaces previous user patterns', function() {
        PatternsService.initialize({}, [{ name: 'first', pattern: '1,#ff0000,0.1,0', playing: false }]);
        PatternsService.initialize({}, [{ name: 'second', pattern: '1,#00ff00,0.1,0', playing: false }]);
        const all = PatternsService.getAllPatterns();
        assert.ok(!all.find(function(p) { return p.name === 'first'; }), 'first still present after re-init');
        assert.ok(all.find(function(p) { return p.name === 'second'; }), 'second not present');
    });
});

// ─── savePattern() / deletePattern() ─────────────────────────────────────────

describe('savePattern() / deletePattern()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('savePattern() adds a new user pattern', function() {
        PatternsService.savePattern({
            name: 'unit-save', repeats: 1, playing: false,
            colors: [{ rgb: '#ff0000', time: 0.2, ledn: 0 }],
        });
        assert.ok(PatternsService.getAllPatterns().find(function(p) { return p.name === 'unit-save'; }));
    });

    it('savePattern() assigns an id if none given', function() {
        PatternsService.savePattern({
            name: 'no-id', repeats: 1, playing: false,
            colors: [{ rgb: '#0000ff', time: 0.2, ledn: 0 }],
        });
        const p = PatternsService.getAllPatterns().find(function(p) { return p.name === 'no-id'; });
        assert.ok(p && typeof p.id === 'string' && p.id.length > 0);
    });

    it('savePattern() updates existing pattern by id', function() {
        const p = PatternsService.getAllPatterns().find(function(p) { return p.name === 'unit-save'; });
        p.repeats = 5;
        PatternsService.savePattern(p);
        const updated = PatternsService.getAllPatterns().find(function(q) { return q.id === p.id; });
        assert.equal(updated.repeats, 5);
    });

    it('deletePattern() removes a user pattern', function() {
        const p = PatternsService.getAllPatterns().find(function(p) { return p.name === 'unit-save'; });
        PatternsService.deletePattern(p.id);
        assert.ok(!PatternsService.getAllPatterns().find(function(q) { return q.name === 'unit-save'; }));
    });

    it('deletePattern() with unknown id is a no-op', function() {
        const before = PatternsService.getAllPatterns().length;
        PatternsService.deletePattern('does-not-exist');
        assert.equal(PatternsService.getAllPatterns().length, before);
    });

    it('system patterns cannot be removed via deletePattern()', function() {
        const sysBefore = PatternsService.getAllPatterns().filter(function(p) { return p.system; }).length;
        const rf = PatternsService.getAllPatterns().find(function(p) { return p.name === 'red flash'; });
        PatternsService.deletePattern(rf.id); // silently ignored for system patterns
        const sysAfter = PatternsService.getAllPatterns().filter(function(p) { return p.system; }).length;
        assert.equal(sysAfter, sysBefore);
    });
});

// ─── patternsChanged event ────────────────────────────────────────────────────

describe('patternsChanged event', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('fires on savePattern()', function() {
        let fired = false;
        PatternsService.init({ emitter: { emit: function(e) { if (e === 'patternsChanged') { fired = true; } } } });
        PatternsService.savePattern({ name: 'evt-save', repeats: 1, playing: false, colors: [{ rgb: '#ff0000', time: 0.1, ledn: 0 }] });
        assert.ok(fired, 'patternsChanged not emitted on savePattern');
    });

    it('fires on deletePattern()', function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.savePattern({ name: 'evt-del', repeats: 1, playing: false, colors: [{ rgb: '#00ff00', time: 0.1, ledn: 0 }] });
        const p = PatternsService.getAllPatterns().find(function(p) { return p.name === 'evt-del'; });

        let fired = false;
        PatternsService.init({ emitter: { emit: function(e) { if (e === 'patternsChanged') { fired = true; } } } });
        PatternsService.deletePattern(p.id);
        assert.ok(fired, 'patternsChanged not emitted on deletePattern');
    });

    it('payload is an array of pattern objects', function() {
        let payload = null;
        PatternsService.init({ emitter: { emit: function(e, data) { if (e === 'patternsChanged') { payload = data; } } } });
        PatternsService.savePattern({ name: 'evt-payload', repeats: 1, playing: false, colors: [{ rgb: '#0000ff', time: 0.1, ledn: 0 }] });
        assert.ok(Array.isArray(payload), 'patternsChanged payload not an array');
        assert.ok(payload.every(function(p) { return typeof p.name === 'string'; }));
    });
});

// ─── playPatternFrom() ────────────────────────────────────────────────────────

describe('playPatternFrom()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('plays a named system pattern by name', function() {
        const result = PatternsService.playPatternFrom('test', 'red flash');
        assert.ok(result, 'expected truthy result');
    });

    it('plays a named system pattern by id', function() {
        const id = PatternsService.getIdForName('red flash');
        const result = PatternsService.playPatternFrom('test', id);
        assert.ok(result);
    });

    it('#hexcolor meta-pattern plays without a pre-defined pattern', function() {
        assert.ok(PatternsService.playPatternFrom('test', '#ff0000'));
    });

    it('~off meta-pattern returns "~off"', function() {
        assert.equal(PatternsService.playPatternFrom('test', '~off'), '~off');
    });

    it('~blink: meta-pattern plays without a pre-defined pattern', function() {
        assert.ok(PatternsService.playPatternFrom('test', '~blink:#ff0000-3-0.1'));
    });

    it('~pattern: meta-pattern plays an inline pattern string', function() {
        const result = PatternsService.playPatternFrom('test', '~pattern:inline:2,#ff0000,0.1,0,#000000,0.1,0');
        assert.ok(result);
    });

    it('unknown pattern name returns false', function() {
        assert.equal(PatternsService.playPatternFrom('test', 'doesnotexist'), false);
    });

    it('malformed ~unknown: prefix returns false', function() {
        assert.equal(PatternsService.playPatternFrom('test', '~unknownmeta'), false);
    });
});

// ─── stopAllPatterns() ────────────────────────────────────────────────────────

describe('stopAllPatterns()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('clears playingPatternId after stopping', function() {
        PatternsService.playPatternFrom('test', '#ff0000');
        PatternsService.stopAllPatterns();
        assert.equal(PatternsService.getPlayingPatternId(), undefined);
    });

    it('is safe to call when nothing is playing', function() {
        assert.doesNotThrow(function() { PatternsService.stopAllPatterns(); });
    });
});

// ─── formatPatternForOutput() ─────────────────────────────────────────────────

describe('formatPatternForOutput()', function() {
    it('generates a repeats-prefixed pattern string', function() {
        const patt = {
            name: 'fmt', id: 'fmt', repeats: 2, playing: false, locked: false,
            colors: [{ rgb: '#ff0000', time: 0.3, ledn: 0 }, { rgb: '#000000', time: 0.3, ledn: 0 }],
        };
        const out = PatternsService.formatPatternForOutput(patt);
        assert.ok(out.pattern.startsWith('2,'), 'should start with repeat count');
        assert.ok(out.pattern.includes('#ff0000'));
        assert.ok(out.pattern.includes('#000000'));
    });

    it('returns null for null input', function() {
        assert.equal(PatternsService.formatPatternForOutput(null), null);
    });
});

// ─── Lookups ─────────────────────────────────────────────────────────────────

describe('getIdForName() / getNameForId()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('getIdForName returns a non-empty string for a known pattern', function() {
        const id = PatternsService.getIdForName('red flash');
        assert.ok(id && id.length > 0);
    });

    it('getIdForName returns empty string for unknown name', function() {
        assert.equal(PatternsService.getIdForName('doesnotexist'), '');
    });

    it('getIdForName passes ~ names through unchanged', function() {
        assert.equal(PatternsService.getIdForName('~off'), '~off');
    });

    it('getNameForId round-trips with getIdForName', function() {
        const id = PatternsService.getIdForName('red flash');
        assert.equal(PatternsService.getNameForId(id), 'red flash');
    });

    it('getNameForId returns empty string for unknown id', function() {
        assert.equal(PatternsService.getNameForId('doesnotexist'), '');
    });
});

// ─── Change listeners ─────────────────────────────────────────────────────────

describe('addChangeListener() / removeChangeListener()', function() {
    before(function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.initialize({}, []);
    });

    it('listener is called on notifyChange()', function() {
        let called = false;
        PatternsService.addChangeListener(function() { called = true; }, 'cl-test');
        PatternsService.notifyChange();
        PatternsService.removeChangeListener('cl-test');
        assert.ok(called);
    });

    it('listener is not called after removeChangeListener()', function() {
        let count = 0;
        PatternsService.addChangeListener(function() { count++; }, 'cl-count');
        PatternsService.notifyChange();
        PatternsService.removeChangeListener('cl-count');
        PatternsService.notifyChange();
        assert.equal(count, 1);
    });
});
