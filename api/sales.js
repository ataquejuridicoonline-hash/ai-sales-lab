const sec=require('../lib/security');
module.exports=async function(req,res){
 if(req.method!=='POST')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.sameOrigin(req))return sec.json(res,403,{error:'Origem inválida'});
 if(!sec.authenticated(req))return sec.json(res,401,{error:'Sessão não autorizada'});
 const secret=typeof req.body?.accessCode==='string'?req.body.accessCode:'';
 if(secret.length<24||secret.length>512)return sec.json(res,400,{error:'Informe o código privado já usado no painel da Kiwify. Ele não é salvo na AI SALES LAB.'});
 const start=String(req.body?.start||'2026-11-05'),end=String(req.body?.end||new Date().toISOString().slice(0,10));
 const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d));
 if(!valid(start)||!valid(end)||start>end||Date.parse(end)-Date.parse(start)>89*86400000)return sec.json(res,400,{error:'Período inválido (até 90 dias)'});
 try{
  const url='https://receita-jade.vercel.app/api/kiwify-report?'+new URLSearchParams({start,end}).toString();
  const upstream=await fetch(url,{headers:{Authorization:'Bearer '+secret,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
  const data=await upstream.json().catch(()=>({}));
  if(!upstream.ok)return sec.json(res,502,{configured:true,error:'Acesso recusado ao relatório existente. Confira o código privado usado na Kiwify e se o serviço original está funcionando.'});
  const number=x=>{const n=Number(x);return Number.isFinite(n)?n:0;};
  return sec.json(res,200,{configured:true,source:'Kiwify API oficial — via relatório privado receita-jade',fetchedAt:new Date().toISOString(),period:{start,end},paid:number(data.paid),pending:number(data.pending),refunded:number(data.refunded),netApprovedBrl:number(data.netApprovedBrl),netAmountAvailable:!!data.netAmountAvailable,incomplete:!!data.incomplete,products:data.products||{},note:'O relatório pode abranger outros produtos se KIWIFY_PRODUCT_ID não estiver configurado na origem. Não equiparar automaticamente com compras atribuídas na Meta.'});
 }catch(err){return sec.json(res,502,{configured:true,error:'Não foi possível obter o relatório Kiwify. Tente novamente.'});}
};