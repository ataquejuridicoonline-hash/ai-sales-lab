'use strict';
const sec=require('../lib/security');
const {analyze,validate}=require('../lib/decision-engine');
function numeric(x){const n=Number(x);return Number.isFinite(n)&&n>=0?n:0}
function pct(a,b){return b>0?Math.round(10000*a/b)/100:null}
function summaryAd(a){
 const outbound=numeric(a.outboundClicks),pageViews=numeric(a.pageViews),spend=numeric(a.spend);
 return {name:String(a.name||'Anúncio sem nome').slice(0,90),spend:Math.round(spend*100)/100,outboundClicks:outbound,pageViews,estimatedAttributedViewRatePercent:pct(pageViews,outbound),checkouts:numeric(a.checkouts),purchases:numeric(a.purchases),costPerOutboundClick:outbound?Math.round(spend/outbound*100)/100:null};
}
module.exports=async function(req,res){
 if(req.method!=='POST')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.sameOrigin(req))return sec.json(res,403,{error:'Origem inválida'});
 if(!sec.authenticated(req))return sec.json(res,401,{error:'Acesso privado necessário'});
 const proposalId=req.body?.proposalId,reportFetchedAt=req.body?.reportFetchedAt;
 if(typeof proposalId!=='string'||!/^[a-f0-9]{18}$/.test(proposalId)||typeof reportFetchedAt!=='string')return sec.json(res,400,{error:'Proposta inválida'});
 if(req.body?.confirmed!==true)return sec.json(res,400,{error:'Confirmação explícita exigida'});
 try{
  const raw=process.env.LAB_META_SNAPSHOT;
  if(!raw)return sec.json(res,503,{error:'Relatório Supermetrics não disponível'});
  const snapshot=JSON.parse(raw),valid=validate(snapshot);
  if(!valid)return sec.json(res,503,{error:'Relatório não validado'});
  if(snapshot.fetchedAt!==reportFetchedAt)return sec.json(res,409,{error:'A base da campanha mudou. Gere nova proposta e aprove novamente antes de executar.'});
  const decision=analyze(snapshot).proposals.find(x=>x.id===proposalId&&x.type==='audit-tracking');
  if(!decision)return sec.json(res,403,{error:'Somente a auditoria de tráfego pode ser executada. Outras ações permanecem bloqueadas.'});
  const ads=valid.ads.map(summaryAd).sort((a,b)=>b.outboundClicks-a.outboundClicks);
  const totals=valid.t;
  const findings=[
   {severity:'high',title:'Discrepância entre cliques de saída e LPV atribuídas',evidence:`${numeric(totals.outboundClicks)} cliques de saída, ${numeric(totals.pageViews)} LPV Meta; taxa de LPV/clique ${pct(numeric(totals.pageViews),numeric(totals.outboundClicks))??'indisponível'}%.`,interpretation:'Atribuição da Meta pode subcontar visitas quando há recusas de consentimento, bloqueadores ou diferenças de janela. Isso não comprova tráfego fraudulento.'},
   {severity:'medium',title:'Diferenças por anúncio',evidence:ads.map(a=>`${a.name}: ${a.outboundClicks} cliques e ${a.pageViews} LPV`).join(' · '),interpretation:'Priorize revisão dos posicionamentos nos anúncios com mais cliques e menor taxa atribuída de visita.'}
  ];
  const steps=[
   {task:'Verificar visitas independentes',status:'pending',reason:'Vercel Analytics não está conectado ao executor. Compare Page Views da página exata, no mesmo período da campanha.'},
   {task:'Inspecionar Clarity',status:'pending',reason:'O executor não dispõe das métricas Clarity. Verifique sessões por origem e dispositivo, respeitando consentimento.'},
   {task:'Auditar posicionamentos',status:'pending',reason:'Snapshot recebido contém anúncio agregado, não detalhamento por posicionamento. Consulte breakdown oficial antes de mudanças.'},
   {task:'Conferir consentimento e PageView',status:'pending',reason:'Verifique os eventos de teste e como a recusa/ausência de consentimento afeta o Meta Pixel.'}
  ];
  const checks={metricValidation:'passed',independentVisits:'not_connected',claritySessions:'not_connected',placementBreakdown:'not_in_snapshot',externalChanges:'none'};
  return sec.json(res,200,{
   type:'audit-tracking',
   status:'completed_with_pending_checks',
   executionMode:'read_only_analysis',
   executedAt:new Date().toISOString(),
   campaignId:'120252293321330531',
   approvedProposalId:proposalId,
   source:'Supermetrics Marketing Agent — último snapshot',
   reportFetchedAt:snapshot.fetchedAt,
   period:snapshot.period,
   sourceIsHistorical:true,
   totals:{spend:numeric(totals.spend),outboundClicks:numeric(totals.outboundClicks),pageViews:numeric(totals.pageViews),pageViewPerClickPercent:pct(numeric(totals.pageViews),numeric(totals.outboundClicks))},
   ads,findings,steps,checks,
   conclusion:'A auditoria preliminar foi executada com os dados disponíveis. A causa da divergência não foi confirmada: faltam dados de visitas independentes e detalhamento de posicionamentos.',
   nextDecision:'Manter testes e escalonamentos sujeitos a análise adicional; nenhuma campanha foi alterada.'
  });
 }catch(err){return sec.json(res,503,{error:'Não foi possível executar a auditoria de forma confiável.'});}
};
