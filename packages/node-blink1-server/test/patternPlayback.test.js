'use strict';

// patternPlayback.test.js — runtime playback behaviour of PatternsService.
//
// Covers:
//   - play / stop state flags
//   - serialize-mode queue: second play queues the first; stopping current
//     resumes the queued one (regression for the inverted filter bug)
//   - three-pattern LIFO stack ordering in serialize mode
//   - initialize() does not mutate the caller's input objects (regression for
//     the nconf circular-Timeout crash)
//
// No HTTP server or blink(1) hardware required.
// Patterns use 99 repeats and long step times so they never finish naturally
// during a synchronous test — termination is always explicit.

const { describe, it, before, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const PatternsService = require('../lib/patternsService');

const noopEmitter = { emit: function() {} };

// Two long-running user patterns reused across most describe blocks.
const LONG_PATTERNS = [
    { name: 'alpha', id: 'alpha', pattern: '99,#ff0000,0.5,0,#000000,0.5,0', playing: false },
    { name: 'beta',  id: 'beta',  pattern: '99,#0000ff,0.5,0,#000000,0.5,0', playing: false },
];

// Reset the singleton to a known clean state.
function resetService(conf) {
    PatternsService.init({ emitter: noopEmitter });
    PatternsService.stopAllPatterns();
    PatternsService.initialize(
        conf || {},
        LONG_PATTERNS.map(function(p) { return Object.assign({}, p); })
    );
}

// ─── play / stop state ────────────────────────────────────────────────────────

describe('play and stop state', function() {
    var alpha, beta;

    before(function() {
        resetService();
        alpha = PatternsService.getAllPatterns().find(function(p) { return p.name === 'alpha'; });
        beta  = PatternsService.getAllPatterns().find(function(p) { return p.name === 'beta'; });
    });
    afterEach(function() { PatternsService.stopAllPatterns(); });

    it('pattern.playing is true after playPatternFrom()', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        assert.equal(alpha.playing, true);
    });

    it('getPlayingPatternId() returns the active id', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        assert.equal(PatternsService.getPlayingPatternId(), alpha.id);
    });

    it('getPlayingPatternName() returns the active name', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        assert.equal(PatternsService.getPlayingPatternName(), 'alpha');
    });

    it('pattern.playing is false after stopPattern()', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.stopPattern(alpha.id);
        assert.equal(alpha.playing, false);
    });

    it('getPlayingPatternId() is undefined after stopPattern()', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.stopPattern(alpha.id);
        assert.equal(PatternsService.getPlayingPatternId(), undefined);
    });

    it('playPatternFrom() resets playpos and playcount on each new play', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.stopPattern(alpha.id);
        // Second play should restart from the beginning without errors.
        assert.doesNotThrow(function() { PatternsService.playPatternFrom('test', alpha.id); });
        assert.equal(alpha.playing, true);
    });

    it('stopping a non-playing pattern is a safe no-op', function() {
        assert.doesNotThrow(function() { PatternsService.stopPattern(beta.id); });
    });
});

// ─── serialize mode: two-pattern queue ───────────────────────────────────────

describe('serialize mode: two-pattern queue', function() {
    var alpha, beta;

    before(function() {
        resetService({ playingSerialize: true });
        alpha = PatternsService.getAllPatterns().find(function(p) { return p.name === 'alpha'; });
        beta  = PatternsService.getAllPatterns().find(function(p) { return p.name === 'beta'; });
    });
    afterEach(function() { PatternsService.stopAllPatterns(); });

    it('starting a second pattern switches the active pattern', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.playPatternFrom('test', beta.id);
        assert.equal(PatternsService.getPlayingPatternName(), 'beta');
    });

    it('stopping the active pattern resumes the queued one', function() {
        // Regression: the queue filter was inverted — it removed every pattern
        // *except* the one being stopped, leaving the queue empty so the
        // previously-queued pattern never resumed.
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.playPatternFrom('test', beta.id);
        assert.equal(PatternsService.getPlayingPatternName(), 'beta');

        PatternsService.stopPattern(beta.id);
        assert.equal(
            PatternsService.getPlayingPatternName(), 'alpha',
            'alpha should resume after beta is stopped'
        );
    });

    it('stopAllPatterns() clears the queue — queued pattern does not resume', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        PatternsService.playPatternFrom('test', beta.id);
        PatternsService.stopAllPatterns();
        assert.equal(PatternsService.getPlayingPatternId(), undefined);
    });

    it('replaying the same pattern while it is already active is handled gracefully', function() {
        PatternsService.playPatternFrom('test', alpha.id);
        assert.doesNotThrow(function() { PatternsService.playPatternFrom('test', alpha.id); });
        assert.equal(PatternsService.getPlayingPatternName(), 'alpha');
    });
});

