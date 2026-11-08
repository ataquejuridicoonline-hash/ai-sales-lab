const crypto = require('node:crypto');
const COOKIE='aisaleslab_session';
const hours=8;
const noStore={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
function equal(a,b){const x=crypto.createHash('sha256').update(String(a)).digest(),y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y);}
function configured(){return Boolean(process.env.LAB_ADMIN_PASSWORD&&process.env.LAB_SESSION_SECRET&&process.env.LAB_ADMIN_PASSWORD.length>=16&&process.env.LAB_SESSION_SECRET.length>=32);}
function sign(payload){return crypto.createHmac('sha256',process.env.LAB_SESSION_SECRET).update(payload).digest('base64url');}
function makeSession(){const p=Buffer.from(JSON.stringify({exp:Date.now()+hours*3600000,nonce:crypto.randomBytes(12).toString('hex')})).toString('base64url');return p+'.'+sign(p);}
function parseCookies(req){const raw=String(req.headers.cookie||'');const found=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));return found?found.substring(COOKIE.length+1):'';}
function authenticated(req){if(!configured())return false;const token=parseCookies(req),parts=token.split('.');if(parts.length!==2||!equal(parts[1],sign(parts[0])))return false;try{const d=JSON.parse(Buffer.from(parts[0],'base64url').toString());return Number.isFinite(d.exp)&&d.exp>Date.now()&&d.exp<=Date.now()+hours*3600000;}catch(e){return false;}}
function cookie(value,expires){return COOKIE+'='+value+'; Path=/api; HttpOnly; Secure; SameSite=Strict; '+(expires?'Max-Age=0':'Max-Age='+hours*3600);}
function json(res,status,obj){res.writeHead(status,{...noStore,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(obj));}
function sameOrigin(req){const host=req.headers.host||'';const origin=req.headers.origin;return !origin||origin==='https://'+host||(host.startsWith('localhost:')&&origin==='http://'+host);}
module.exports={equal,configured,makeSession,authenticated,cookie,json,sameOrigin};
