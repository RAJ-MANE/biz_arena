# BizArena - Virtual Startup Simulation Platform

A modern, interactive startup simulation platform built with Next.js, Drizzle ORM, Supabase, and Tailwind CSS. Step into the founder's seat and run a virtual startup in this fast-paced **3-round competition** where teams compete through Quiz, Voting, and Finals rounds with a comprehensive weighted scoring system.

## Event Details
**Dates:** February 2nd & 3rd, 2026  
**Time:** 10:00 A.M to 1:00 P.M  
**Location:** Lab 520, 521

## **Latest Update: Production Ready with Full Mobile Responsiveness!**
- ** Complete Mobile Optimization**: Fully responsive design for mobile and tablet devices
- ** Inhouse Testing Phase**: Currently undergoing 2-3 days of comprehensive testing
- ** Bug Fixing Pipeline**: Any issues discovered during testing will be addressed before the final event
- ** Real-time WebSocket synchronization** for voting timers between admin and clients
- ** 5 Admin accounts** and **5 Judge accounts** pre-created with secure passwords
- ** Production deployment ready** for Vercel with optimized configurations
- ** 15 comprehensive quiz questions** for BizArena virtual startup simulation
- ** Weighted Scoring Formula**: 55% Judge Scores + 25% Peer Ratings + 15% Approval Votes + 5% Quiz Tokens
- ** Fair Auto-Rating**: 6.5/10 neutral rating assigned when teams don't submit peer ratings
- ** Cascading Tiebreaker**: 6-level intelligent tiebreaker system for fair ranking
- ** Idempotent Submissions**: Duplicate submissions return existing records (200) instead of errors (409)
- ** Starting Tokens**: Each team starts the quiz with 3 tokens in each category (Marketing, Capital, Team, Strategy)
- ** Concurrent Multi-User Access**: Full support for simultaneous users across all platform features
- ** Secure Authentication**: 10+ character passwords with complexity requirements

## **Current Status: Testing Phase**

The platform is currently in an intensive **inhouse testing phase** for 2-3 days to ensure:
- **Mobile Responsiveness**: All features work seamlessly on mobile and tablet devices
- **Cross-browser Compatibility**: Testing across different browsers and devices
- **Real-time Features**: WebSocket connections and live updates function properly
- **Performance Optimization**: Load testing and performance validation
- **Bug Detection**: Identifying and documenting any issues for immediate resolution
- **Concurrent Access Testing**: Verifying multi-user interactions work without conflicts
- **Scoring System Validation**: Testing weighted formula, auto-ratings, and tiebreakers
**Post-Testing**: Any bugs or issues discovered during this testing phase will be promptly fixed before the final BizArena event.


## **Production Deployment**

### Environment Variables

Create these environment variables in your production environment:

```env
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_secure_nextauth_secret_32_chars_minimum
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Database Setup for Production

```sh
# Run migrations in production
npx drizzle-kit migrate

# Seed accounts (run once after deployment)
node scripts/seed-admin-judge-accounts.js
```

## Rating-state migration & smoke tests

This project persists the final rating cycle timer into the database using a single-row canonical pattern. A small, idempotent SQL migration and helper scripts are included to create/ensure the `rating_state` table and to run quick smoke tests.
- Migration file: `drizzle/0005_add_rating_state.sql` — creates the `rating_state` table (idempotent) and seeds a canonical row if the table is empty.
- Apply script: `scripts/apply-rating-state.js` — runs the SQL against `DATABASE_URL` found in `.env.local`. The script will try a normal SSL connection first and automatically retry with permissive SSL (`rejectUnauthorized: false`) if there is a cert-chain issue.

How to run the migration locally (PowerShell):

```powershell
# Uses .env.local in the project root to read DATABASE_URL
node .\scripts\apply-rating-state.js

