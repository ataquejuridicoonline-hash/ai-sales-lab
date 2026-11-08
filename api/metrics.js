const sec=require('../lib/security');
const ACCOUNT='act_810330994745301';
const CAMPAIGN='120252293321330531';
function n(x){const z=Number(x);return Number.isFinite(z)?z:0;}
function count(v){return Array.isArray(v)?v.reduce((a,b)=>a+n(b.value),0):n(v);}
function action(actions,types){for(const type of types){const found=(actions||[]).find(a=>a.action_type===type);if(found)return n(found.value);}return 0;}
function normalize(row){return {id:String(row.ad_id||row.campaign_id||''),name:String(row.ad_name||row.campaign_name||''),spend:n(row.spend),impressions:n(row.impressions),outboundClicks:count(row.outbound_clicks),linkClicks:n(row.inline_link_clicks),pageViews:action(row.actions,['landing_page_view']),checkouts:action(row.actions,['offsite_conversion.fb_pixel_initiate_checkout','initiate_checkout','omni_initiated_checkout']),purchases:action(row.actions,['offsite_conversion.fb_pixel_purchase','purchase','omni_purchase']),purchaseValue:action(row.action_values,['offsite_conversion.fb_pixel_purchase','purchase','omni_purchase'])};}
module.exports=async function(req,res){
 if(req.method!=='GET')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.authenticated(req))return sec.json(res,401,{error:'Sessão não autorizada'});
 const token=process.env.LAB_META_ACCESS_TOKEN;
 if(!token){
  const raw=process.env.LAB_META_SNAPSHOT;
  if(raw){try{
   const snapshot=JSON.parse(raw);
   if(snapshot.source!=='Supermetrics Marketing Agent' || snapshot.campaignId!==CAMPAIGN || !Array.isArray(snapshot.ads) || !snapshot.totals || !snapshot.fetchedAt)throw new Error('Invalid snapshot');
   return sec.json(res,200,{...snapshot,configured:true,isSnapshot:true,source:'Supermetrics Marketing Agent (último relatório sincronizado manualmente)',message:'Relatório verificado, mas não atualizado automaticamente. A atualização em tempo real exige integração própria com a Meta.'});
  }catch(err){return sec.json(res,503,{configured:false,error:'Relatório da Meta inválido. Solicite nova sincronização.'});}}
  return sec.json(res,200,{configured:false,source:'Meta Marketing API',campaignId:CAMPAIGN,accountId:ACCOUNT,message:'Aguardando conexão Meta ou relatório seguro do Supermetrics. Nenhuma estatística de demonstração está sendo apresentada.'});
 }
 const since=String(req.query?.since||'2026-11-05'),until=String(req.query?.until||new Date().toISOString().slice(0,10));
 if(!/^\d{4}-\d{2}-\d{2}$/.test(since)||!/^\d{4}-\d{2}-\d{2}$/.test(until)||since>until||Date.parse(until)-Date.parse(since)>90*86400000)return sec.json(res,400,{error:'Período inválido (máximo 90 dias).'});
 const fields='campaign_id,campaign_name,ad_id,ad_name,spend,impressions,inline_link_clicks,outbound_clicks,actions,action_values';
 const p=new URLSearchParams({fields,level:'ad',limit:'100',time_range:JSON.stringify({since,until})});
 try{
  const rows=[];let url='https://graph.facebook.com/v24.0/'+CAMPAIGN+'/insights?'+p.toString();let pages=0;
  while(url&&pages<10){const response=await fetch(url,{headers:{Accept:'application/json',Authorization:'Bearer '+token},signal:AbortSignal.timeout(14000)});const data=await response.json();if(!response.ok){return sec.json(res,502,{configured:true,error:'Meta API: '+String(data.error?.message||response.status).slice(0,180)});}if(!Array.isArray(data.data))break;rows.push(...data.data);const next=data.paging?.next||null;if(next&&!next.startsWith('https://graph.facebook.com/'))break;url=next;pages++;}
  const ads=rows.map(normalize),totals=ads.reduce((acc,a)=>{for(const k of ['spend','impressions','outboundClicks','linkClicks','pageViews','checkouts','purchases','purchaseValue'])acc[k]+=a[k];return acc;},{spend:0,impressions:0,outboundClicks:0,linkClicks:0,pageViews:0,checkouts:0,purchases:0,purchaseValue:0});
  const netPerSale=n(process.env.LAB_NET_PER_SALE||15.62);
  const recommendations=[];
  if(totals.outboundClicks>=20&&totals.pageViews/totals.outboundClicks<0.3)recommendations.push({owner:'ATLAS',level:'warning',message:'Poucas visualizações atribuídas em relação aos cliques de saída. Verifique Vercel Analytics e consentimento antes de concluir que as visitas falharam.'});
  if(totals.purchases===0&&totals.spend>=netPerSale)recommendations.push({owner:'CASH',level:'warning',message:'Gasto com mídia já supera a receita líquida estimada por venda; ainda não há compras atribuídas no período.'});
  if(totals.purchases>0&&totals.spend/totals.purchases>=netPerSale)recommendations.push({owner:'CASH',level:'warning',message:'CPA igual ou maior que a contribuição estimada por venda; não escalar orçamento sem revisão.'});
  return sec.json(res,200,{configured:true,source:'Meta Marketing API (atribuição da plataforma, não conciliação Kiwify)',fetchedAt:new Date().toISOString(),period:{since,until},campaignId:CAMPAIGN,accountId:ACCOUNT,netPerSale,totals,ads,recommendations,notes:['As compras são atribuídas pela Meta, não pagamentos confirmados pela Kiwify.','Visualizações de página dependem da medição e consentimento do Pixel.','Resultado financeiro estimado antes de impostos, chargebacks e outros custos.']});
 }catch(e){return sec.json(res,502,{configured:true,error:'Falha na comunicação com Meta API. Consulte o token e as permissões no servidor.'});}
};
