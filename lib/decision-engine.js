'use strict';
const crypto=require('node:crypto');
const CAMPAIGN='120252293321330531';
const ACCOUNT='act_810330994745301';
const money=n=>Math.round((Number(n)||0)*100)/100;
function validate(input){
 if(!input||input.campaignId!==CAMPAIGN||input.accountId!==ACCOUNT||!Array.isArray(input.ads)||!input.totals)return null;
 const t=input.totals;const keys=['spend','outboundClicks','pageViews','checkouts','purchases','impressions'];
 if(!keys.every(k=>Number.isFinite(Number(t[k]))&&Number(t[k])>=0))return null;
 const when=Date.parse(input.fetchedAt);
 if(!Number.isFinite(when)||when>Date.now()+5*60000)return null;
 return {t,when,ads:input.ads,period:input.period||{},perSale:Number.isFinite(Number(input.netPerSale))&&Number(input.netPerSale)>0?Number(input.netPerSale):15.62};
}
function analyze(input){
 const validated=validate(input);
 if(!validated)throw new Error('Relatório inválido para análise');
 const {t,when,ads,period,perSale}=validated;
 const cpa=t.purchases>0?t.spend/t.purchases:null;
 const ratio=t.outboundClicks>0?t.pageViews/t.outboundClicks:null;
 const ageMinutes=Math.max(0,Math.round((Date.now()-when)/60000));
 const freshness=ageMinutes>120?'outdated':ageMinutes>90?'attention':'recent';
 const result=[];
 function add(type,priority,title,action,rationale,evidence,owner,limitations){
  const id=crypto.createHash('sha256').update([CAMPAIGN,period.since||'',period.until||'',type].join(':')).digest('hex').slice(0,18);
  result.push({id,type,priority,title,action,rationale,evidence,owner,limitations,approvalRequired:true,executionAvailable:false});
 }
 if(freshness==='outdated')add('refresh-data','high','Atualizar base antes de decisões','Conferir nova sincronização ATLAS e comparar períodos equivalentes.','Um relatório antigo pode distorcer prioridades ou esconder mudanças recentes.',`Última atualização: ${new Date(when).toISOString()}; idade: ${ageMinutes} min.`,'ATLAS','Não aumenta orçamento nem altera campanha.');
 if(t.outboundClicks>=20&&ratio!==null&&ratio<0.3)add('audit-tracking','high','Auditar tráfego e medição de visitas','Comparar cliques de saída por posicionamento com Vercel Analytics e Clarity; verificar consentimento e atribuição.','Diferença grande entre cliques e PageViews atribuídas requer investigação antes de concluir que são cliques inválidos.',`${t.outboundClicks} cliques de saída; ${t.pageViews} LPV Meta; razão ${Math.round(ratio*100)}%.`,'ATLAS','PageView do Pixel não representa necessariamente todas as visitas reais.');
 if(t.spend>=perSale&&(!t.purchases||cpa>=perSale))add('protect-budget','high','Não ampliar orçamento até validar CPA','Manter o teto de gasto atual e submeter qualquer aumento a uma nova análise financeira.','A contribuição estimada por venda é inferior ao custo de aquisição atribuído ou não há compra atribuída.',`Gasto R$ ${money(t.spend).toFixed(2)}; compras Meta ${t.purchases}; CPA ${cpa===null?'indisponível':'R$ '+money(cpa).toFixed(2)}; contribuição estimada R$ ${money(perSale).toFixed(2)}.`,'CASH','Não é uma ordem para pausar ou editar campanhas; vendas Kiwify ainda não conciliadas.');
 const costly=ads.filter(a=>Number(a.spend)>=5&&Number(a.purchases)===0).sort((a,b)=>Number(b.spend)-Number(a.spend));
 if(costly.length)add('review-no-sale','medium','Revisar anúncios sem compras atribuídas','Analisar criativo, posicionamento, distribuição e qualidade dos cliques, sem pausar anúncio automaticamente.','Há investimento em anúncios sem compra atribuída no período. Isso não comprova que os anúncios não funcionarão.',costly.slice(0,3).map(a=>`${String(a.name).slice(0,70)}: R$ ${money(a.spend).toFixed(2)}, ${Number(a.outboundClicks)||0} cliques`).join('; '),'ATLAS','O algoritmo de entrega e a atribuição podem variar; não pausar sem teste suficiente.');
 add('verify-kiwify','medium','Conciliar vendas Meta × Kiwify','Consultar pagamentos aprovados, reembolsos e líquidos na Kiwify antes de calcular lucro real.','Compras atribuídas pela Meta não são comprovação independente de recebimentos aprovados.',`Meta: ${t.purchases} compra(s) atribuída(s); valor atribuído R$ ${money(t.purchaseValue||0).toFixed(2)}.`,'CASH','Relatório Kiwify não foi incluído nesta análise, e o valor atribuído Meta pode usar regra própria.');
 return {source:'JARVIS — motor de regras auditável (sem modelo de IA externo)',modelType:'rules',campaignId:CAMPAIGN,accountId:ACCOUNT,reportFetchedAt:new Date(when).toISOString(),period,reportAgeMinutes:ageMinutes,freshness,computedAt:new Date().toISOString(),metrics:{spend:money(t.spend),outboundClicks:Number(t.outboundClicks),pageViews:Number(t.pageViews),purchases:Number(t.purchases),cpa:cpa===null?null:money(cpa),contributionPerSale:money(perSale),ratio:ratio===null?null:Math.round(ratio*1000)/1000},proposals:result,summary:result.length+' proposta(s) gerada(s) a partir de relatórios da Meta. Nenhuma ação será executada automaticamente.',limitations:['As decisões são propostas por regras, ainda não por um LLM autônomo.','As aprovações ficam armazenadas localmente neste navegador e não realizam alterações externas.','Dados de Kiwify e visitantes reais não foram conciliados nesta análise.']};
}
module.exports={analyze,validate};
