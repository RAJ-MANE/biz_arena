# BizArena Business Logic Implementation Summary

## Overview
Successfully implemented comprehensive business logic changes for the BizArena entrepreneurship competition platform based on the new specification.

## Changes Implemented

### 1. **Database Schema Updates** (`src/db/schema.ts`)

#### New Tables Created:
- **`voterState`**: Tracks 3-NO vote limit per team
  - `teamId` (unique): Team identifier
  - `noVotesRemaining`: Counter for remaining NO votes (default: 3)
  - `updatedAt`: Last update timestamp

- **`teamApprovalRates`**: Stores Round 2 approval calculations
  - `teamId` (unique): Team identifier
  - `yesRaw`, `noRaw`: Raw vote counts
  - `yesEffective`, `noEffective`: Quiz-influenced vote counts (stored as text for precision)
  - `approvalRate`: Final approval rate A[t] in [0,1]

#### Updated Tables:
- **`quizSubmissions`**: Added normalized score fields
  - `capitalNorm`, `marketingNorm`, `strategyNorm`, `teamNorm`: Normalized category scores [0,1]
  - `quizIndex`: Overall quiz influence index Q_index[t]

### 2. **Round 1: Quiz Scoring** 

#### Updated API: `src/app/api/quiz/submit/route.ts`
- Maintains existing token calculation logic
- Raw scores stored for later normalization

#### New API: `src/app/api/quiz/calculate-normalized/route.ts`
**Admin Endpoint** - Call after all quiz submissions complete

**Logic:**
```
For each category (Capital, Marketing, Strategy, Team):
1. Clamp raw scores to [0, ∞): C[t] = max(0, C_raw[t])
2. Find max across teams: C_max = max_t C[t] (min 1 to avoid division by zero)
3. Normalize: C_norm[t] = C[t] / C_max ∈ [0,1]
4. Calculate quiz index: Q_index[t] = (C_norm + M_norm + S_norm + T_norm) / 4
```

### 3. **Round 2: Voting with 3-NO Limit**

#### Updated API: `src/app/api/votes/route.ts`

**3-NO Limit Implementation:**
```
POST /api/votes
- On first vote, initialize voterState with noVotesRemaining = 3
- When voter attempts NO:
  - If noVotesRemaining > 0: Record NO, decrement counter
  - If noVotesRemaining = 0: Force to YES (return wasForced: true)
- YES votes: No limit, always recorded as YES
- Transaction-wrapped to prevent race conditions
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded as NO" | "NO votes exhausted - vote recorded as YES",
  "vote": {...},
  "wasForced": false | true
}
```

#### New API: `src/app/api/voting/calculate-approval-rates/route.ts`
**Admin Endpoint** - Call after Round 2 completes

**Logic:**
```
Hyperparameters:
- ALPHA = 0.10 (up to +10% YES boost from Marketing)
- BETA = 0.10 (up to -10% NO reduction from Capital)

For each team:
1. Tally raw votes: Y_raw, N_raw
2. Get normalized quiz scores: M_norm, C_norm
3. Apply influence:
   Y_eff = Y_raw * (1 + ALPHA * M_norm)
   N_eff = max(0, N_raw * (1 - BETA * C_norm))
4. Calculate approval:
   A[t] = Y_eff / (Y_eff + N_eff) if denom > 0, else 0.5
```

### 4. **Round 3: Peer & Judge Ratings**

#### Updated API: `src/app/api/final/ratings/route.ts`
- **Peer rating range**: 3-10 (already correct)
- Validation: `if (rating < 3 || rating > 10)` → error

#### Updated API: `src/app/api/judges/scores/route.ts`
- **Judge score range**: 30-100 (updated)
- New validation: `if (score < 30 || score > 100)` → error

### 5. **Final Score Calculation**

#### New API: `src/app/api/final/calculate-scores/route.ts`

**Weights (Fixed):**
- w_J = 0.55 (55% Judges)
- w_P = 0.25 (25% Peers)
- w_A = 0.15 (15% Approval)
- w_Q = 0.05 (5% Quiz)

**Logic:**
```
For each team:
1. Get Q_index from quizSubmissions
2. Get A from teamApprovalRates
3. Get judge scores (30-100), calculate average J_avg
   Normalize: J_norm = (J_avg - 30) / 70 ∈ [0,1]
4. Get peer ratings (3-10), calculate average P_avg
   Normalize: P_norm = (P_avg - 3) / 7 ∈ [0,1]
5. Calculate final:
   Final_score = 0.55*J_norm + 0.25*P_norm + 0.15*A + 0.05*Q_index
6. Display scale: Final_display = Final_score * 100 ∈ [0,100]
```

