#!/usr/bin/env node
'use strict';

// Converts docs/help/index.md → app/help/index.html
// Also copies docs/help/images/ and docs/help/style.css into app/help/
// Run: node scripts/build-help.js

var fs   = require('fs');
var path = require('path');
var { marked } = require('marked');

var root     = path.join(__dirname, '..');
var srcMd    = path.join(root, 'docs/help/index.md');
var srcCss   = path.join(root, 'docs/help/style.css');
var srcImgs  = path.join(root, 'docs/help/images');
var destDir  = path.join(root, 'app/help');
var destHtml = path.join(destDir, 'index.html');
var destCss  = path.join(destDir, 'style.css');
var destImgs = path.join(destDir, 'images');

fs.mkdirSync(destDir, { recursive: true });

var md   = fs.readFileSync(srcMd, 'utf8');
var body = marked.parse(md);

var html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blink1Control2 Help</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="markdown-body">
${body}
</div>
</body>
</html>
`;

fs.writeFileSync(destHtml, html);
console.log('built', destHtml);

fs.copyFileSync(srcCss, destCss);
console.log('copied', destCss);

if (fs.existsSync(srcImgs)) {
    fs.cpSync(srcImgs, destImgs, { recursive: true });
    console.log('copied', destImgs);
}
