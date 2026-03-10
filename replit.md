# ScriptLabs - AI Content Strategy Platform

## Overview
An AI-powered social media content coaching platform where creators chat with a Claude-powered AI coach to analyze scripts, track video performance, and build their personalized "Virality DNA." The platform helps users grow their social media following through data-driven content strategy.

## Architecture
- **Frontend:** React SPA with TypeScript, Tailwind CSS, Shadcn UI, Wouter routing, TanStack Query
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** Replit Auth (OpenID Connect)
- **AI:** Anthropic Claude via Replit AI Integrations (streaming SSE responses)
- **Storage:** Replit Object Storage for file uploads

## Key Features
- **AI Chat Coach:** Claude-powered chatbot with streaming responses, conversation history persistence, and context-awareness of user's video library, profile, and reference scripts
- **Video Library:** CRUD for tracking video content with comprehensive metrics (views, likes, comments, shares, saves, skip rate, watch time, multi-day tracking)
- **Screenshot Metrics Extraction:** Upload analytics screenshots and Claude vision auto-fills metric fields
- **Script Lab:** Reference script library — save transcripts from creators you admire, get AI structural analysis (hook style, structure, emotion arc, tone, pacing), and the AI coach uses these patterns when helping write new content
- **Onboarding:** Quick 3-step modal for new users (niche, platforms, goals) — data fed into AI context
- **Dashboard:** Performance overview with charts and stats
- **CSV Export:** Download video data as CSV
- **Virality DNA Framework:** Built into the AI system prompt to guide content strategy

## Database Schema
- `users` - Replit Auth user profiles
- `sessions` - Auth session storage
- `videos` - Video content with performance metrics (per-user)
- `conversations` - Chat conversation threads (per-user)
- `messages` - Individual chat messages within conversations
- `user_profiles` - Niche, platforms, goals, inspiration creators, onboarding state (per-user)
- `reference_scripts` - Saved transcripts from admired creators with AI analysis (per-user)

## File Structure
- `shared/schema.ts` - Drizzle schema definitions and Zod validators
- `shared/models/auth.ts` - Auth-specific schema (users, sessions)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations
- `server/db.ts` - Database connection
- `server/replit_integrations/auth/` - Replit Auth integration
- `client/src/pages/` - Landing, Dashboard, Videos, Chat, Scripts pages
- `client/src/components/app-sidebar.tsx` - Navigation sidebar with conversation list
- `client/src/components/onboarding-modal.tsx` - New user onboarding flow
- `client/src/hooks/use-auth.ts` - Authentication hook

## API Endpoints
- `GET/POST /api/videos` - List/create videos
- `PATCH/DELETE /api/videos/:id` - Update/delete video
- `POST /api/videos/extract-metrics` - Screenshot-based metric extraction (Claude vision)
- `GET /api/videos/export` - CSV export
- `GET/PUT /api/profile` - Get/update user profile (onboarding data)
- `GET/POST /api/reference-scripts` - List/create reference scripts
- `PATCH/DELETE /api/reference-scripts/:id` - Update/delete reference script
- `POST /api/reference-scripts/:id/analyze` - AI structural analysis of a reference script
- `GET/POST /api/conversations` - List/create conversations
- `GET/DELETE /api/conversations/:id` - Get/delete conversation
- `POST /api/conversations/:id/messages` - Send message (SSE streaming)
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login
- `GET /api/logout` - Logout
