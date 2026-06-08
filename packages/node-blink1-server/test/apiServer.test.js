'use strict';

// HTTP integration tests for apiServer.
// Starts a real server instance on a dedicated test port and uses the
// built-in fetch() to exercise every route group.
// No blink(1) hardware required — all hardware calls are no-ops when
// no device is plugged in.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createBlink1Server = require('../index');

const PORT = 19934;
const BASE = 'http://localhost:' + PORT;

let server;

async function get(path) {
    const res = await fetch(BASE + path);
    let body;
    try { body = await res.json(); } catch(_) { body = {}; }
    return { status: res.status, body };
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

before(async function() {
    server = createBlink1Server({ apiConfig: { port: PORT, host: 'localhost' } });
    server.start();
    // Wait for the HTTP server to bind AND for blink1Service's 500ms
    // _setupFoundDevices() timer to fire (so device-open attempts complete
    // before the test framework considers the before() hook done).
    await new Promise(function(resolve) { setTimeout(resolve, 650); });
});

after(function() {
    return new Promise(function(resolve) { server.stop(resolve); });
});

// ─── Device endpoints ────────────────────────────────────────────────────────

describe('device endpoints', function() {
    it('GET /blink1/id → 200 with expected shape', async function() {
        const { status, body } = await get('/blink1/id');
        assert.equal(status, 200);
        assert.equal(body.status, 'blink1 id');
        assert.ok(Array.isArray(body.blink1_serialnums));
        assert.equal(typeof body.blink1_id, 'string');
    });

    it('GET /blink1 → same response as /blink1/id', async function() {
        const { status, body } = await get('/blink1');
        assert.equal(status, 200);
        assert.equal(body.status, 'blink1 id');
    });

    it('GET /blink1/enumerate → 200 with serials array', async function() {
        const { status, body } = await get('/blink1/enumerate');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.blink1_serialnums));
    });
});

// ─── Color endpoints ─────────────────────────────────────────────────────────

describe('color endpoints', function() {
    it('GET /blink1/off → rgb #000000', async function() {
        const { status, body } = await get('/blink1/off');
        assert.equal(status, 200);
        assert.equal(body.rgb, '#000000');
    });

    it('GET /blink1/on → rgb #ffffff', async function() {
        const { body } = await get('/blink1/on');
        assert.equal(body.rgb, '#ffffff');
    });

    it('GET /blink1/red → rgb #ff0000', async function() {
        const { body } = await get('/blink1/red');
        assert.equal(body.rgb, '#ff0000');
    });

    it('GET /blink1/green → rgb #00ff00', async function() {
        const { body } = await get('/blink1/green');
        assert.equal(body.rgb, '#00ff00');
    });

    it('GET /blink1/blue → rgb #0000ff', async function() {
        const { body } = await get('/blink1/blue');
        assert.equal(body.rgb, '#0000ff');
    });

    it('GET /blink1/fadeToRGB with valid rgb → echoes color and cmd', async function() {
        const { status, body } = await get('/blink1/fadeToRGB?rgb=%230000ff&time=0.1');
        assert.equal(status, 200);
        assert.equal(body.lastColor, '#0000ff');
        assert.equal(body.cmd, 'fadeToRGB');
        assert.ok(Array.isArray(body.blink1_serialnums));
    });

    it('GET /blink1/fadeToRGB with invalid rgb → status flags error', async function() {
        const { body } = await get('/blink1/fadeToRGB?rgb=notacolor');
        assert.ok(body.status.includes('bad hex'), 'expected bad-hex message, got: ' + body.status);
    });

    it('GET /blink1/lastColor tracks fadeToRGB', async function() {
        await get('/blink1/fadeToRGB?rgb=%23ff00ff&time=0.1');
        const { body } = await get('/blink1/lastColor');
        assert.equal(body.lastColor, '#ff00ff');
        assert.equal(body.status, 'success');
    });

    it('GET /blink1/lastColor tracks /blink1/off', async function() {
        await get('/blink1/off');
        const { body } = await get('/blink1/lastColor');
        assert.equal(body.lastColor, '#000000');
    });

    it('GET /blink1/random → valid 6-digit hex color', async function() {
        const { status, body } = await get('/blink1/random');
        assert.equal(status, 200);
        assert.match(body.rgb, /^#[0-9a-fA-F]{6}$/);
    });

    it('GET /blink1/blink → 200 with echoed count', async function() {
        const { status, body } = await get('/blink1/blink?rgb=%23ff0000&count=3&time=0.1');
        assert.equal(status, 200);
        assert.equal(body.count, 3);
        assert.equal(body.rgb, '#ff0000');
    });
});

// ─── Pattern list ────────────────────────────────────────────────────────────

describe('pattern list', function() {
    it('GET /blink1/patterns → array containing "red flash"', async function() {
        const { status, body } = await get('/blink1/patterns');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.patterns));
        const rf = body.patterns.find(function(p) { return p.name === 'red flash'; });
        assert.ok(rf, 'red flash missing from pattern list');
        assert.ok(typeof rf.pattern === 'string' && rf.pattern.length > 0, 'red flash has no pattern string');
    });

    it('GET /blink1/pattern → same as /blink1/patterns', async function() {
        const { body } = await get('/blink1/pattern');
        assert.ok(Array.isArray(body.patterns));
    });

    it('GET /blink1/patterns → contains "policecar"', async function() {
        const { body } = await get('/blink1/patterns');
        const pc = body.patterns.find(function(p) { return p.name === 'policecar'; });
        assert.ok(pc, 'policecar missing from pattern list');
    });

    it('GET /blink1/pattern/queue → array', async function() {
        const { status, body } = await get('/blink1/pattern/queue');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.queue));
    });
});