// ─── serialize mode: three-pattern LIFO stack ────────────────────────────────

describe('serialize mode: three-pattern LIFO stack', function() {
    var alpha, beta, gamma;

    before(function() {
        resetService({ playingSerialize: true });
        // Add a third pattern for this block only.
        PatternsService.savePattern({
            name: 'gamma', repeats: 99, playing: false,
            colors: [
                { rgb: '#00ff00', time: 0.5, ledn: 0 },
                { rgb: '#000000', time: 0.5, ledn: 0 },
            ],
        });
        alpha = PatternsService.getAllPatterns().find(function(p) { return p.name === 'alpha'; });
        beta  = PatternsService.getAllPatterns().find(function(p) { return p.name === 'beta'; });
        gamma = PatternsService.getAllPatterns().find(function(p) { return p.name === 'gamma'; });
    });
    afterEach(function() { PatternsService.stopAllPatterns(); });

    it('queue is LIFO: stopping top resumes most-recently queued pattern', function() {
        PatternsService.playPatternFrom('test', alpha.id); // alpha active; queue: []
        PatternsService.playPatternFrom('test', beta.id);  // beta active;  queue: [alpha]
        PatternsService.playPatternFrom('test', gamma.id); // gamma active; queue: [alpha, beta]

        assert.equal(PatternsService.getPlayingPatternName(), 'gamma');

        PatternsService.stopPattern(gamma.id);
        assert.equal(
            PatternsService.getPlayingPatternName(), 'beta',
            'beta should resume after gamma is stopped'
        );

        PatternsService.stopPattern(beta.id);
        assert.equal(
            PatternsService.getPlayingPatternName(), 'alpha',
            'alpha should resume after beta is stopped'
        );
    });
});

// ─── initialize() does not mutate input objects ───────────────────────────────

describe('initialize() does not mutate the caller\'s input objects', function() {
    afterEach(function() { PatternsService.stopAllPatterns(); });

    it('colors and repeats are not written back to the original object', function() {
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.stopAllPatterns();

        var original = [{ name: 'ref', pattern: '2,#ff0000,0.1,0,#000000,0.1,0', playing: false }];
        PatternsService.initialize({}, original);

        assert.ok(!('colors'  in original[0]), 'colors leaked into caller\'s object');
        assert.ok(!('repeats' in original[0]), 'repeats leaked into caller\'s object');
    });

    it('timer from playback does not leak back into the caller\'s object', function() {
        // Regression: initialize() used to mutate the nconf-owned objects in
        // place, so pattern.timer from playback was written directly into
        // nconf's store, causing JSON.stringify to throw on the next config
        // save (circular Timeout reference).
        PatternsService.init({ emitter: noopEmitter });
        PatternsService.stopAllPatterns();

        var original = [{ name: 'mut', pattern: '99,#ff0000,0.5,0,#000000,0.5,0', playing: false }];
        PatternsService.initialize({}, original);

        var p = PatternsService.getAllPatterns().find(function(p) { return p.name === 'mut'; });
        PatternsService.playPatternFrom('test', p.name); // look up by name — no id in initialize() input

        assert.ok(!('timer' in original[0]),
            'timer must not appear on the caller-supplied pattern object');
    });
});
