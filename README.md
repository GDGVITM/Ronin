# Way Of Ghost Event Platform

Full-stack event platform scaffold for:
- Round 1 coding duel elimination
- Round 2 quiz engine
- Round 3 auction finale with Bits scoring

## Stack
- Client: React + Vite + TypeScript + Tailwind + Zustand
- Server: Express + TypeScript + Socket.io
- DB: PostgreSQL + Prisma
- Code execution: Piston API

## Quick start
1. Start Docker Desktop (required for PostgreSQL).
2. From project root: `npm run db:up`
3. In `server`:
   - `cp .env.example .env` (already provided)
   - `npm run prisma:generate`
   - `npx prisma migrate dev --name init`
   - `npm run prisma:seed`
4. Run apps:
   - Backend: `npm run dev:server`
   - Frontend: `npm run dev:client`

## Main endpoints
- Auth: `/api/auth/register`, `/api/auth/login`
- Admin: `/api/admin/pending-users`, `/api/admin/users/:userId`, `/api/admin/start-round`
- Team: `/api/team/me`, `/api/team/create`, `/api/team/join`
- Problem: `/api/problem`
- Submission: `/api/submission/run`, `/api/submission/submit`
- Quiz: `/api/quiz/questions`, `/api/quiz/answer`
- Auction: `/api/auction/board`, `/api/auction/problem`, `/api/auction/bid`
- Round: `/api/round/event-state`, `/api/round/:roundNumber/matchups`, `/api/round/leaderboard/global`
