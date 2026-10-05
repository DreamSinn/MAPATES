# Deploy do Skyrim Atlas na Vercel

## 1. GitHub

```bash
git init
git add .
git commit -m "Initial Skyrim Atlas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/skyrim-atlas.git
git push -u origin main
```

O `.gitignore` exclui dependências, builds, `.vercel` e variáveis secretas.

## 2. Vercel

1. Acesse **Add New Project** na Vercel.
2. Importe o repositório do GitHub.
3. Framework preset: **Vite**.
4. Build command: `pnpm build`.
5. Output directory: `dist`.
6. Instale o projeto com pnpm ou deixe a Vercel detectar `packageManager`.
7. Publique.

O `vercel.json` já configura o fallback SPA e direciona `/api/*` para a função serverless em `api/index.ts`.

## 3. Variáveis opcionais

A API atual funciona sem banco e usa o dataset versionado:

```env
# Reservado para a próxima etapa de persistência Prisma
DATABASE_URL=mysql://usuario:senha@host:3306/skyrim_atlas
```

O Prisma ainda não é usado pelos endpoints atuais. Para ativar contas, progresso na nuvem e notas sincronizadas, será necessário executar a migração e adicionar autenticação antes de usar `DATABASE_URL` em produção.

## 4. Teste local equivalente

```bash
pnpm install
pnpm check
pnpm build
NODE_ENV=production PORT=3000 pnpm exec tsx server/index.ts
```

Depois, verifique `/`, `/api/health`, `/api/locations?map=skyrim` e `/skyrim/maps/skyrim`.
