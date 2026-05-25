# ShelbyScout

ShelbyScout is a football talent discovery platform powered by Shelby storage. Players create profiles and upload football clips, while scouts browse talent and stream videos directly from the web app.

The Next.js project lives in [`shelbyscout`](./shelbyscout).

## Quick Start

```bash
npm install
cd shelbyscout
copy .env.example .env
npm run prisma:generate
npx prisma db push
cd ..
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Secrets

Do not commit `.env`. Add real environment variables in your deployment provider instead.

See [`shelbyscout/README.md`](./shelbyscout/README.md) for full setup, environment variables, routes, and deployment notes.
