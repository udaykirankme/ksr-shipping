const html = require('fs').readFileSync('out.txt', 'utf8'); console.log(html.match(/\/dashboard\/shipments\/[^\"]+/g));
