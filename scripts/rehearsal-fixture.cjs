const http = require('node:http');
const crypto = require('node:crypto');
const SAMPLE = 'practice-evidence\n';
const COUNTERS = ['loginAttempts', 'logins', 'validations', 'denied', 'clueReads', 'uploads', 'downloads'];
const page = body => `<!doctype html><html><head><title>Practice rehearsal</title></head><body>${body}</body></html>`;
const LOGIN = page(`<h1>Practice login</h1><form data-cy="login"><label>User<input data-cy="user" maxlength="32"></label><button>Log in</button></form><p data-cy="error"></p><script>
document.querySelector('form').onsubmit=async e=>{e.preventDefault();const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:document.querySelector('input').value})});if(r.ok)location.assign('/challenge');else document.querySelector('[data-cy=error]').textContent='Login rejected';};
</script>`);
const CHALLENGE = page(`<h1>Authorized practice challenge</h1><button data-cy="load">Read clue</button><output data-cy="clue"></output><input type="file" data-cy="file"><button data-cy="upload">Upload practice file</button><output data-cy="upload-result"></output><a data-cy="download" href="/artifact.txt" download="practice-artifact.txt">Download practice artifact</a><script>
document.querySelector('[data-cy=load]').onclick=async()=>{const r=await fetch('/api/clue');const data=await r.json();document.querySelector('[data-cy=clue]').textContent=r.ok?data.clue:'Temporarily unavailable';};
document.querySelector('[data-cy=upload]').onclick=async()=>{const file=document.querySelector('[data-cy=file]').files[0];if(!file)return;const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,content:await file.text()})});const data=await r.json();document.querySelector('[data-cy=upload-result]').textContent=r.ok?data.bytes+' bytes accepted':'Upload rejected';};
</script>`);
const DOM = page('<h1>DOM practice</h1><span data-cy="clue" data-source="controlled" hidden>practice_clue</span><button data-cy="reveal" onclick="document.querySelector(\'[data-cy=clue]\').hidden=false">Reveal</button>');
function createRehearsalFixture() {
  const sessions = new Set();
  const counters = Object.fromEntries(COUNTERS.map(key => [key, 0]));
  const reset = () => { sessions.clear(); for (const key of COUNTERS) counters[key] = 0; };
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'");
    const send = (status, type, body) => { res.writeHead(status, {'Content-Type': type}); res.end(body); };
    const json = (status, value) => send(status, 'application/json', JSON.stringify(value));
    const signedIn = () => {
      const cookie = /(?:^|;\s*)rehearsal_session=([a-f0-9]{48})(?:;|$)/.exec(req.headers.cookie || '');
      if (cookie && sessions.has(cookie[1])) return true;
      counters.denied++; json(401, {error: 'Practice login required'}); return false;
    };
    const readJSON = async () => {
      let bytes = 0; const chunks = [];
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 4096) throw new Error('Oversized practice request'); chunks.push(chunk); }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    };
    try {
      if (req.method === 'GET' && (req.url === '/login' || req.url === '/')) return send(200, 'text/html', LOGIN);
      if (req.method === 'GET' && req.url === '/dom') return send(200, 'text/html', DOM);
      if (req.method === 'POST' && req.url === '/api/login') {
        counters.loginAttempts++;
        const body = await readJSON();
        if (body.user !== 'practice-competitor') return json(400, {error: 'Use the public practice identity'});
        const token = crypto.randomBytes(24).toString('hex'); sessions.add(token); counters.logins++;
        res.setHeader('Set-Cookie', `rehearsal_session=${token}; HttpOnly; SameSite=Strict; Path=/`);
        return json(200, {authenticated: true});
      }
      if (req.method === 'GET' && req.url === '/api/session') { counters.validations++; if (signedIn()) json(200, {user: 'practice-competitor'}); return; }
      if (req.method === 'GET' && req.url === '/challenge') { if (signedIn()) send(200, 'text/html', CHALLENGE); return; }
      if (req.method === 'GET' && req.url === '/api/clue') { if (signedIn()) { counters.clueReads++; json(200, {clue: 'practice_clue'}); } return; }
      if (req.method === 'POST' && req.url === '/api/upload') {
        if (!signedIn()) return;
        const body = await readJSON();
        if (body.name !== 'practice.txt' || body.content !== SAMPLE) return json(400, {error: 'Only the fixed practice file is accepted'});
        counters.uploads++;
        return json(200, {bytes: Buffer.byteLength(SAMPLE), sha256: crypto.createHash('sha256').update(SAMPLE).digest('hex')});
      }
      if (req.method === 'GET' && req.url === '/artifact.txt') {
        if (!signedIn()) return;
        counters.downloads++; res.setHeader('Content-Disposition', 'attachment; filename="practice-artifact.txt"');
        return send(200, 'text/plain', SAMPLE);
      }
      json(404, {error: 'Unknown practice route'});
    } catch { if (!res.headersSent && !res.destroyed) json(400, {error: 'Invalid practice request'}); else res.destroy(); }
  });
  server.requestTimeout = 5000;
  return {server, counters, reset, expire: () => sessions.clear()};
}
module.exports = {createRehearsalFixture, SAMPLE, COUNTERS};