// ─── Pattern CRUD lifecycle ──────────────────────────────────────────────────

describe('pattern CRUD', function() {
    const NAME = 'test-crud-' + Date.now();
    const PATTERN = '3,%23ff00ff,0.3,0,%23000000,0.3,0';

    it('add pattern → status contains "added"', async function() {
        const { status, body } = await get(
            '/blink1/pattern/add?name=' + NAME + '&pattern=' + PATTERN
        );
        assert.equal(status, 200);
        assert.ok(body.status.includes('added'), 'expected "added" in: ' + body.status);
    });

    it('added pattern appears in /blink1/patterns', async function() {
        const { body } = await get('/blink1/patterns');
        const found = body.patterns.find(function(p) { return p.name === NAME; });
        assert.ok(found, 'newly added pattern not in list');
    });

    it('play the added pattern → status contains "playing"', async function() {
        const { body } = await get('/blink1/pattern/play?name=' + NAME);
        assert.ok(body.status.includes('playing'), 'expected "playing" in: ' + body.status);
    });

    it('stop the pattern by name → 200', async function() {
        const { status } = await get('/blink1/pattern/stop?name=' + NAME);
        assert.equal(status, 200);
    });

    it('delete pattern → status contains "deleted"', async function() {
        const { body } = await get('/blink1/pattern/del?name=' + NAME);
        assert.ok(body.status.includes('deleted'), 'expected "deleted" in: ' + body.status);
    });

    it('deleted pattern no longer in list', async function() {
        const { body } = await get('/blink1/patterns');
        const found = body.patterns.find(function(p) { return p.name === NAME; });
        assert.ok(!found, 'deleted pattern still in list');
    });

    it('pattern count stable after add + delete cycle', async function() {
        const before = (await get('/blink1/patterns')).body.patterns.length;
        const tmp = 'tmp-count-' + Date.now();
        await get('/blink1/pattern/add?name=' + tmp + '&pattern=1,%23ff0000,0.1,0');
        await get('/blink1/pattern/del?name=' + tmp);
        const after = (await get('/blink1/patterns')).body.patterns.length;
        assert.equal(after, before);
    });
});

// ─── Pattern play via meta-patterns ──────────────────────────────────────────

describe('meta-pattern play via API', function() {
    it('play a named system pattern → status contains "playing"', async function() {
        const { body } = await get('/blink1/pattern/play?name=red+flash');
        assert.ok(body.status.includes('playing'), 'expected "playing" in: ' + body.status);
    });

    it('stop all patterns (no name) → 200', async function() {
        const { status } = await get('/blink1/pattern/stop');
        assert.equal(status, 200);
    });
});

// ─── Edge cases and error responses ─────────────────────────────────────────

describe('edge cases', function() {
    it('play unknown pattern name → status does not say "playing"', async function() {
        const { body } = await get('/blink1/pattern/play?name=doesnotexist');
        assert.ok(!body.status.includes('playing'), 'did not expect "playing" in: ' + body.status);
    });

    it('add with name but no pattern arg → status indicates no pattern added', async function() {
        const { body } = await get('/blink1/pattern/add?name=onlyname');
        assert.ok(!body.status.includes('added '), 'did not expect success "added" in: ' + body.status);
    });

    it('add with neither name nor pattern → status contains "must specify"', async function() {
        const { body } = await get('/blink1/pattern/add');
        assert.ok(body.status.includes('must specify'), 'expected "must specify" in: ' + body.status);
    });

    it('del without name or id → status contains "must specify"', async function() {
        const { body } = await get('/blink1/pattern/del');
        assert.ok(body.status.includes('must specify'), 'expected error in: ' + body.status);
    });

    it('unknown endpoint → 404', async function() {
        const res = await fetch(BASE + '/blink1/doesnotexist');
        assert.equal(res.status, 404);
    });

    it('malformed blink1_id → server still responds to next request', async function() {
        await fetch(BASE + '/blink1/on?blink1_id=,');
        const res = await fetch(BASE + '/blink1/id');
        assert.equal(res.status, 200);
    });
});