# Or override DATABASE_URL for a one-off run (PowerShell):
$env:DATABASE_URL='postgresql://user:pass@host:port/dbname'; node .\scripts\apply-rating-state.js
```

Quick verification queries (run in psql or your DB client):

```sql
-- Should print 1
SELECT COUNT(*) FROM rating_state;
-- Inspect canonical row
SELECT * FROM rating_state ORDER BY id LIMIT 5;
```

Smoke tests
- API smoke test: `node scripts/test-rating-api.js` — exercises `GET /api/rating/current` and admin POST actions.
- SSE smoke test: `node scripts/test-rating-sse.js` — connects to the rating SSE stream and validates broadcasts.
- Combined (npm script): `npm run test:smoke` (runs API + SSE smoke tests if present).

Safety notes
- The migration is idempotent but please snapshot/back up your production DB before running any migration.
- The apply script retries with permissive SSL for convenience when connecting to DBs with custom/self-signed certs; prefer validating cert chains in production.

## Features
- ** Authentication**: Custom username/password system with 10+ character complexity requirements
- ** Team Management**: Leader-only teams with streamlined structure
- ** Mobile-First Design**: Complete mobile and tablet responsiveness across all pages
- ** Admin Console**: Comprehensive admin panel with full platform control and business logic reference
- ** Quiz System (Round 1)**: Token-based entrepreneurial assessment with 4 scoring categories
- ** Voting Round (Round 2)**: Real-time voting for team pitches with WebSocket synchronization
- ** Finals Round (Round 3)**: Peer rating and judge scoring with comprehensive leaderboard
- ** Weighted Scoring**: 55% Judge + 25% Peer + 15% Approval + 5% Quiz = Final Score
- ** Fair Auto-Ratings**: 6.5/10 neutral rating when teams don't submit peer ratings (midpoint of 3-10 scale)
- ** Intelligent Tiebreaker**: Cascading 6-level system (Final Score → Judge → Peer → Approval → Quiz → Alphabetical)
- ** Idempotent APIs**: Submissions return existing records (200) instead of duplicate errors (409)
- ** Real-time Updates**: Server-Sent Events (SSE) for live timer synchronization
- ** Modern UI**: Glassy, responsive dashboard with theme switching
- ** Analytics**: Complete platform monitoring and statistics
- ** Database**: SQL-based schema and seeding for production deployment
- ** Pre-created Accounts**: 5 admin + 5 judge accounts ready for production
- ** Concurrent Multi-User Access**: Full support for simultaneous users across all features

## **Concurrent Multi-User Access**

The platform is designed to handle **multiple simultaneous users** across all major features without conflicts or requiring page refreshes:

### **Round 2 Voting - Full Concurrent Support**
- **Multiple Teams**: All teams can vote simultaneously during active voting periods
- **Real-time Updates**: Server-Sent Events (SSE) broadcast voting state changes instantly
- **Duplicate Prevention**: Teams can only vote once per pitch (enforced at API level)
- **No Conflicts**: Database constraints prevent race conditions between concurrent votes

### **Admin Console - Full Concurrent Support**
- **Multiple Admins**: Several administrators can manage the platform simultaneously
- **Real-time Synchronization**: Centralized timer hook keeps all admin consoles updated
- **Parallel Operations**: Round management, team updates, and user role changes work concurrently
- **Background Refresh**: UI updates immediately with background data synchronization

### ‍ **Judge Scoring - Full Concurrent Support**
- **Multiple Judges**: All judges can submit scores simultaneously during rating cycles
- **Real-time SSE**: Broadcasting of rating phase changes and timer updates
- **Duplicate Prevention**: Judges can only score each team once (API-level validation)
- **Polling Fallback**: Automatic state synchronization when SSE is unavailable

### **Finals Round - Full Concurrent Support**
- **Peer Ratings**: Qualified teams can submit peer ratings simultaneously during active phases
- **Judge Scoring**: Judges can score teams concurrently with peer rating periods
- **Real-time Updates**: SSE and polling ensure all users see rating state changes instantly
- **Qualification Validation**: Only top 5 qualified teams can participate in peer rating
- **Qualification Validation**: Only top 5 qualified teams can participate in peer rating

Note: Finals Qualification rule — the top 70% of teams by ranking qualify for the final presentation round; the bottom 30% will be eliminated.

### **Quiz System - Full Concurrent Support**
- **Multiple Teams**: All teams can take the quiz simultaneously during active periods
- **Isolated Sessions**: Each team has independent quiz experience with localStorage persistence
- **Progress Preservation**: Quiz progress survives browser refreshes and navigation
- **Duplicate Prevention**: Teams can only submit quiz once (database constraint)
- **Timer Synchronization**: Individual timers with auto-submission on expiration

### **Real-time Synchronization Architecture**
**Primary Mechanism**: Server-Sent Events (SSE) for instant updates
**Fallback System**: Polling every 2-5 seconds for state synchronization
**Centralized State**: Shared hooks provide consistent state across all user sessions
**Database Safety**: No blocking constraints - concurrent operations handled safely
**Key Benefits**:
- **No Page Refreshes Required**: Real-time updates keep all users synchronized
- **No Race Conditions**: Proper validation prevents conflicts between simultaneous actions
- **Scalable Architecture**: Supports dozens of concurrent users without performance degradation
- **Robust Fallbacks**: System continues working even if real-time connections fail

## Tech Stack
- Next.js
- Drizzle ORM
- Supabase PostgreSQL
- Tailwind CSS
- Node.js

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git for version control

### Installation Steps

1. **Clone the repository:**

 ```sh
 git clone https://github.com/pawanshettyy/BizArena-v1.git
 cd BizArena-v1
 ```
2. **Install dependencies:**

 ```sh
 npm install --legacy-peer-deps
 ```
3. **Configure environment:**
- Set up your Supabase project and get the `DATABASE_URL`
- Create a `.env.local` file and add:
 ```env
 DATABASE_URL=your_supabase_database_url
 ```
4. **Set up the database:**

 ```sh
 # Generate and push schema to database
 npx drizzle-kit generate
 npx drizzle-kit migrate
 ```
5. **Seed quiz questions (NEW!):**
- Start the dev server: `npm run dev`
- Open browser to `http://localhost:3000/admin`
- Use browser console to run the seeding script from `/scripts/admin-console-seeder.js`
- All 15 quiz questions will be automatically added to the database

