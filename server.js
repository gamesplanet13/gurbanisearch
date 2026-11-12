import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),pub=path.join(dir,'public'),dbFile=process.env.DATA_FILE||path.join(dir,'state.json');
let db={controllers:{},screens:{}};try{db=JSON.parse(fs.readFileSync(dbFile,'utf8'))}catch{}
const token=()=>crypto.randomBytes(24).toString('base64url');
function code(){let x;do{x=String(10000+crypto.randomInt(90000))}while([...Object.values(db.controllers),...Object.values(db.screens)].some(a=>a.code===x));return x}
const save=()=>{fs.writeFileSync(dbFile+'.tmp',JSON.stringify(db));fs.renameSync(dbFile+'.tmp',dbFile)};
const send=(r,s,o)=>{r.writeHead(s,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});r.end(JSON.stringify(o))};
const err=(r,s,msg)=>send(r,s,{error:msg});
const ctrl=t=>Object.values(db.controllers).find(c=>c.token===t);
const screen=(id,t)=>db.screens[id]?.token===t?db.screens[id]:null;
const devices=c=>Object.values(db.screens).filter(s=>s.controller===c.id).map(s=>({id:s.id,code:s.code,name:s.name,content:s.content,settings:s.settings}));
const view=s=>({id:s.id,code:s.code,name:s.name,controller:s.controller,content:s.content,settings:s.settings});
async function body(req){let chunks=[];let n=0;for await(const b of req){n+=b.length;if(n>25000)throw Error('Request too large');chunks.push(b)}return JSON.parse(Buffer.concat(chunks).toString()||'{}')}
const server=http.createServer(async(req,res)=>{try{
const u=new URL(req.url,'http://localhost'),p=u.pathname;
if(p.startsWith('/api/')&&req.method==='POST'){
const b=await body(req);
if(p==='/api/controller'){let c=ctrl(b.token);if(!c){c={id:token(),token:token(),code:code()};db.controllers[c.id]=c;save()}return send(res,200,{controller:c,screens:devices(c)})}
if(p==='/api/screen'){let s=screen(b.id,b.token);if(!s){s={id:token(),token:token(),code:code(),name:'Projection Screen',controller:null,content:null,settings:{verseSize:64,meaningSize:28,clock:false}};db.screens[s.id]=s;save()}return send(res,200,{screen:s})}
if(p==='/api/connect'){const c=ctrl(b.token),s=Object.values(db.screens).find(x=>x.code===String(b.code||''));if(!c||!s)return err(res,404,'Pairing code not found');if(s.controller&&s.controller!==c.id)return err(res,409,'Already connected to another controller');s.controller=c.id;save();return send(res,200,{screens:devices(c)})}
if(p==='/api/join'){const s=screen(b.id,b.token),c=Object.values(db.controllers).find(x=>x.code===String(b.code||''));if(!s||!c)return err(res,404,'Controller code not found');if(s.controller&&s.controller!==c.id)return err(res,409,'Already connected to another controller');s.controller=c.id;save();return send(res,200,{screen:view(s)})}
if(p==='/api/publish'){const c=ctrl(b.token);if(!c)return err(res,403,'Not authorized');let n=0;for(const id of Array.isArray(b.ids)?b.ids:[]){const s=db.screens[id];if(!s||s.controller!==c.id)continue;if(Object.hasOwn(b,'content')){if(b.content!==null&&(typeof b.content?.verse!=='string'||b.content.verse.length>5000))return err(res,400,'Invalid content');s.content=b.content}if(b.settings){s.settings={verseSize:Math.max(20,Math.min(150,Number(b.settings.verseSize)||64)),meaningSize:Math.max(16,Math.min(90,Number(b.settings.meaningSize)||28)),clock:!!b.settings.clock}}n++}save();return send(res,200,{updated:n,screens:devices(c)})}
if(p==='/api/unpair'){const c=ctrl(b.token),s=db.screens[b.id];if(!c||!s||s.controller!==c.id)return err(res,403,'Not authorized');s.controller=null;save();return send(res,200,{screens:devices(c)})}
if(p==='/api/name'){const s=screen(b.id,b.token);if(!s)return err(res,403,'Not authorized');s.name=String(b.name||'Projection Screen').slice(0,55);save();return send(res,200,{screen:view(s)})}
return err(res,404,'Unknown API')
}
if(req.method==='GET'&&p==='/api/controller/state'){const c=ctrl(u.searchParams.get('token'));return c?send(res,200,{controller:{id:c.id,code:c.code},screens:devices(c)}):err(res,403,'No controller')}
if(req.method==='GET'&&p==='/api/screen/state'){const s=screen(u.searchParams.get('id'),u.searchParams.get('token'));return s?send(res,200,{screen:view(s)}):err(res,403,'No projection')}
if(req.method==='GET'&&p==='/api/search'){const q=u.searchParams.get('q')||'',t=u.searchParams.get('type')||'7';if(!q||q.length>120||!['0','1','2','3','4','5','6','7'].includes(t))return err(res,400,'Bad search');try{const a=await fetch('https://api.banidb.com/v2/search/'+encodeURIComponent(q)+'?searchtype='+t+'&source=all&results=40',{signal:AbortSignal.timeout(12000)});if(!a.ok)throw Error('BaniDB status '+a.status);return send(res,200,await a.json())}catch(e){return err(res,502,'BaniDB search unavailable: '+e.message)}}
if(req.method==='GET'&&p.startsWith('/api/shabad/')){const id=p.slice(12);if(!/^[a-zA-Z0-9_+,-]{1,70}$/.test(id))return err(res,400,'Bad ID');try{const a=await fetch('https://api.banidb.com/v2/shabads/'+encodeURIComponent(id),{signal:AbortSignal.timeout(12000)});if(!a.ok)throw Error('BaniDB status '+a.status);return send(res,200,await a.json())}catch(e){return err(res,502,'BaniDB shabad unavailable: '+e.message)}}
const name=p==='/'?'index.html':p.slice(1);if(!['index.html','projection.html'].includes(name))return err(res,404,'Not found');res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});return fs.createReadStream(path.join(pub,name)).pipe(res)
}catch(e){if(!res.headersSent)err(res,500,e.message);else res.end()}});
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Gurbani Browser at http://localhost:'+(process.env.PORT||3000)));
