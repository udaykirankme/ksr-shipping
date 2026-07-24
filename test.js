fetch('http://localhost:3000/dashboard').then(r => r.text()).then(html => console.log(html.match(/href=\"\/dashboard\/shipments\/([^\"]+)\"/g))).catch(console.error)
