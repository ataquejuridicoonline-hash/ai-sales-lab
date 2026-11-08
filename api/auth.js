const sec=require('../lib/security');
module.exports=async function(req,res){
 if(req.method==='GET')return sec.json(res,200,{configured:sec.configured(),authenticated:sec.authenticated(req)});
 if(req.method==='DELETE'){if(!sec.sameOrigin(req))return sec.json(res,403,{error:'Origem inválida'});res.setHeader('Set-Cookie',sec.cookie('',true));return sec.json(res,200,{authenticated:false});}
 if(req.method!=='POST')return sec.json(res,405,{error:'Método não permitido'});
 if(!sec.sameOrigin(req))return sec.json(res,403,{error:'Origem inválida'});
 if(!sec.configured())return sec.json(res,503,{error:'Configure LAB_ADMIN_PASSWORD e LAB_SESSION_SECRET na Vercel (mínimo 16 e 32 caracteres).'});
 const pw=req.body?.password;
 if(typeof pw!=='string'||pw.length>512)return sec.json(res,400,{error:'Senha inválida'});
 if(!sec.equal(pw,process.env.LAB_ADMIN_PASSWORD))return sec.json(res,401,{error:'Senha incorreta'});
 res.setHeader('Set-Cookie',sec.cookie(sec.makeSession(),false));return sec.json(res,200,{authenticated:true});
};
