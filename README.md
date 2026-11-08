# AI SALES LAB — MVP de gestão de agentes

Central inicial de operações de marketing para o e-book **Air Fryer Todo Dia — 150 Receitas Fáceis**.

## O que funciona

- Interface responsiva para visão geral, três agentes (JARVIS, ATLAS e CASH), tarefas, aprovações e integrações.
- Inclusão e conclusão de tarefas no navegador.
- Registro **interno** de aprovações ou rejeições. **Nenhuma ação é executada** na Meta, Kiwify ou GitHub.
- Estado local persistido em `localStorage` no navegador, sem sincronização entre dispositivos.
- Métricas exibidas são **históricas**, com data e ressalva, **não são sincronizadas**.

## O que ainda não funciona

- Autenticação e permissões de usuários.
- Banco de dados compartilhado e trilha de auditoria no servidor.
- Leitura live de Meta Ads, Kiwify, Vercel Analytics ou Microsoft Clarity.
- Agentes executando modelos de IA ou tarefas automáticas dentro desta aplicação.

**Importante:** não cadastrar dados pessoais, senhas, chaves de API ou decisões confidenciais nesta versão. Não coloque tokens no JavaScript público.

## Teste local

Com Python 3 na pasta do projeto:

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`.

## Publicar com Vercel e GitHub

1. Crie um repositório privado `ai-sales-lab` na conta GitHub desejada.
2. Envie `index.html`, `styles.css`, `app.js`, `README.md`, `.gitignore` e `vercel.json` para a raiz do repositório.
3. Importe o repositório em **Vercel → Add New → Project**. Escolha Framework Preset **Other**.
4. Configure **Deployment Protection** antes de usar com dados reais.
5. Realize o deploy e confira a URL exibida pela Vercel. Não presuma endereço sem verificação.
6. Em etapa posterior, implemente autenticação, APIs server-side e banco de dados; então substitua os valores históricos por dados autorizados.

## Segurança e governança

- Aplicação de demonstração; não pronta para uso com dados sensíveis.
- Não há automação de mudança em orçamento, anúncios ou site.
- A versão de demonstração mantém apenas informações de planejamento no navegador.
- As APIs da Meta e Kiwify exigem autenticação no servidor, com variáveis de ambiente protegidas.

## Dados históricos no painel

Valores de referência consultados em 08/11/2026: investimento R$ 43,68, uma compra atribuída, R$ 15,62 líquidos estimados da venda, resultado depois de mídia de -R$ 28,06. Esses números NÃO representam acompanhamento ao vivo.

## Versão 2 — autenticação e dados reais

O painel usa uma sessão privada de 8 horas assinada por HMAC e armazenada em cookie HttpOnly, Secure e SameSite Strict, de escopo /api. O HTML estático é publicamente disponível, mas o login impede sua visualização usual e toda API com métricas reais retorna HTTP 401 sem uma sessão válida. **Para proteger também os arquivos estáticos na borda, habilite Deployment Protection / Vercel Authentication no projeto antes de colocar dados confidenciais**, especialmente para equipes.

### Variáveis privadas da Vercel

Acesse Vercel → ai-sales-lab → Settings → Environment Variables, escolha Production (e Preview somente quando necessário):

- `LAB_ADMIN_PASSWORD`: senha **nova, exclusiva para AI SALES LAB** (mínimo de 16 caracteres).
- `LAB_SESSION_SECRET`: segredo aleatório de sessão com 32+ caracteres, diferente da senha. Gere com gerenciador de senhas ou `openssl rand -hex 32`.
- `LAB_META_ACCESS_TOKEN`: token Meta Marketing API com permissão de **leitura de anúncios** na conta `act_810330994745301`. Não adicione permissões de modificação ou coloque o token neste repositório.
- `LAB_NET_PER_SALE` (opcional): contribuição líquida estimada por venda antes de mídia, padrão `15.62`. Não equivale à conciliação financeira.

Salve as variáveis no projeto **ai-sales-lab**, não no projeto de vendas `receita-jade`. Faça um novo deploy em Production após configurar/alterar variáveis. Nunca cole segredos em chat, arquivos GitHub, HTML ou prints.

### Endpoints

- `GET /api/auth`: informa se a aplicação está configurada e se a sessão é válida.
- `POST /api/auth`: recebe JSON `{"password":"..."}`; em caso de sucesso define cookie assinado.
- `DELETE /api/auth`: encerra a sessão.
- `GET /api/metrics`: **somente com sessão**, consulta a Meta Graph Marketing API na campanha `120252293321330531`, período padrão de 05/11/2026 até hoje; aceita `?since=YYYY-MM-DD&until=YYYY-MM-DD` limitado a 90 dias.

O token fica somente no servidor; os números são atribuições da Meta, não vendas certificadas pela Kiwify. As leituras não autorizam mudanças de campanha.

### Situação das integrações

- Meta Ads: implementada no código, **aguardando token de leitura e teste de produção**.
- Kiwify: pendente de autenticação/consulta oficial para conciliar pagamentos reais; CASH apresenta apenas estimativas Meta.
- Clarity e Vercel Analytics: pendentes de leitura integrada neste painel.
- Tarefas e aprovações: armazenadas localmente no navegador; ainda não são ações remotas nem aprovação com auditoria centralizada.
- Os agentes são regras de diagnóstico e interface de trabalho, **não serviços autônomos com modelos de IA executando em segundo plano**.

### Cuidados e limitações

- Para acesso de produção, ative proteção por autenticação da Vercel no projeto, além do login de API. O repositório deve ser privado quando for conter documentação interna.
- O login por senha compartilhada exige uma proteção contra força bruta (Vercel Firewall/WAF) antes de ampla exposição.
- O endpoint de métricas faz consultas em tempo real, não histórico persistido e não possui cobrança/alertas periódicos próprios.
- Nunca deduza que cliques sem PageView provam carregamento defeituoso; consentimento, atribuição e bloqueadores também influenciam.
