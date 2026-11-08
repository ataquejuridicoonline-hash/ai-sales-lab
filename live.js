(function(){
'use strict';
const $=s=>document.querySelector(s),brl=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:0});
function say(message){$('#login-message').textContent=message;}
async function request(url,options){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await response.json().catch(()=>({error:'Resposta inválida do servidor'}));return {response,data};}
async function check(){try{const {response,data}=await request('/api/auth');if(!response.ok)throw Error(data.error||'Serviço indisponível');if(!data.configured){say('Acesso ainda não configurado. Crie LAB_ADMIN_PASSWORD e LAB_SESSION_SECRET nas variáveis privadas do projeto Vercel e faça redeploy.');$('#login-submit').disabled=true;return;}if(data.authenticated){unlock();return;}say('Informe a senha administrativa configurada exclusivamente para AI SALES LAB.');}catch(e){say('Não foi possível validar a autenticação. Verifique o deploy das funções na Vercel.');}}
function unlock(){document.body.classList.remove('auth-locked');$('#login-screen').setAttribute('hidden','');loadMetrics();}
async function loadMetrics(){
 const button=$('#metrics-refresh');button.disabled=true;$('#data-status').textContent='Consultando dados privados da campanha...';
 try{const {response,data}=await request('/api/metrics');if(response.status===401){document.body.classList.add('auth-locked');$('#login-screen').removeAttribute('hidden');say('Sua sessão expirou. Entre novamente.');return;}
 if(!response.ok)throw Error(data.error||'Falha no servidor');
 if(!data.configured){$('#data-status').textContent=data.message||'Integração Meta ainda não configurada.';window.AISalesLabSetAgentHealth?.('ATLAS','Sem fonte configurada','O ATLAS precisa de um relatório do Supermetrics ou token autorizado da Meta.');return;}
 const summaryDate=new Date(data.fetchedAt).toLocaleString('pt-BR');
 window.AISalesLabSetAgentHealth?.('ATLAS',data.isSnapshot?'Relatório sincronizado':'Consulta de API concluída',(data.isSnapshot?'Dados reais históricos do Supermetrics; não são em tempo real. ':'Leitura direta da Meta. ')+'Última consulta: '+summaryDate+'.');
 window.AISalesLabSetAgentHealth?.('JARVIS','Regras de alerta ativas','Exibe '+(data.recommendations?.length||0)+' recomendações baseadas em regras. Não toma decisões nem altera campanhas automaticamente.');
 window.AISalesLabSetAgentHealth?.('CASH','CPA estimado','Mede custos e compras atribuídas pela Meta. Pagamentos aprovados dependem da consulta Kiwify.');
 const t=data.totals;$('#m-spend').textContent=brl(t.spend);$('#m-purchases').textContent=num(t.purchases);$('#m-net').textContent=brl(t.purchases*data.netPerSale);$('#m-profit').textContent=brl(t.purchases*data.netPerSale-t.spend);$('#m-period').textContent=data.period.since+' até '+data.period.until;
 const ageMinutes=(Date.now()-Date.parse(data.fetchedAt))/60000;const freshness=data.isSnapshot?(ageMinutes>90?'RELATÓRIO DESATUALIZADO — última sincronização há '+Math.floor(ageMinutes/60)+'h · ':'ÚLTIMO RELATÓRIO SINCRONIZADO (não é tempo real) · '):'Consulta Meta API · ';$('#data-status').textContent=freshness+new Date(data.fetchedAt).toLocaleString('pt-BR')+' · '+num(t.outboundClicks)+' cliques de saída · '+num(t.pageViews)+' visualizações Meta. Compras atribuídas, não conciliadas com Kiwify.';$('#data-status').classList.toggle('outdated',data.isSnapshot&&ageMinutes>90);
 const body=$('#ads-body');body.replaceChildren();if(!data.ads.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=7;cell.textContent='Sem resultados atribuídos neste período.';row.append(cell);body.append(row);}
 data.ads.forEach(ad=>{const row=document.createElement('tr');[ad.name,brl(ad.spend),num(ad.outboundClicks),num(ad.pageViews),num(ad.checkouts),num(ad.purchases),ad.purchases?brl(ad.spend/ad.purchases):'—'].forEach(v=>{const td=document.createElement('td');td.textContent=v;row.append(td);});body.append(row);});
 const insights=$('#agent-insights');insights.replaceChildren();if(!data.recommendations.length){const p=document.createElement('p');p.textContent='Nenhum alerta automático gerado pelas regras atuais; isso não comprova lucratividade.';insights.append(p);}else data.recommendations.forEach(a=>{const p=document.createElement('p');p.className='insight-alert';p.textContent=a.owner+': '+a.message;insights.append(p);});
 }catch(e){$('#data-status').textContent='Não foi possível obter métricas: '+e.message;window.AISalesLabSetAgentHealth?.('ATLAS','Falha na consulta','Os dados não foram confirmados nesta consulta; não serão apresentados como novos.');}
 finally{button.disabled=false;}
}
async function loadSales(){
 const button=$('#sales-refresh');button.disabled=true;$('#cash-status').textContent='Consultando vendas privadas da Kiwify...';
 try{const input=$('#kiwify-code');const accessCode=input.value;input.value='';if(!accessCode){$('#cash-status').textContent='Digite o código privado que você já utiliza no relatório da Kiwify.';return;}const {response,data}=await request('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessCode})});if(response.status===401){$('#cash-status').textContent='Sessão expirada. Entre novamente.';return;}if(!response.ok)throw Error(data.error||'Falha na Kiwify');
 if(!data.configured){$('#cash-status').textContent=data.message||'Integração não configurada.';return;}
 $('#cash-paid').textContent=num(data.paid);$('#cash-net').textContent=data.netAmountAvailable?brl(data.netApprovedBrl):'Não disponível';$('#cash-pending').textContent=num(data.pending);$('#cash-refunded').textContent=num(data.refunded);
 window.AISalesLabSetAgentHealth?.('CASH','Vendas consultadas','Relatório Kiwify recebido. Confira o filtro do produto e concilie os valores antes de afirmar lucro líquido.'); const productNames=Object.keys(data.products||{});const multi=productNames.length>1;$('#cash-status').textContent='Kiwify API · Atualizado em '+new Date(data.fetchedAt).toLocaleString('pt-BR')+'. '+(multi?'ATENÇÃO: múltiplos produtos no relatório.':'Confira o filtro de produto na integração de origem.')+(data.incomplete?' AVISO: paginação incompleta.':'');
 }catch(err){$('#cash-status').textContent='Não foi possível consultar vendas: '+err.message;window.AISalesLabSetAgentHealth?.('CASH','Kiwify não validada','A consulta de pagamentos não foi confirmada. A análise permanece estimada pela Meta.');}
 finally{button.disabled=false;}
}
let jarvisReport=null;
async function runJarvis(){
 const button=$('#jarvis-analyze'),container=$('#jarvis-proposals');
 button.disabled=true;$('#jarvis-status').textContent='Analisando relatório validado do ATLAS...';container.replaceChildren();
 try{
  const {response,data}=await request('/api/decisions');
  if(response.status===401){$('#jarvis-status').textContent='A sessão expirou. Entre novamente.';return;}
  if(!response.ok)throw Error(data.error||'Relatório indisponível');
  if(!Array.isArray(data.proposals))throw Error('Formato de propostas inválido');
  jarvisReport=data;
  const moment=new Date(data.reportFetchedAt).toLocaleString('pt-BR',{timeZone:'America/Campo_Grande'});
  $('#jarvis-status').textContent=data.proposals.length+' proposta(s) geradas · base: '+moment+' (MS) · '+(data.freshness==='outdated'?'relatório desatualizado':data.freshness==='attention'?'atualização recomendada':'relatório recente')+'. Nenhuma ação externa autorizada.';
  data.proposals.forEach(proposal=>{
   const card=document.createElement('article');card.className='jarvis-proposal';
   const heading=document.createElement('div');heading.className='jarvis-proposal-head';
   const title=document.createElement('h3');title.textContent=proposal.title;
   const badge=document.createElement('span');badge.className='pill';badge.textContent=proposal.priority==='high'?'Alta prioridade':'Prioridade moderada';heading.append(title,badge);
   const rationale=document.createElement('p');rationale.textContent=proposal.rationale;
   const evidence=document.createElement('p');evidence.className='jarvis-evidence';evidence.textContent='Evidência: '+proposal.evidence;
   const action=document.createElement('p');action.textContent='Ação proposta: '+proposal.action;
   const limitation=document.createElement('small');limitation.className='jarvis-limitation';limitation.textContent=proposal.limitations;
   const send=document.createElement('button');send.className='button secondary';send.type='button';send.textContent='Enviar para minha aprovação';
   send.addEventListener('click',()=>{
    const result=window.AISalesLabQueueProposal?.(proposal,jarvisReport);
    if(!result?.ok){send.textContent=result?.error||'Não foi possível registrar';send.disabled=true;}
   });
   card.append(heading,rationale,evidence,action,limitation,send);container.append(card);
  });
  window.AISalesLabSetAgentHealth?.('JARVIS','Propostas geradas',data.proposals.length+' propostas fundamentadas no relatório ATLAS de '+moment+'. Execução de anúncios desabilitada.');
 }catch(err){
  $('#jarvis-status').textContent='Análise indisponível: '+err.message;
  window.AISalesLabSetAgentHealth?.('JARVIS','Análise indisponível','Sem relatório validado; nenhuma proposta foi criada.');
 }finally{button.disabled=false;}
}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const input=$('#admin-password'),button=$('#login-submit'),password=input.value;button.disabled=true;say('Validando acesso...');try{const {response,data}=await request('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});input.value='';if(!response.ok)throw Error(data.error||'Acesso recusado');unlock();}catch(err){say(err.message);}finally{button.disabled=false;}});
$('#metrics-refresh').addEventListener('click',loadMetrics);
$('#jarvis-analyze').addEventListener('click',runJarvis);
$('#logout-button').addEventListener('click',async()=>{try{await request('/api/auth',{method:'DELETE'});}finally{window.location.reload();}});
$('#sales-refresh').addEventListener('click',loadSales);
check();
})();