# ShelbyScout

ShelbyScout is a football talent discovery platform powered by Shelby storage. Players can create rich scouting profiles, upload highlight videos, training clips, and profile pictures, while scouts can browse players and stream uploaded clips directly from player profiles.

The project is focused on helping emerging football talent, especially across Africa, get discovered through fast media distribution, clear player data, and a short-video scouting experience.

## Features

- Player and scout account signup/signin
- Aptos wallet integration with Petra via Aptos Wallet Adapter
- Player profile management
- One-time locked age and nationality fields
- Profile picture upload through Shelby storage
- Multiple video uploads to Shelby storage
- Streamable Shelby video URLs
- Player-owned video edit/delete controls
- Scout discovery dashboard
- Full scout-facing player profile pages
- Embedded video streaming for scouts
- Shelby proof/status display for uploaded media

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Prisma
- SQLite for local development
- NextAuth credentials auth
- Shelby Protocol SDK
- Aptos TypeScript SDK
- Aptos Wallet Adapter

## Local Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cd shelbyscout
copy .env.example .env.local
```

On macOS/Linux, use:

```bash
cp .env.example .env.local
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Create/update the local database:

```bash
npx prisma db push
```

Start the development server from the workspace root:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment Variables

Do not commit `.env`, `.env.local`, private keys, API keys, or production database URLs.

Use `.env.example` as the template:

```env
DATABASE_URL=file:./dev.db
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
SHELBY_NETWORK=SHELBYNET
SHELBY_API_KEY=replace-with-your-shelby-api-key
SHELBY_FULLNODE_URL=https://api.shelbynet.shelby.xyz/v1
SHELBY_PRIVATE_KEY=ed25519-priv-0x_replace_with_testnet_private_key
```

For deployment, add these values in your hosting provider's environment variable settings instead of committing `.env` to GitHub.

## Main Routes

- `/` - homepage with trending players and clips
- `/signup` - create player or scout account
- `/signin` - login
- `/dashboard` - scout discovery dashboard
- `/profile` - player profile management
- `/upload` - player video upload and video management
- `/players/[id]` - scout-facing player profile and video streaming

## Important Security Note

Never commit real values for:

- `SHELBY_API_KEY`
- `SHELBY_PRIVATE_KEY`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` for production databases

If a private key or API key has already been pushed to a public repository, rotate it before using the project in production.

## Deployment Notes

When deploying:

1. Push the code to GitHub without `.env`.
2. In Vercel, set the project root directory to `shelbyscout`.
3. Add the required environment variables in Vercel Project Settings.
4. Use a production database instead of local SQLite.
5. Set `NEXTAUTH_URL` to the deployed site URL.
6. Redeploy after changing environment variables.

Required Vercel variables:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SHELBY_NETWORK=
SHELBY_API_KEY=
SHELBY_FULLNODE_URL=
SHELBY_PRIVATE_KEY=
```

## Current Limitations

- Scouts can browse and stream players, but shortlist, notes, ratings, and messaging are not implemented yet.
- Deleting a video removes the ShelbyScout database record, but does not delete the underlying Shelby blob.
- Local development uses SQLite; production should use a managed database.