### Quick Admin Access
- Navigate to `/admin` and set admin cookie: `document.cookie = "admin-auth=true"`
- Access comprehensive admin panel with quiz management, voting control, and analytics

## Scoring System

### Weighted Formula

BizArena uses a comprehensive weighted scoring system combining all competition rounds:
**Final Score = (55% × Judge) + (25% × Peer) + (15% × Approval) + (5% × Quiz)**

#### Component Breakdown:

1. **Judge Scores (55% weight)**:
- Judges score teams 30-100 points during Finals
- Sum of all judge scores received by a team
- Normalized to 0-1 scale: `J_norm = (J_avg - 30) / (100 - 30)`
 
2. **Peer Ratings (25% weight)**:
- Teams rate each other 3-10 points during Finals
- Average of all peer ratings received by a team
- Auto-rating: Teams that don't submit ratings receive **6.5/10** (neutral midpoint)
- Normalized to 0-1 scale: `P_norm = (P_avg - 3) / (10 - 3)`
- **Fair Fallback**: If no peer ratings exist for a team, `P_norm = 0.5` (neutral score)
 
3. **Approval Votes (15% weight)**:
- "YES" votes from audience during Round 2 (Voting)
- Teams can earn bonus votes by converting tokens (Round 1 quiz earnings)
- Normalized to 0-1 scale: `A_norm = min(1, A / A_max)` where A_max = max votes in competition
 
4. **Quiz Tokens (5% weight)**:
- Remaining tokens after Round 2 token conversions
- Tokens earned from 15-question entrepreneurial quiz in Round 1
- Normalized to 0-1 scale: `Q_norm = Q_remaining / Q_max` where Q_max = max possible tokens

