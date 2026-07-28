# 🚀 DEPLOY NO NETLIFY — PASSO A PASSO

## 1. Crie uma conta no GitHub (se ainda não tiver)
→ https://github.com → "Sign up" → conta grátis

---

## 2. Suba o código para o GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `pixelstudio`
3. Deixa em **Private** (privado)
4. Clique em **"Create repository"**
5. Siga os comandos que aparecem em "…or push an existing repository"

No terminal da sua máquina, dentro da pasta do projeto:
```
git init
git add .
git commit -m "PixelStudio primeiro deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/pixelstudio.git
git push -u origin main
```

---

## 3. Deploy na Netlify

1. Acesse https://app.netlify.com → "Sign up" com sua conta do GitHub
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Escolha **GitHub** → autorize → selecione o repositório `pixelstudio`
4. Configurações de build (já estão automáticas pelo netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Clique em **"Deploy site"**

---

## 4. ⚠️ IMPORTANTE — Variáveis de ambiente

O site vai dar erro sem isso! Após o deploy:

1. Vá em **Site configuration** → **Environment variables**
2. Clique em **"Add a variable"** e adicione cada uma abaixo:

| Chave | Valor |
|-------|-------|
| `DATABASE_URL` | (veja o arquivo .env.netlify) |
| `REACTUS_BASE_URL` | https://reactus-api.happyseeds.ai |
| `HAPPYSEEDS_PROJECT_ID` | (veja o arquivo .env.netlify) |
| `BTY_LLM_SERVER_API_KEY` | (veja o arquivo .env.netlify) |
| `HAPPYSEEDS_KEY` | (veja o arquivo .env.netlify) |
| `HAPPYSEEDS_AVAILABLE_MODELS` | claude-sonnet-4.6,doubao-seedream-5-0-260128,gpt-image-2-edit,gpt-image-2-gen |
| `REACTUS_ENV` | prod |
| `NODE_ENV` | production |

3. Após adicionar todas, clique em **"Trigger deploy"** para refazer o deploy

---

## 5. URL gratuita

A Netlify vai te dar uma URL no formato:
`https://pixelstudio-abc123.netlify.app`

Você pode renomear em: **Site configuration** → **Site details** → **Change site name**
→ Fica: `https://pixelstudio.netlify.app` ✅

---

## 6. Domínio próprio (opcional)

Se quiser `pixelstudio.com.br`:
1. Compre em https://registro.br (~R$ 40/ano)
2. Na Netlify: **Domain management** → **Add domain**
3. Siga as instruções para apontar o DNS

---

## Senha do Admin
Acesse: https://SEU-SITE.netlify.app/admin
Senha: darkdyabynho123
