import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

const DAILY_LIMIT = 3;
function clientIp(req: VercelRequest) {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : (xff || req.headers['x-real-ip'] || 'unknown');
  return String(raw).split(',')[0].trim();
}
function subject(req: VercelRequest) {
  const salt = process.env.GUEST_RATE_SALT;
  if (!salt) throw new Error('GUEST_RATE_SALT is not configured');
  return crypto.createHmac('sha256', salt).update(clientIp(req)).digest('hex');
}
async function sb(path:string, init:RequestInit={}) {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Server Supabase configuration missing');
  const r=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`, 'Content-Type':'application/json',...(init.headers||{})}});
  if(!r.ok) throw new Error(await r.text()); return r;
}
export default async function handler(req:VercelRequest,res:VercelResponse){
  if(req.method!=='GET'&&req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try {
    const date=new Date().toISOString().slice(0,10), key=subject(req);
    if(req.method==='GET') {
      const r=await sb(`guest_daily_usage?subject_hash=eq.${key}&usage_date=eq.${date}&select=used`); const rows=await r.json();
      const used=Number(rows?.[0]?.used||0); return res.status(200).json({used,remaining:Math.max(0,DAILY_LIMIT-used),total:DAILY_LIMIT});
    }
    // Atomic RPC: database increments only if used < limit.
    const r=await sb('rpc/consume_guest_credit',{method:'POST',body:JSON.stringify({p_subject_hash:key,p_usage_date:date,p_daily_limit:DAILY_LIMIT})});
    const data=await r.json();
    if(!data?.allowed) return res.status(429).json({allowed:false,used:DAILY_LIMIT,remaining:0,total:DAILY_LIMIT});
    return res.status(200).json({...data,total:DAILY_LIMIT});
  } catch(e){ console.error('guest-credit',e); return res.status(500).json({error:'Quota service unavailable'}); }
}