### Cascading Tiebreaker System

When teams have identical final scores, the following 6-level tiebreaker is applied:

1. **Final Cumulative Score** (primary ranking)
2. **Judge Score Component** (J_norm)
3. **Peer Rating Component** (P_norm)
4. **Approval Vote Component** (A)
5. **Quiz Token Component** (Q_index)
6. **Alphabetical Order** (team name, last resort)

This ensures fair, deterministic rankings even in edge cases.

### Key Implementation Notes:
- **Idempotent Submissions**: Quiz answers, votes, peer ratings, and judge scores can be resubmitted without errors
- **Auto-completion**: System automatically assigns 6.5/10 peer ratings to teams that don't submit ratings
- **Transaction Safety**: All team registrations use database transactions with rollback on failure
- **Real-time Sync**: SSE (Server-Sent Events) broadcast timer and state changes instantly to all clients

## Competition Structure

BizArena is organized as a **3-round competition** where teams progress through increasingly challenging phases:

### Round 1: Quiz (Token Generation)
- **Duration**: 15 questions with time limit
- **Starting Tokens**: 3 tokens in each category (Marketing, Capital, Team, Strategy)
- **Purpose**: Test entrepreneurial knowledge and decision-making
- **Output**: Teams earn/lose tokens based on answer choices
- **Weight in Final Score**: 5% (remaining tokens after Round 2)

### Round 2: Voting (Pitch Evaluation)
- **Format**: Teams present pitches to live audience
- **Voting Mechanism**: Audience votes YES/NO for each pitch (max 3 NO votes per team)
- **Token Conversion**: Teams can spend earned tokens to gain bonus YES votes
- **Real-time Sync**: WebSocket-powered timer and state synchronization
- **Weight in Final Score**: 15% (total YES votes including token conversions)

### Round 3: Finals (Expert Evaluation)
- **Qualification**: Top 70% of teams advance (bottom 30% eliminated)
- **Peer Rating Phase**: Qualified teams rate each other (3-10 scale)
- **Judge Scoring Phase**: Judges evaluate presentations (30-100 scale)
- **Auto-rating**: Teams not submitting ratings receive 6.5/10 (neutral midpoint)
- **Weight in Final Score**: 
- Judge Scores: 55%
- Peer Ratings: 25%

### Final Ranking
All components combined using weighted formula to determine overall winner with cascading tiebreaker system.

## Scoring, Tiebreakers & Testing (Important)

This section documents the canonical scoring rules and how to test judge/team submissions locally.

### Canonical Ranking Criteria
**Final Score Formula**: 
```
Final = (55% × Judge_norm) + (25% × Peer_norm) + (15% × Approval_norm) + (5% × Quiz_norm)
```

Where:
- `Judge_norm = (J_avg - 30) / (100 - 30)` — Judge scores range 30-100
- `Peer_norm = (P_avg - 3) / (10 - 3)` — Peer ratings range 3-10
- **Auto-rating**: If team doesn't submit ratings → receives 6.5/10 (neutral midpoint)
- **Fair fallback**: If no peer ratings exist → P_norm = 0.5
- `Approval_norm = min(1, A / A_max)` — YES votes (including token conversions)
- `Quiz_norm = Q_remaining / Q_max` — Remaining tokens after conversions

### Cascading Tiebreaker (6 levels)

Used across Finals and Scoreboard pages:
1. **Final cumulative score** (primary)
2. **Judge component** (J_norm)
3. **Peer component** (P_norm)
4. **Approval component** (A)
5. **Quiz component** (Q_index)
6. **Team name alphabetical order** (last resort)

### Key Implementation Notes
- The platform treats judge and peer values as **totals** for final ranking (not averages)
- APIs return totals as authoritative values:
- `judgeScores.total` (sum of all judge scores received by team)
- `peerRating.total` (sum of all peer ratings received by team)
- For backward compatibility, some legacy responses still expose an `average` field; those fields are mapped to totals so older clients continue to display totals correctly

