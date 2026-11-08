(function(){
'use strict';
const AGENTS=[
 {id:'JARVIS',title:'Diretor de operações',icon:'✳',about:'Consolida as recomendações dos outros agentes, prioriza o trabalho e pede aprovação antes de executar qualquer ação externa.',abilities:['Planejar tarefas e processos','Revisar recomendações','Solicitar aprovações']},
 {id:'ATLAS',title:'Gestor de tráfego',icon:'↗',about:'Avalia Meta Ads, anúncios, posicionamentos, custo de aquisição e possíveis falhas na qualidade do tráfego.',abilities:['Analisar métricas de aquisição','Investigar qualidade de cliques','Sugerir testes de anúncios']},
 {id:'CASH',title:'Auditor financeiro',icon:'◈',about:'Concilia mídia, custos e vendas aprovadas para impedir otimizações que geram cliques baratos e prejuízo.',abilities:['Calcular CPA e margem','Monitorar gasto e orçamento','Sinalizar prejuízos e anomalias']}
];
const INTEGRATIONS=[
 {name:'Meta Ads',details:'Dados de campanhas, posicionamentos, cliques e compras atribuídas.',status:'Relatório Supermetrics privado sincronizado; leitura automática pendente'},
 {name:'Kiwify',details:'Vendas aprovadas, reembolsos e taxas. Exige API de servidor validada.',status:'Consulta pelo código já existente, sem armazenar novo token'},
 {name:'Microsoft Clarity',details:'Comportamento e rolagem de visitantes que consentiram.',status:'Não conectada a este painel'},
 {name:'Vercel Analytics',details:'Visitas de página em medição independente do Meta Pixel.',status:'Não conectada a este painel'},
 {name:'GitHub',details:'Histórico versionado da aplicação, com publicação controlada.',status:'GitHub e deploy de produção conectados'},
 {name:'Supabase',details:'Banco persistente para tarefas, métricas, permissões e auditoria.',status:'Ainda não configurado'}
];
const agentHealth={
 JARVIS:{label:'Regras prontas',detail:'As recomendações são geradas por regras; não é uma IA autônoma.'},
 ATLAS:{label:'Aguardando relatório',detail:'Aguardando validação dos dados do Supermetrics.'},
 CASH:{label:'Estimativa de mídia',detail:'Aguardando conciliação Kiwify para validar receita efetiva.'}
};
window.AISalesLabSetAgentHealth=function(id,label,detail){
 if(!agentHealth[id])return;
 agentHealth[id]={label:String(label||'').slice(0,80),detail:String(detail||'').slice(0,220)};
 renderAgents();
};
function renderAgents(){
 const mini=document.querySelector('#agent-mini'),grid=document.querySelector('#agent-grid');
 if(!mini||!grid)return;
 mini.replaceChildren();grid.replaceChildren();
 AGENTS.forEach(a=>{
  const health=agentHealth[a.id];
  const row=h('div','agent-mini-item'),ico=h('div','agent-icon',a.icon),txt=h('div');
  txt.append(h('strong','',a.id),h('small','',a.title));row.append(ico,txt,h('span','pill',health.label));mini.append(row);
  const card=h('article','agent-card'),icon=h('div','agent-big-icon',a.icon);
  card.append(icon,h('p','eyebrow','AGENTE '+a.id),h('h2','',a.title),h('p','',a.about));
  const list=h('ul');a.abilities.forEach(v=>list.append(h('li','',v)));card.append(list);
  card.append(h('span','pill',health.label),h('p','agent-detail',health.detail));grid.append(card);
 });
}
const STORAGE='aisaleslab_v1';
const initial={tasks:[
 {id:'t1',title:'Validar Vercel Analytics após publicação',owner:'ATLAS',description:'Comparar as visitas reais registradas com os cliques de saída da Meta no mesmo período.',done:false},
 {id:'t2',title:'Conferir recebimento do Purchase na Kiwify',owner:'CASH',description:'Validar compras aprovadas, taxas e recebimentos antes de calcular ROI.',done:false},
 {id:'t3',title:'Definir limite de risco do próximo teste',owner:'JARVIS',description:'Elaborar proposta de teto de investimento e submeter à aprovação.',done:false}
],approvals:[{id:'a1',title:'Testar novos anúncios somente após validar a medição',owner:'JARVIS',description:'Proposta para criar teste controlado sem aumentar o orçamento, sujeita a aprovação humana e execução separada.',status:'pending'}]};
function safeLoad(){try{const data=JSON.parse(localStorage.getItem(STORAGE));if(data&&Array.isArray(data.tasks)&&Array.isArray(data.approvals))return data;}catch(e){}return structuredClone(initial);}
let state=safeLoad(),filter='all',entityType='task';
window.AISalesLabQueueProposal=function(proposal,report){
 if(!proposal||typeof proposal.id!=='string'||!report||typeof report.reportFetchedAt!=='string')return {ok:false,error:'Proposta inválida'};
 const current=state.approvals.find(a=>a.proposalId===proposal.id);
 if(current)return {ok:false,error:current.status==='pending'?'Esta proposta já está pendente de aprovação.':'Já existe uma decisão registrada para esta proposta neste navegador.'};
 const evidence=String(proposal.evidence||'').slice(0,750);
 const limits=String(proposal.limitations||'').slice(0,450);
 const description=[String(proposal.action||'').slice(0,450),'Justificativa: '+String(proposal.rationale||'').slice(0,550),'Evidência: '+evidence,'Limitação: '+limits,'Fonte: '+report.source,'Relatório: '+report.reportFetchedAt].join('\n\n');
 state.approvals.push({id:'jarvis-'+proposal.id,proposalId:proposal.id,title:'JARVIS · '+String(proposal.title||'Proposta').slice(0,100),owner:String(proposal.owner||'JARVIS'),description,status:'pending',source:'JARVIS',approvedForExecution:false,createdAt:new Date().toISOString(),reportFetchedAt:report.reportFetchedAt});
 store();render();show('approvals');return {ok:true};
};

const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
function h(tag,cls,text){let n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function store(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){}}
function show(view){$$('.view').forEach(x=>x.classList.add('hidden'));$('#view-'+view).classList.remove('hidden');$$('.nav').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$('#breadcrumb').textContent=({overview:'VISÃO GERAL',agents:'AGENTES',tasks:'TAREFAS',approvals:'APROVAÇÕES',integrations:'INTEGRAÇÕES'})[view];$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});}
function taskRow(task,compact){const row=h('div','task-row'+(task.done?' is-done':''));const check=h('input');check.type='checkbox';check.checked=!!task.done;check.setAttribute('aria-label','Concluir '+task.title);check.addEventListener('change',()=>{task.done=check.checked;store();render();});const body=h('main');body.append(h('b','',task.title),h('span','',task.owner+' · '+(task.done?'Concluída':'Aberta')));if(!compact&&task.description)body.append(h('small','',task.description));row.append(check,body);return row;}
function render(){
 const open=state.tasks.filter(t=>!t.done).length;
 $('#task-counter').textContent=String(open);$('#approval-counter').textContent=String(state.approvals.filter(a=>a.status==='pending').length);
 renderAgents();
 const overview=$('#overview-tasks');overview.replaceChildren();state.tasks.slice(0,4).forEach(t=>overview.append(taskRow(t,true)));
 if(!state.tasks.length)overview.append(h('p','empty','Sem tarefas cadastradas.'));
 const tasklist=$('#task-list');tasklist.replaceChildren();const filtered=state.tasks.filter(t=>filter==='all'||(filter==='done'?t.done:!t.done));if(!filtered.length)tasklist.append(h('p','empty','Nenhuma tarefa nesta visualização.'));filtered.forEach(t=>tasklist.append(taskRow(t,false)));

 const apps=$('#approval-list');apps.replaceChildren();if(!state.approvals.length)apps.append(h('p','empty','Sem solicitações.'));
 state.approvals.slice().reverse().forEach(a=>{let card=h('article','approval-card'),top=h('div','approval-top'),headline=h('h2','',a.title);top.append(headline,h('span','pill',a.status==='pending'?'Pendente':a.status==='approved'?'Aprovada internamente':'Rejeitada'));card.append(top,h('p','',a.description||'Sem descrição.'),h('div','eyebrow','RESPONSÁVEL: '+a.owner));if(a.status==='pending'){let acts=h('div','approval-actions');let accept=h('button','button primary','Aprovar internamente'),reject=h('button','button tertiary','Rejeitar');accept.addEventListener('click',()=>{a.status='approved';store();render();});reject.addEventListener('click',()=>{a.status='rejected';store();render();});acts.append(accept,reject);card.append(acts);}if(a.source==='JARVIS')card.append(h('small','approval-disclaimer','Aprovação de análise: registro local. Não autoriza nem executa mudanças externas.'));apps.append(card);});
 const integr=$('#integration-grid');integr.replaceChildren();INTEGRATIONS.forEach(i=>{let card=h('article','integration-card');card.append(h('strong','',i.name),h('p','',i.details),h('span','pill',i.status));integr.append(card);});
}
$$('.nav').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
$$('[data-target]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.target)));
$$('.filter').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('.filter').forEach(x=>x.classList.toggle('active',x.dataset.filter===filter));render();}));
function openModal(type,defaults){entityType=type;$('#modal-eyebrow').textContent=type==='task'?'EXECUÇÃO':'GOVERNANÇA';$('#modal-title').textContent=type==='task'?'Nova tarefa':'Solicitar aprovação';$('#entity-form').reset();if(defaults){$('#entity-title').value=defaults.title;$('#entity-owner').value=defaults.owner;$('#entity-description').value=defaults.description;}$('#form-modal').showModal();}
$$('[data-action]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.action==='new-task')openModal('task');if(b.dataset.action==='new-approval')openModal('approval');if(b.dataset.action==='diagnostic'){openModal('task',{title:'Auditar cliques de saída versus visitas reais',owner:'ATLAS',description:'Comparar Meta Ads, Vercel Analytics e Clarity; investigar bloqueios e origens com baixa qualidade de tráfego.'});}}));
$('#entity-form').addEventListener('submit',ev=>{ev.preventDefault();const title=$('#entity-title').value.trim(),owner=$('#entity-owner').value,description=$('#entity-description').value.trim();if(!title)return;const id=String(Date.now())+'-'+Math.random().toString(36).slice(2,7);if(entityType==='task')state.tasks.push({id,title,owner,description,done:false});else state.approvals.push({id,title,owner,description,status:'pending'});store();$('#form-modal').close();render();show(entityType==='task'?'tasks':'approvals');});
$('#modal-close').addEventListener('click',()=>$('#form-modal').close());$('#modal-cancel').addEventListener('click',()=>$('#form-modal').close());$('#mobile-toggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
render();
})();