'use strict';
const sec=require('../lib/security');
const TARGET_ORIGIN='https://receita-jade.vercel.app';
const VERCEL_TEAM='team_ONgBYmxezVYccZO6Ko8cF1Bw';
const VERCEL_PROJECT='prj_VKAaH3ASbngPTvxQPxNzGbeACfLV';
const n=v=>{const x=Number(v);return Number.isFinite(x)&&x>=0?x:0};
function urlMatches(value){try{const u=new URL(String(value));return u.origin===TARGET_ORIGIN&&u.pathname==='/';}catch(e){return false}}
function extractClarity(body){
 const all=Array.isArray(body.metrics)?body.metrics:[];
 const traffic=all.find(m=>String(m.name).toLowerCase()==='traffic');
 if(!traffic)return {status:'no_traffic_metric',sessions:null,botSessions:null,rows:[],note:'API respondeu, mas a métrica Traffic não foi encontrada.'};
 const rows=(traffic.information||[]).filter(r=>r&&urlMatches(r.URL)).slice(0,120);
 const sessions=rows.reduce((sum,r)=>sum+n(r.totalSessionCount??r.sessionsCount??r.sessionCount),0);
 const bots=rows.reduce((sum,r)=>sum+n(r.totalBotSessionCount),0);
 return {status:rows.length?'available':'no_matching_url',sessions:rows.length?sessions:null,botSessions:rows.length?bots:null,rows:rows.map(r=>({url:r.URL,device:String(r.Device||'Não informado').slice(0,40),sessions:n(r.totalSessionCount??r.sessionsCount??r.sessionCount),bots:n(r.totalBotSessionCount)})),note:rows.length?'Sessões da página / captadas pelo Clarity em janela móvel, não visitas totais.':'Não houve linhas de Traffic correspondentes à home no domínio principal.'};
}
async function clarity(code,days){
 if(!code)return {status:'requires_existing_code',source:'Microsoft Clarity via relatório privado receita-jade',message:'Informe o mesmo código privado usado no relatório Kiwify/Clarity para consultar sessões.'};
 if(code.length<24||code.length>512)return {status:'invalid_code',source:'Microsoft Clarity',message:'Código inválido.'};
 const u=TARGET_ORIGIN+'/api/clarity-report?days='+days;
 const upstream=await fetch(u,{headers:{Authorization:'Bearer '+code,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
 const data=await upstream.json().catch(()=>({}));
 if(!upstream.ok)return {status:'error',source:'Microsoft Clarity',message:upstream.status===401?'Código privado recusado pelo projeto receita.':String(data.error||'Consulta Clarity indisponível.').slice(0,210),upstreamStatus:upstream.status};
 if(!data.ok||data.projectId!=='za6jduedtw')return {status:'error',source:'Microsoft Clarity',message:'Resposta Clarity não validada.'};
 return {source:'Microsoft Clarity — sessões com consentimento',queriedAt:data.queriedAt,windowHours:data.windowHours,timezone:data.timezone,projectId:data.projectId,...extractClarity(data)};
}
async function vercel(){
 const token=process.env.LAB_VERCEL_ANALYTICS_TOKEN;
 if(!token)return {status:'requires_vercel_token',source:'Vercel Web Analytics',message:'A API de Web Analytics precisa de um token de acesso com permissão de leitura do projeto receita. O conector ChatGPT não disponibiliza esse token para o site.'};
 const u=new URL('https://api.vercel.com/v1/query/web-analytics/visits/count');
 u.searchParams.set('teamId',VERCEL_TEAM);u.searchParams.set('projectId',VERCEL_PROJECT);u.searchParams.set('filter',"requestPath eq '/'");
 try{
  const response=await fetch(u,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(16000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return {status:'error',source:'Vercel Web Analytics',message:'API recusou a consulta ou token sem permissão.',upstreamStatus:response.status};
  // Do not misrepresent an unknown response shape as verified visits.
  const count=typeof data?.count==='number'?data.count:typeof data?.visits==='number'?data.visits:typeof data?.data?.count==='number'?data.data.count:null;
  if(count===null)return {status:'unknown_response',source:'Vercel Web Analytics',message:'API respondeu; formato de contagem exige validação, sem métricas apresentadas.'};
  return {status:'available',source:'Vercel Web Analytics',pageVisits:count,queriedAt:new Date().toISOString(),scope:'Projeto receita, caminho /; escopo temporal padrão da API',note:'Métrica da API não está alinhada ao período dos cliques Meta; não calcular taxa de conversão cruzada.'};
 }catch(e){return {status:'error',source:'Vercel Web Analytics',message:'Falha na comunicação com a API Vercel.'}}
}
module.exports=async function(req,res){
 if(req.method!=='POST')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.sameOrigin(req))return sec.json(res,403,{error:'Origem inválida'});
 if(!sec.authenticated(req))return sec.json(res,401,{error:'Sessão não autorizada'});
 const days=Number(req.body?.days??1),code=typeof req.body?.accessCode==='string'?req.body.accessCode:'';
 if(![1,2,3].includes(days))return sec.json(res,400,{error:'Janela Clarity inválida'});
 if(code.length>512)return sec.json(res,400,{error:'Código muito longo'});
 let cl;
 try{cl=await clarity(code,days)}catch(e){cl={status:'error',source:'Microsoft Clarity',message:'O relatório Clarity não pôde ser consultado.'}}
 const ve=await vercel();
 return sec.json(res,200,{queriedAt:new Date().toISOString(),clarity:cl,vercel:ve,comparison:'Fontes com janelas e critérios diferentes; não é válido dividir sessões Clarity por cliques Meta sem normalizar os períodos.',privacy:'Nenhum token ou dado identificável de visitante é enviado no resultado.'});
};
