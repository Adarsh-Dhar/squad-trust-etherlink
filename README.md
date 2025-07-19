# SquadTrust - Blockchain Team Reputation Platform

SquadTrust is a blockchain-based platform that helps teams build and verify reputation through transparent contribution tracking and smart contract verification.

## Wallet Authentication

The app uses NextAuth.js with a custom wallet provider for EVM wallet authentication. Users can connect their wallet (MetaMask, etc.) and sign messages to authenticate securely.

### Setup

1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
   - `NEXTAUTH_SECRET` - Secret key for NextAuth
3. Run migrations: `pnpm prisma migrate dev`
4. Start dev server: `pnpm dev`

## Features

- Wallet-based authentication with MetaMask
- Team management and reputation scoring
- Verifiable credentials on blockchain
- Modern UI with Tailwind CSS
