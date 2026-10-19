const http = require('node:http');
const PAGE = `<!doctype html><html><head><title>Capability lab</title></head><body>
<h1>Capability lab</h1><label>Name<input data-cy="name" maxlength="32"></label>
<button data-cy="reveal">Reveal</button><output data-cy="result"></output>
<a data-cy="next" href="/next">Next</a>
<button data-cy="notify">Notify</button><output data-cy="notice"></output>
<button data-cy="timer">Start timer</button><output data-cy="timer-result">idle</output>
<script>
window.lab = { notify(value) { document.querySelector('[data-cy=notice]').textContent = value; } };
document.querySelector('[data-cy=reveal]').onclick = async () => {
 const response = await fetch('/api/clue', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.querySelector('input').value})});
 const data = await response.json();
 document.querySelector('[data-cy=result]').textContent = response.ok ? data.name + ': ' + data.clue : 'API unavailable';
};
document.querySelector('[data-cy=notify]').onclick = () => window.lab.notify('ready');
document.querySelector('[data-cy=timer]').onclick = () => { document.querySelector('[data-cy=timer-result]').textContent='waiting'; setTimeout(() => { document.querySelector('[data-cy=timer-result]').textContent='complete'; }, 1000); };
</script></body></html>`;
function createFixture() {
 const counters = {browserPosts:0,directGets:0};
 const server = http.createServer((req,res) => {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Lab-Evidence','capability-fixture');
  const json = (status,value) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  if (req.method === 'GET' && req.url === '/') {res.writeHead(200,{'Content-Type':'text/html'});res.end(PAGE);}
  else if (req.method === 'GET' && req.url === '/next') {res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><h1>Second page</h1><p data-cy="clue">page_two_clue</p>');}
  else if (req.method === 'GET' && req.url === '/api/clue') {counters.directGets++;json(200,{clue:'practice_clue',source:'direct-http'});}
  else if (req.method === 'POST' && req.url === '/api/clue') {
   let body='';let oversized=false;
   req.on('data',chunk => {body+=chunk; if(Buffer.byteLength(body)>4096){oversized=true;body='';req.destroy();}});
   req.on('end',() => {if(oversized)return;try{const value=JSON.parse(body);if(typeof value.name!=='string'||value.name.length>32){json(400,{error:'Invalid name'});return;}counters.browserPosts++;json(200,{name:value.name,clue:'practice_clue'});}catch{json(400,{error:'Invalid JSON'});}});
  } else json(404,{error:'Not found'});
 });
 return {server,counters};
}
module.exports={createFixture};