**Response:**
```json
{
  "scoreboard": [
    {
      "rank": 1,
      "teamId": 1,
      "teamName": "Team Alpha",
      "components": {
        "quizIndex": "0.7500",
        "approvalRate": "0.8200",
        "judgeNorm": "0.9143",
        "peerNorm": "0.8571"
      },
      "finalScore": "0.871429",
      "finalDisplay": "87.14"
    }
  ]
}
```

### 6. **Scoreboard API** (`src/app/api/scoreboard/route.ts`)

**Completely Rewritten:**
- Uses new weighted scoring formula
- Fetches data from: quizSubmissions, teamApprovalRates, judgeScores, peerRatings
- Calculates final scores on-the-fly
- Sorts by finalScore DESC, then alphabetically by team name
- Returns comprehensive metadata including weights and formula

**Response Structure:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "teamId": 1,
      "teamName": "Team Alpha",
      "scores": {
        "quizIndex": 0.75,
        "approvalRate": 0.82,
        "judgeNorm": 0.91,
        "peerNorm": 0.86
      },
      "rawData": {
        "judgeAvg": 94.00,
        "judgeCount": 5,
        "peerAvg": 9.00,
        "peerCount": 12
      },
      "finalScore": 0.8714,
      "finalDisplay": 87.14
    }
  ],
  "metadata": {
    "weights": { "w_J": 0.55, "w_P": 0.25, "w_A": 0.15, "w_Q": 0.05 },
    "formula": "Final = 55% Judges + 25% Peers + 15% Approval + 5% Quiz",
    "explanation": {...}
  }
}
```

## Admin Workflow

### After Quiz Round (Round 1) Completes:
```bash
POST /api/quiz/calculate-normalized
```
- Calculates normalized scores for all teams
- Updates quizSubmissions with C_norm, M_norm, S_norm, T_norm, Q_index

### After Voting Round (Round 2) Completes:
```bash
POST /api/voting/calculate-approval-rates
```
- Calculates approval rates with quiz influence
- Stores in teamApprovalRates table

### During/After Final Round (Round 3):
- Judges submit scores (30-100) via `/api/judges/scores`
- Teams submit peer ratings (3-10) via `/api/final/ratings`

### View Final Scores:
```bash
GET /api/final/calculate-scores
# or
GET /api/scoreboard
```

## Key Formulas

### Round 1 (Quiz):
```
C_norm[t] = max(0, C_raw[t]) / C_max
Q_index[t] = (C_norm + M_norm + S_norm + T_norm) / 4
```

### Round 2 (Voting):
```
Y_eff = Y_raw * (1 + 0.10 * M_norm)
N_eff = max(0, N_raw * (1 - 0.10 * C_norm))
A[t] = Y_eff / (Y_eff + N_eff)
```

### Round 3 (Normalization):
```
J_norm = (J_avg - 30) / 70
P_norm = (P_avg - 3) / 7
```

### Final Score:
```
Final = 0.55*J_norm + 0.25*P_norm + 0.15*A + 0.05*Q_index
Display = Final * 100
```

## Database Migration

Schema changes pushed successfully via:
```bash
npx drizzle-kit push
```

**New columns added:**
- quizSubmissions: capitalNorm, marketingNorm, strategyNorm, teamNorm, quizIndex
- New tables: voterState, teamApprovalRates

## Testing Checklist

1. ✅ Quiz submission stores raw scores
2. ✅ Calculate normalized endpoint works
3. ✅ Voting enforces 3-NO limit
4. ✅ Approval rate calculation includes quiz influence
5. ✅ Judge scores restricted to 30-100
6. ✅ Peer ratings restricted to 3-10
7. ✅ Final score calculation uses weighted formula
8. ✅ Scoreboard displays correctly

## Notes

- All decimal values stored as TEXT in database for precision
- Transaction-wrapped vote submission prevents race conditions
- Voter state tracks NO votes remaining per team
- Approval rates recalculated after voting completes (not real-time)
- Final scores can be calculated anytime after all rounds complete
- Tiebreaker: Alphabetical order of team name

## Files Modified/Created

**Modified:**
- `src/db/schema.ts`
- `src/app/api/votes/route.ts`
- `src/app/api/judges/scores/route.ts`
- `src/app/api/scoreboard/route.ts`

**Created:**
- `src/app/api/quiz/calculate-normalized/route.ts`
- `src/app/api/voting/calculate-approval-rates/route.ts`
- `src/app/api/final/calculate-scores/route.ts`

All changes deployed to database successfully.
