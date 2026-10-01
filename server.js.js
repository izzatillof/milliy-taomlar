// Telegram xabarlari uchun oddiy backend. Bot tokenini HTML ichiga yozmang.
const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0 && !process.env[trimmed.slice(0, idx)]) {
      process.env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).trim();
    }
  }
}
loadEnv();

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const sessions = new Set();

function readMenu(){ return JSON.parse(fs.readFileSync(MENU_FILE, 'utf8')); }
function writeMenu(items){ fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2)); }
function parseBody(req){ return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>200000) reject(new Error('So‘rov juda katta'));});req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'));}catch(e){reject(e);}});req.on('error',reject);});}
function isAdmin(req){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('admin_session='));return !!cookie && sessions.has(cookie.slice('admin_session='.length));}
const ROOT = __dirname;
const MENU_FILE = path.join(ROOT, 'foods.json');
function sendJson(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'});
  res.end(JSON.stringify(data));
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
    return res.end();
  }
  if (req.method === 'GET' && req.url === '/admin') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    return fs.createReadStream(path.join(ROOT, 'admin.html')).pipe(res);
  }
  if (req.method === 'GET' && req.url === '/api/menu') {
    try { return sendJson(res, 200, readMenu()); } catch(e) { return sendJson(res, 500, {error:'Menyuni o‘qib bo‘lmadi.'}); }
  }
  if (req.method === 'POST' && req.url === '/api/admin/login') {
    try { const body=await parseBody(req); if(!ADMIN_PASSWORD) return sendJson(res, 503, {error:'.env faylida ADMIN_PASSWORD belgilanmagan.'}); if(String(body.password||'') !== ADMIN_PASSWORD) return sendJson(res, 401, {error:'Parol noto‘g‘ri.'}); const sid=require('crypto').randomBytes(32).toString('hex'); sessions.add(sid); res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Set-Cookie':`admin_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`}); return res.end(JSON.stringify({ok:true})); } catch(e) { return sendJson(res,400,{error:'So‘rov noto‘g‘ri.'}); }
  }
  if (req.method === 'POST' && req.url === '/api/admin/logout') { const c=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('admin_session=')); if(c)sessions.delete(c.slice('admin_session='.length)); res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Set-Cookie':'admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'}); return res.end('{"ok":true}'); }
  if ((req.method === 'GET' || req.method === 'PUT' || req.method === 'DELETE') && req.url === '/api/admin/menu') {
    if(!isAdmin(req)) return sendJson(res,401,{error:'Avval admin sifatida kiring.'});
    try { let items=readMenu(); if(req.method==='GET') return sendJson(res,200,items); const body=await parseBody(req); if(req.method==='DELETE'){items=items.filter(f=>f.id!==String(body.id));writeMenu(items);return sendJson(res,200,{ok:true});} const f=body.food||{}; if(!String(f.name||'').trim() || !Number.isFinite(Number(f.price)) || Number(f.price)<0) return sendJson(res,400,{error:'Mahsulot nomi va narxini to‘g‘ri kiriting.'}); const clean={id:String(f.id||('food-'+Date.now())).slice(0,80),name:String(f.name).trim().slice(0,80),price:Math.round(Number(f.price)),category:String(f.category||'Asosiy taom').slice(0,60),emoji:String(f.emoji||'🍽️').slice(0,8),image:String(f.image||'').slice(0,1000),desc:String(f.desc||'').slice(0,250)}; const idx=items.findIndex(x=>x.id===clean.id); if(idx>=0)items[idx]=clean;else items.push(clean);writeMenu(items);return sendJson(res,200,{ok:true}); } catch(e){return sendJson(res,500,{error:'Menyu saqlanmadi. foods.json faylini tekshiring.'});}
  }
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    return fs.createReadStream(path.join(ROOT, 'index.html')).pipe(res);
  }
  if (req.method === 'POST' && req.url === '/api/order') {
    if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN.includes('BU_YERGA') || CHAT_ID.includes('BU_YERGA')) {
      return sendJson(res, 500, {error:'Telegram sozlanmagan. .env fayliga bot tokeni va chat ID kiriting.'});
    }
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 100000) req.destroy(); });
    req.on('end', async () => {
      try {
        const order = JSON.parse(raw);
        const name = String(order.name || '').trim().slice(0, 100);
        const phone = String(order.phone || '').trim().slice(0, 40);
        const address = String(order.address || '').trim().slice(0, 500);
        if (!name || !phone || !address || !Array.isArray(order.items) || !order.items.length) {
          return sendJson(res, 400, {error:'Ism, telefon, manzil va taomlarni tekshiring.'});
        }
        let total = 0;
        const itemLines = order.items.map(item => {
          const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
          const price = Math.max(0, Number(item.price) || 0);
          const itemName = String(item.name || 'Taom').slice(0, 100);
          total += price * qty;
          return `• ${itemName} x${qty} — ${(price * qty).toLocaleString('uz-UZ')} so‘m`;
        });
        const message = [
          '🛍 YANGI BUYURTMA!',
          '',
          `👤 Mijoz: ${name}`,
          `📞 Telefon: ${phone}`,
          `📍 Manzil: ${address}`,
          '',
          '🍽 Taomlar:',
          ...itemLines,
          '',
          `💰 Jami: ${total.toLocaleString('uz-UZ')} so‘m`
        ].join('\n');
        const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({chat_id:CHAT_ID, text:message})
        });
        const data = await tg.json();
        if (!tg.ok || !data.ok) return sendJson(res, 502, {error:'Telegram xabarni yubora olmadi. .env dagi token va chat ID ni tekshiring.'});
        return sendJson(res, 200, {ok:true});
      } catch (err) {
        return sendJson(res, 400, {error:'Buyurtma ma’lumotlarini o‘qib bo‘lmadi.'});
      }
    });
    return;
  }
  res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
  res.end('Topilmadi');
});
server.listen(PORT, () => console.log(`Ilova ishga tushdi: http://localhost:${PORT}`));
