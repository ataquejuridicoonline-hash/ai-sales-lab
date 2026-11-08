'use strict';
const sec=require('../lib/security');
const {analyze}=require('../lib/decision-engine');
module.exports=async function(req,res){
 if(req.method!=='GET')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.authenticated(req))return sec.json(res,401,{error:'Sessão necessária'});
 try{
  const raw=process.env.LAB_META_SNAPSHOT;
  if(!raw)return sec.json(res,503,{error:'Aguardando relatório Supermetrics na Vercel para fundamentar propostas.'});
  const report=JSON.parse(raw);
  const result=analyze(report);
  return sec.json(res,200,result);
 }catch(err){return sec.json(res,503,{error:'Não foi possível validar os dados para gerar decisões. O relatório foi preservado.'});}
};