### How to Test Judge/Team Submissions Locally (PowerShell)
**Prerequisites:**
- Dev server running: `npm run dev` (or `npm start` for production build)
- `JWT_SECRET` environment variable set to same value used to sign test tokens
- For team-submission tests, database must contain user ID and team ID used in token
**1) Generate a judge token** (signed with `JWT_SECRET`) — run in PowerShell in project root:

```powershell
# Set secret in env (temporary in this shell); replace with your real secret
$env:JWT_SECRET = "<YOUR_JWT_SECRET>"

# Generate a judge-token JWT (1 hour expiry)
node -e "const jwt=require('jsonwebtoken'); const token=jwt.sign({ judgeId: 'judge-1', isJudge: true, exp: Math.floor(Date.now()/1000)+3600 }, process.env.JWT_SECRET); console.log(token);"
```
**2) Submit a judge score** using the cookie header (replace `<JWT>` and `teamId`):

```powershell
$jwt = "<JWT>"
$body = @{ judgeName = "Judge Alice"; teamId = 123; score = 85 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/judges/scores" -Method Post -Body $body -ContentType "application/json" -Headers @{ Cookie = "judge-token=$jwt" }
```
**Expected**: 201 created with success message (or 200 with existing record if resubmitted - idempotent)
**3) Generate an auth token** for a team user (userId must exist in DB):

```powershell
$env:JWT_SECRET = "<YOUR_JWT_SECRET>"
node -e "const jwt=require('jsonwebtoken'); const token=jwt.sign({ userId: 42, exp: Math.floor(Date.now()/1000)+3600 }, process.env.JWT_SECRET); console.log(token);"
```
**4) Submit a peer rating** as a team (replace tokens and IDs):

```powershell
$authToken = "<AUTH_JWT>"
$body = @{ fromTeamId = 10; toTeamId = 11; rating = 8 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/final/ratings" -Method Post -Body $body -ContentType "application/json" -Headers @{ Cookie = "auth-token=$authToken" }
```
**Expected**: Success if token valid, userId exists and belongs to fromTeamId, rating phase active (or 200 with existing record - idempotent)
**Notes:**
- Judge authentication (`judge-token`) validated by JWT payload (server checks `isJudge` and `judgeId`) and also allows admin users with valid `auth-token`
- Team peer submissions require valid user (in DB) — server loads user by `userId` from token and checks `authUser.team.id === fromTeamId` unless user is admin
- All submissions are **idempotent** — duplicate submissions return existing records with 200 status instead of 409 errors

## � Running the Platform

### Development Server

```sh
npm run dev
```

Access the platform at `http://localhost:3000`

### Available Routes
- `/` - Landing page and authentication
- `/dashboard` - User dashboard with quiz access
- `/quiz` - Interactive quiz with token scoring
- `/voting` - Real-time voting interface
- `/final` - Final round and results
- `/admin` - Comprehensive admin console
- `/scoreboard` - Live leaderboard and statistics

### Production Deployment

```sh
npm run build
npm start
```

## Project Structure

```
BizArena-v1/
├── src/
│ ├── app/ # Next.js app router pages
│ │ ├── admin/ # Admin console
│ │ ├── api/ # API endpoints
│ │ ├── quiz/ # Quiz interface
│ │ └── voting/ # Voting system
│ ├── components/ # Reusable UI components
│ │ └── ui/ # Shadcn/ui components
│ ├── db/ # Database configuration
│ │ ├── schema.ts # Drizzle ORM schema
│ │ └── seeds/ # Seed data scripts
│ └── lib/ # Utility functions
├── scripts/ # Database and admin scripts
├── drizzle/ # Migration files
└── public/ # Static assets
```

## Development & Deployment

### Environment Configuration

Create `.env.local` with:

