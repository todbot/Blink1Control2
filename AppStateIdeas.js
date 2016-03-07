// Application state concepts

// copy much from config

var actions =
[
    /*
pattern
    ADD_PATTERN
    DEL_PATTERN
    EDIT_PATTERN
    PLAY_PATTERN
    STOP_PATTERN
    STOP_ALL_PATTERNS

big button
    ADD_BIG_BUTTON
    DEL_BIG_BUTTON
    EDIT_BIG_BUTTON
    PLAY_BIG_BUTTON

blink1
    FADE_COLOR
    OFF
    ADD_DEVICE
    REMOVE_DEVICE

ifttt
    ADD_RULE
    DEL_RULE


    */
];

var appState =
{
    devices: [
        {
            serialNumber: 'abcd1234',
            hostId: 'CAFED00D',
            connected: false,
            lastLedN: 1, // hmmm
            currentColors: [
                {rgb: '#ff0ff', time: 0.3 }, // ledn = 1
                {rgb: '#000ff', time: 0.2 }, // ledn = 2
            ],
        }
    ],
    patterns: [
        {
            name: "red flashes (copy)",
            id: "redflashescopy",
            pattern: "2,#ff0000,0.5,0,#000000,0.5,0",
            playing: false,
        },
        {
            name: "new pattern 1",
            id: "newpattern1",
            pattern: "3,#00ffff,2,0,#ffff00,0.1,0",
            playing: true
        },
    ],
    bigButtons: [
        {
            name: "Available",
            type: "color",
            color: "#00FF00"
        },
        {
            name: "Busy",
            type: "color",
            color: "#ffFF00"
        },
    ],
    ifttt: {
        iftttKey: 'abcd1234abcd1234',
        intervalSecs: 10,
        rules: [
            {
                "name": "bob some new thing",
                "patternId": "purpleflashes",
                "lastTime": "2016-03-05T08:12:59.000Z",
                "source": "boopdfasdfadfadf"
            }
        ]
    },
    mail: {
        rules: [
            {
                "id": "testtest",
                "name": "test test",
                "patternId": "purpleflashes",
                "mailtype": "IMAP",
                "host": "mail.afklab.com",
                "port": 993,
                "username": "todtest@afklab.com",
            }
        ]

    },
    apiServer: {
      port: 8934,
      enabled: true,
      host: "localhost"
    },

};


module.exports = appState;
