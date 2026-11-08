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