```env
DATABASE_URL=your_supabase_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Management

```sh
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# View database in Drizzle Studio
npx drizzle-kit studio
```

### Admin System
- **Admin Authentication**: Cookie-based admin access
- **Full Platform Control**: Rounds, voting, teams, users, quiz management
- **Real-time Monitoring**: Live statistics and system health
- **Data Export**: Complete platform data backup functionality

## Testing the Quiz System

1. **Start Development Server**:

 ```sh
 npm run dev
 ```
2. **Access Admin Panel**:
- Navigate to `http://localhost:3000/admin`
- Set admin cookie: `document.cookie = "admin-auth=true"`
- Go to Quiz tab to verify all 15 questions are loaded
3. **Test Quiz Functionality**:
- Create a test user account
- Navigate to `/quiz` to experience the token-based scoring
- Complete quiz and view results with token distribution
4. **Verify Database**:

 ```sh
 npx drizzle-kit studio
 ```

 Check `questions` and `options` tables for complete data

## Default Admin & Judge Accounts

### Admin Accounts (5)
| Username | Password |
|----------|----------|
| admin1   | Admin@2026#1 |
| admin2   | Admin@2026#2 |
| admin3   | Admin@2026#3 |
| admin4   | Admin@2026#4 |
| admin5   | Admin@2026#5 |

**Admin Login**: `/admin/login`

### Judge Accounts (5)
| Username | Password | Name |
|----------|----------|------|
| judge1   | Judge@2026#1 | Judge One |
| judge2   | Judge@2026#2 | Judge Two |
| judge3   | Judge@2026#3 | Judge Three |
| judge4   | Judge@2026#4 | Judge Four |
| judge5   | Judge@2026#5 | Judge Five |

**Judge Login**: `/judge/login`

### Seeding Accounts
To populate the database with these accounts:
```sh
npx tsx scripts/seed-accounts.ts
```

**Note**: All passwords follow security requirements (10+ chars, uppercase, lowercase, number, special character)

### Seeding Competition Rounds
To set up the 3 competition rounds (Quiz, Voting, Final):
```sh
npx tsx scripts/seed-rounds.ts
```

**Schedule**:
- **Day 1 (Feb 2, 2026)**: QUIZ Round (10:00 AM - 1:00 PM)
- **Day 2 (Feb 3, 2026)**: VOTING Round (10:00 AM - 12:00 PM), FINAL Round (12:00 PM - 1:00 PM)

All rounds start with status 'PENDING' and can be managed through the Admin Console.

## Recent Achievements
- **15 Quiz Questions Added**: Complete BizArena virtual startup simulation quiz dataset
- **Mobile Responsiveness**: Full mobile and tablet optimization implemented
- **3-Round Competition Structure**: Quiz → Voting → Finals with comprehensive flow
- **Weighted Scoring Formula**: 55% Judge + 25% Peer + 15% Approval + 5% Quiz
- **Fair Auto-Rating System**: 6.5/10 neutral rating (midpoint) for missing peer submissions
- **Intelligent P_norm Fallback**: 0.5 default when no peer ratings exist (fairness)
- **Cascading Tiebreaker**: 6-level deterministic ranking system
- **Idempotent Submissions**: All APIs return existing records (200) instead of errors (409)
- **Admin Panel Integration**: Full quiz management + business logic reference
- **Judge Console**: Detailed scoring guidelines with 30-100 point breakdown
- **Database Seeding**: Automated question population via browser console
- **Production Ready**: Complete platform with all core features functional
- **Concurrent Access Verified**: All major pages support multiple simultaneous users without conflicts
- **Real-time Architecture**: SSE + polling system ensures live synchronization across users
- **Secure Authentication**: 10+ character passwords with complexity requirements
- **Transaction Safety**: Database rollback support for registration failures
- **Testing Phase**: Currently undergoing comprehensive inhouse testing

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
Built by Pawan Shetty for AXIOS EDIC

## License

MIT
