# BizArena Competition - Complete Business Logic Flow

## Table of Contents
1. [Registration & Login](#registration--login)
2. [Round 1: Quiz (Startup Mindset Profile)](#round-1-quiz-startup-mindset-profile)
3. [Round 2: 90-Second Pitch + Voting](#round-2-90-second-pitch--voting)
4. [Round 3: 2-Minute Pitch + Ratings](#round-3-2-minute-pitch--ratings)
5. [Final Score Calculation](#final-score-calculation)
6. [Winner Determination](#winner-determination)
7. [Edge Cases & Auto-Handling](#edge-cases--auto-handling)

---

## Registration & Login

### Team Registration Flow

**Step 1: Initial Sign-Up**
- User navigates to `/sign-up`
- Fills registration form:
  - Username (unique)
  - Full Name
  - Team Name (unique across all teams)
  - College Name
  - Password (min 8 characters)
- **IMPORTANT**: Only ONE team leader can register per team
- Upon clicking "Sign Up", a **Rules Popup** appears with complete competition rules

**Step 2: Rules Acknowledgment**
- User must read and acknowledge the following rules before registration completes:

```
BizArena Competition Rules

COMPETITION STRUCTURE:
1. Three Rounds: Quiz (30 min) → Pitch & Voting (90 sec) → Final Pitch & Ratings (2 min)
2. All rounds are mandatory for qualification
3. Missing any round results in automatic scores (see penalties below)

ROUND 1 - QUIZ (30 Minutes):
- 15 questions testing entrepreneurial mindset
- Each answer awards/deducts tokens in 4 categories: Capital, Marketing, Strategy, Team
- Token range per category: Can be negative initially, clamped to [0, ∞) for scoring
- Scores normalized across all teams to create Quiz Influence Index (Q_index)

ROUND 2 - VOTING (90-Second Pitches):
- Each team presents 90-second pitch
- Other teams vote YES or NO
- 3-NO LIMIT: You can cast maximum 3 NO votes total
- After 3 NO votes exhausted, all further NO attempts auto-convert to YES
- Skipping a vote = Automatic YES vote (with warning)
- Marketing tokens boost YES votes (+10% max)
- Capital tokens reduce NO votes impact (-10% max)
- Final Approval Rate calculated for each team

ROUND 3 - RATINGS (2-Minute Pitches):
- Each team presents 2-minute final pitch
- Judges score: 30-100 points
- Peer teams rate: 3-10 points
- Missing peer rating = Automatic 6.5/10 rating (neutral, midpoint)
- Scores normalized for final calculation

FINAL SCORING WEIGHTS:
- Judges: 55%
- Peer Ratings: 25%
- Approval Rate (Round 2): 15%
- Quiz Index (Round 1): 5%

Formula: Final = 0.55×J_norm + 0.25×P_norm + 0.15×A + 0.05×Q_index
Display Score: Final × 100 (0-100 scale)

WINNER DETERMINATION:
- Highest final score wins
- Tiebreaker chain: Judge score > Peer score > Approval > Quiz > Alphabetical

TEAM REGISTRATION RULES:
✓ Only team leader can register
✓ One registration per team (no duplicates)
✓ All team members must be from same college
✓ Team name must be unique
✓ After registration, all team members can login with team credentials

PENALTIES & AUTO-HANDLING:
- Missed Quiz: Q_index = 0 (0% contribution to final score)
- Missed Voting: Automatic YES votes sent for all teams
- Missed Peer Rating: Automatic 6.5/10 rating (neutral midpoint, included in average)
- All penalties come with warning notifications

TIME LIMITS:
- Quiz: 30 minutes (hard limit)
- Round 2 Pitch: 90 seconds per team
- Round 3 Pitch: 2 minutes per team
- Voting/Rating windows: As announced by admin

By proceeding, you acknowledge:
1. You are the team leader authorized to register
2. You have read and understood all rules
3. You will participate in all three rounds
4. You accept automatic scoring for missed rounds
5. All information provided is accurate
```

**Step 3: Registration Completion**
- After accepting rules, account is created
- User receives JWT token
- Redirected to `/dashboard`

### Login Flow

**Team Members**
```
POST /api/auth/login
{
  "username": "team_leader_username",
  "password": "team_password"
}
```
- All team members login with same credentials
- Token issued with team information
- Redirected based on current round status

**Judges**
```
POST /api/judge/login
{
  "username": "judge_username",
  "password": "judge_password"
}
```
- Separate authentication for judges
- Access to scoring interface only

**Admins**
```
POST /api/admin/login
{
  "username": "admin_username",
  "password": "admin_password"
}
```
- Full system control
- Can manage rounds, view all data, calculate scores

---

## Round 1: Quiz (Startup Mindset Profile)

### Duration
**30 Minutes** - Hard time limit enforced

### Question Structure
- Total: 15 questions
- Each question has 4 options
- Each option has token deltas for 4 categories:

```json
{
  "questionId": 1,
  "text": "How do you approach risk in business?",
  "options": [
    {
      "id": 1,
      "text": "Avoid all risks",
      "tokenDeltaCapital": -2,
      "tokenDeltaMarketing": 0,
      "tokenDeltaStrategy": -1,
      "tokenDeltaTeam": 1
    },
    {
      "id": 2,
      "text": "Calculated risks only",
      "tokenDeltaCapital": 3,
      "tokenDeltaMarketing": 2,
      "tokenDeltaStrategy": 4,
      "tokenDeltaTeam": 3
    }
  ]
}
```

### Scoring Logic

**Step 1: Raw Score Calculation**
```
For each team t:
C_raw[t] = Σ (tokenDeltaCapital for all 15 chosen options)
M_raw[t] = Σ (tokenDeltaMarketing for all 15 chosen options)
S_raw[t] = Σ (tokenDeltaStrategy for all 15 chosen options)
T_raw[t] = Σ (tokenDeltaTeam for all 15 chosen options)
```

**Step 2: Clamp Negative Values**
```
C[t] = max(0, C_raw[t])
M[t] = max(0, M_raw[t])
S[t] = max(0, S_raw[t])
T[t] = max(0, T_raw[t])
```

**Step 3: Normalize Across Teams**
```
C_max = max(C[t] for all teams) or 1 if all zero
M_max = max(M[t] for all teams) or 1 if all zero
S_max = max(S[t] for all teams) or 1 if all zero
T_max = max(T[t] for all teams) or 1 if all zero

C_norm[t] = C[t] / C_max  ∈ [0,1]
M_norm[t] = M[t] / M_max  ∈ [0,1]
S_norm[t] = S[t] / S_max  ∈ [0,1]
T_norm[t] = T[t] / T_max  ∈ [0,1]
```

**Step 4: Calculate Quiz Influence Index**
```
Q_index[t] = (C_norm[t] + M_norm[t] + S_norm[t] + T_norm[t]) / 4.0
```

### Quiz Submission API
```http
POST /api/quiz/submit
Authorization: Bearer <team_token>

{
  "teamId": 1,
  "answers": [
    { "questionId": 1, "optionId": 3 },
    { "questionId": 2, "optionId": 7 },
    ...15 total
  ],
  "durationSeconds": 1200
}
```

**Validation:**
- ✓ Exactly 15 answers
- ✓ All questionIds and optionIds valid
- ✓ No duplicate questions
- ✓ Duration ≤ 1800 seconds (30 minutes)
- ✓ Quiz round is ACTIVE
- ✓ Team hasn't already submitted

### Admin Action After All Submissions
```http
POST /api/quiz/calculate-normalized
```
This calculates and stores normalized scores for all teams.

**Output Stored:**
- `capitalNorm`, `marketingNorm`, `strategyNorm`, `teamNorm`
- `quizIndex` (Q_index)
- Used later in Round 2 influence and final score

---

## Round 2: 90-Second Pitch + Voting

### Pitch Format
- Each team presents for **90 seconds**
- Video/live presentation (admin controlled)
- Order determined by admin

### Voting Rules

**3-NO Vote Limit (Per Team)**
Each team can cast maximum **3 NO votes** across ALL other teams.

**Voter State Tracking:**
```
Initialize per team:
no_votes_remaining = 3

When team votes:
- If vote = YES: Record YES (no limit)
- If vote = NO:
    - If no_votes_remaining > 0:
        Record NO
        no_votes_remaining -= 1
    - If no_votes_remaining = 0:
        Force to YES (automatic conversion)
        Show warning: "NO votes exhausted - voting YES"
```

**Skipped Vote Handling:**
If a team doesn't vote for another team within voting window:
- **Automatic YES vote recorded**
- Warning displayed: "You missed voting for [Team Name]. An automatic YES vote has been cast on your behalf."

### Voting API
```http
POST /api/votes
Authorization: Bearer <team_token>

{
  "fromTeamId": 1,
  "toTeamId": 5,
  "value": 1  // 1 = YES, -1 = NO
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded as YES",
  "wasForced": false,  // true if NO was forced to YES
  "noVotesRemaining": 2
}
```

**Check Voter Status:**
```http
GET /api/votes?fromTeamId=1

Response:
{
  "fromTeamId": 1,
  "noVotesRemaining": 1,
  "downvoteCount": 2,
  "votedTeams": [2, 3, 5, 7, 9]
}
```

### Approval Rate Calculation

**After All Votes Cast - Admin Action:**
```http
POST /api/voting/calculate-approval-rates
```

**Logic:**
```
Hyperparameters:
ALPHA = 0.10  // Marketing influence on YES votes
BETA = 0.10   // Capital influence on NO votes

For each team t:
1. Tally raw votes:
   Y_raw[t] = count of YES votes received
   N_raw[t] = count of NO votes received

2. Get quiz influence:
   M_norm[t] = Marketing normalized score (from Round 1)
   C_norm[t] = Capital normalized score (from Round 1)

3. Apply quiz influence:
   Y_eff[t] = Y_raw[t] × (1 + ALPHA × M_norm[t])
   N_eff[t] = max(0, N_raw[t] × (1 - BETA × C_norm[t]))

4. Calculate approval rate:
   If (Y_eff[t] + N_eff[t]) > 0:
       A[t] = Y_eff[t] / (Y_eff[t] + N_eff[t])
   Else:
       A[t] = 0.5  // Neutral if no votes
```

**Example:**
```
Team Alpha:
- Y_raw = 8 YES votes
- N_raw = 2 NO votes
- M_norm = 0.95 (high marketing)
- C_norm = 0.80 (high capital)

Calculation:
Y_eff = 8 × (1 + 0.10 × 0.95) = 8 × 1.095 = 8.76
N_eff = max(0, 2 × (1 - 0.10 × 0.80)) = 2 × 0.92 = 1.84

A = 8.76 / (8.76 + 1.84) = 8.76 / 10.60 = 0.8264

Approval Rate: 82.64%
```

### Output Stored
- `yesRaw`, `noRaw`: Raw vote counts
- `yesEffective`, `noEffective`: Influenced vote values
- `approvalRate`: A[t] value used in final score

---

## Round 3: 2-Minute Pitch + Ratings

### Pitch Format
- Each team presents for **2 minutes**
- More detailed than Round 2
- Order determined by admin

### Judge Scoring

**Requirements:**
- Score range: **30 to 100** (inclusive)
- Each judge scores each team independently
- Scores cannot be changed after submission

**API:**
```http
POST /api/judges/scores
Authorization: Bearer <judge_token>

{
  "judgeName": "Judge Smith",
  "teamId": 1,
  "score": 85
}
```

**Validation:**
- ✓ Score is integer
- ✓ 30 ≤ score ≤ 100
- ✓ Judge hasn't already scored this team
- ✓ Rating round is ACTIVE

### Peer Ratings

**Requirements:**
- Rating range: **3 to 10** (inclusive)
- Each team rates all other teams (cannot rate self)
- Ratings cannot be changed after submission

**API:**
```http
POST /api/final/ratings
Authorization: Bearer <team_token>

{
  "fromTeamId": 1,
  "toTeamId": 5,
  "rating": 8
}
```

**Validation:**
- ✓ Rating is integer
- ✓ 3 ≤ rating ≤ 10
- ✓ Cannot rate own team
- ✓ Team hasn't already rated this target team
- ✓ Rating round is ACTIVE

**Skipped Peer Rating Handling:**
If a team doesn't rate another team within rating window:
- **Automatic rating of 6.5/10 awarded (neutral midpoint)**
- Warning displayed: "You missed rating [Team Name]. An automatic neutral score of 6.5/10 has been assigned."
- Note: 6.5 is the exact midpoint of the 3-10 scale and is included in P_avg calculation

### Score Normalization

**Judge Scores (30-100 → 0-1):**
```
For each team t:
J_avg[t] = average of all judge scores for team t
J_norm[t] = (J_avg[t] - 30) / (100 - 30)
J_norm[t] = (J_avg[t] - 30) / 70

Clamp to [0,1]:
J_norm[t] = max(0, min(1, J_norm[t]))
```

**Peer Ratings (3-10 → 0-1):**
```
For each team t:
P_avg[t] = average of ALL peer ratings for team t (including auto 6.5 ratings)
P_norm[t] = (P_avg[t] - 3) / (10 - 3)
P_norm[t] = (P_avg[t] - 3) / 7

Clamp to [0,1]:
P_norm[t] = max(0, min(1, P_norm[t]))

Special case - No ratings at all:
If team received NO peer ratings (no teams rated them),
P_norm = 0.5 (neutral fallback for fairness)
```

---

## Final Score Calculation

### Formula
```
Final_score[t] = w_J × J_norm[t] + w_P × P_norm[t] + w_A × A[t] + w_Q × Q_index[t]

Where:
w_J = 0.55  (55% weight for judges)
w_P = 0.25  (25% weight for peers)
w_A = 0.15  (15% weight for approval rate)
w_Q = 0.05  (5% weight for quiz)

Sum of weights = 1.00 (100%)
```

### Display Score
```
Final_display[t] = Final_score[t] × 100

Range: 0 to 100 points
```

### API Endpoint
```http
GET /api/final/calculate-scores

Response:
{
  "scoreboard": [
    {
      "rank": 1,
      "teamId": 1,
      "teamName": "Team Alpha",
      "college": "MIT",
      "scores": {
        "quizIndex": 0.8639,      // Q_index
        "approvalRate": 0.8279,    // A
        "judgeNorm": 0.7857,       // J_norm
        "peerNorm": 0.7143         // P_norm
      },
      "rawData": {
        "judgeAvg": 85.00,
        "judgeCount": 5,
        "peerAvg": 8.00,
        "peerCount": 11
      },
      "finalScore": 0.779518,     // Weighted sum
      "finalDisplay": 77.95       // Final × 100
    }
  ],
  "weights": { "w_J": 0.55, "w_P": 0.25, "w_A": 0.15, "w_Q": 0.05 },
  "explanation": {...}
}
```

### Example Calculation
```
Team Alpha:
- Q_index = 0.8639 (Round 1)
- A = 0.8279 (Round 2)
- J_avg = 85.00 → J_norm = (85-30)/70 = 0.7857
- P_avg = 8.00 → P_norm = (8-3)/7 = 0.7143

Final_score = 0.55(0.7857) + 0.25(0.7143) + 0.15(0.8279) + 0.05(0.8639)
            = 0.4321 + 0.1786 + 0.1242 + 0.0432
            = 0.7781

Final_display = 0.7781 × 100 = 77.81 points
```

---

## Winner Determination

### Primary Criteria
**Highest Final Score Wins**

Sort teams by `Final_score` descending:
```
Rank 1: Team with highest Final_score
Rank 2: Team with second highest Final_score
...
```

### Tiebreaker
If two or more teams have identical `Final_score`:
**Alphabetical Order of Team Name**

```
Example:
- Team Alpha: 87.50
- Team Beta: 87.50
- Team Gamma: 87.50

Winner: Team Alpha (comes first alphabetically)
Second: Team Beta
Third: Team Gamma
```

### Scoreboard API
```http
GET /api/scoreboard

Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "teamName": "Team Alpha",
      "finalDisplay": 87.50,
      ...
    }
  ],
  "winnerNotes": [
    {
      "position": 1,
      "type": "tiebreaker",
      "message": "Tiebreaker applied for 1st place: Team Alpha placed above Team Beta, Team Gamma due to alphabetical order of team name.",
      "tiedScore": 0.8750,
      "tiedTeams": [
        {"name": "Team Alpha", "rank": 1},
        {"name": "Team Beta", "rank": 2},
        {"name": "Team Gamma", "rank": 3}
      ]
    }
  ]
}
```

---

## Edge Cases & Auto-Handling

### 1. Team Misses Quiz (Round 1)
**Scenario:** Team doesn't submit quiz within 30-minute window

**Automatic Action:**
```
Q_index[t] = 0
C_norm[t] = 0
M_norm[t] = 0
S_norm[t] = 0
T_norm[t] = 0
```

**Impact on Final Score:**
- Quiz contribution: 0.05 × 0 = 0 points (loses 5% of final score)
- No influence on Round 2 voting (no Marketing boost, no Capital NO reduction)

**Warning Displayed:**
"Your team did not complete the quiz. Quiz score set to 0. This affects 5% of your final score and removes voting advantages in Round 2."

### 2. Team Skips Vote in Round 2
**Scenario:** Team doesn't cast vote for another team during voting window

**Automatic Action:**
```
For each unvoted team:
  record_vote(fromTeamId, toTeamId, value=1)  // YES vote
  
Warning notification:
  "You missed voting for [Team Name]. An automatic YES vote has been cast."
```

**Implementation:**
- Backend tracks which teams each voter hasn't voted for
- When voting window closes (admin stops voting phase):
  ```http
  POST /api/voting/auto-complete
  {
    "teamId": 1  // Process missing votes for this team
  }
  ```
- System automatically inserts YES votes for all unvoted teams
- Warnings logged and displayed on dashboard

**Impact:**
- No penalty to team that skipped (YES is positive)
- Receiving team gets extra YES vote (slight advantage)

### 3. Team Misses Peer Rating in Round 3
**Scenario:** Team doesn't rate another team during rating window

**Automatic Action:**
```
For each unrated team:
  record_rating(fromTeamId, toTeamId, rating=50, isAutomatic=true)
  
Warning notification:
  "You missed rating [Team Name]. An automatic neutral score of 50 has been assigned."
```

**Special Handling:**
- 50 is NOT in normal peer rating range (3-10)
- Stored in separate `autoPeerRatings` table or flagged
- NOT included in P_avg calculation
- Treated as "neutral/no impact" on receiving team's score

**Implementation:**
```http
POST /api/rating/auto-complete
{
  "teamId": 1  // Process missing ratings for this team
}
```

**Impact on Receiving Team:**
- Auto-6.5 ratings are INCLUDED in P_avg calculation (neutral contribution)
- All ratings (manual 3-10 and auto 6.5) count toward peer score
- If team receives NO peer ratings at all, P_norm = 0.5 (neutral fallback)

### 4. Team Uses All 3 NO Votes
**Scenario:** Team has cast 3 NO votes, attempts to vote NO again

**Automatic Action:**
```
voterState.noVotesRemaining = 0

On vote attempt with value = -1:
  actualValue = 1  // Force to YES
  
Response:
{
  "success": true,
  "message": "NO votes exhausted - vote recorded as YES",
  "wasForced": true,
  "noVotesRemaining": 0
}
```

**UI Handling:**
- NO button should be disabled when noVotesRemaining = 0
- Display warning: "You have used all 3 NO votes. Only YES votes available."
- If user somehow submits NO, backend forces to YES

### 5. Judge/Peer Score Out of Range
**Scenario:** Score submitted outside valid range

**Validation:**
```
Judge score: if (score < 30 || score > 100)
  return error: "Judge score must be between 30-100"

Peer rating: if (rating < 3 || rating > 10)
  return error: "Peer rating must be between 3-10"
```

**No automatic correction** - user must resubmit within valid range

### 6. Duplicate Submission Attempts
**Scenarios:**
- Team tries to submit quiz twice
- Judge tries to score same team twice
- Team tries to vote for same team twice
- Team tries to rate same team twice

**Action:**
```
Check database for existing record:
  
If exists:
  return error: "You have already [submitted/scored/voted/rated] for this team"
  status: 409 Conflict
```

**No overwrite** - first submission is final

### 7. Self-Voting/Rating
**Scenario:** Team tries to vote/rate for themselves

**Validation:**
```
if (fromTeamId === toTeamId)
  return error: "Cannot vote/rate for your own team"
  status: 400 Bad Request
```

**Frontend Prevention:**
- Own team excluded from voting/rating lists
- Backend validation as safety check

### 8. Admin Calculation Timing
**Scenario:** Admin calculates scores before all data collected

**Validation:**
```
POST /api/quiz/calculate-normalized
  Check: All teams have submitted quiz
  If not: Warning but proceed (missing teams get Q_index=0)

POST /api/voting/calculate-approval-rates
  Check: Voting phase completed
  Auto-complete any missing votes first
  Then calculate approval rates

GET /api/final/calculate-scores
  Check: Round 3 completed
  Auto-complete any missing ratings first
  Then calculate final scores
```

### 9. Network Failure During Submission
**Scenario:** User's network drops during quiz/vote/rating submission

**Handling:**
- Frontend: Retry logic with exponential backoff
- Backend: Idempotent endpoints (duplicate request = same result)
- Database: Transaction-wrapped inserts prevent partial data

**Recovery:**
```
Frontend checks:
GET /api/quiz/submit?teamId=1
  → Returns existing submission if already submitted
  → User can verify without resubmitting
```

### 10. Time Limit Exceeded
**Scenario:** Team submits quiz after 30 minutes

**Validation:**
```
if (durationSeconds > 1800)
  return error: "Quiz submission exceeded 30-minute time limit"
  status: 400 Bad Request
```

**Consequence:**
- Submission rejected
- Team treated as "didn't submit" (Q_index = 0)

---

## System State Management

### Round Status Flow
```
Admin Controls:
1. POST /api/rounds (Create round)
2. PATCH /api/rounds/{id} (Activate round)

Round States:
- PENDING: Not started
- ACTIVE: Currently running
- COMPLETED: Finished

Transitions:
PENDING → ACTIVE (Admin starts round)
ACTIVE → COMPLETED (Admin ends round)
```

### Real-Time Updates
```
SSE Endpoints for Live Updates:
- GET /api/sse/voting (Voting phase updates)
- GET /api/sse/rating (Rating phase updates)

Events Pushed:
- Current team presenting
- Voting window open/close
- Rating window open/close
- Time remaining warnings
```

### Data Persistence
```
After Each Action:
✓ Quiz submission → quizSubmissions table
✓ Vote cast → votes table + voterState table
✓ Rating submitted → peerRatings table
✓ Judge score → judgeScores table

After Admin Calculations:
✓ Normalized quiz scores → quizSubmissions (updated)
✓ Approval rates → teamApprovalRates table
✓ Final scores → Calculated on-demand (not stored)
```

---

## Security & Validation

### Authentication Required
```
All endpoints except:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/judge/login
- POST /api/admin/login
- GET /api/health

Team Endpoints:
- Require valid JWT token
- Token includes teamId
- Validated via requireAuth() middleware

Judge Endpoints:
- Require valid judge JWT token
- Validated via requireJudgeAuth() middleware

Admin Endpoints:
- Require valid admin JWT token
- Validated via requireAdminAuth() middleware
```

### Authorization Checks
```
Teams can only:
- Submit quiz for their own team
- Vote as their own team
- Rate as their own team
- View their own team's data

Judges can only:
- Submit scores during active rating round
- View teams they're assigned to judge

Admins can:
- Everything
- Manage rounds, users, teams
- Calculate scores, export data
```

### Input Validation
```
Every API endpoint validates:
✓ Required fields present
✓ Data types correct
✓ Value ranges valid
✓ Foreign keys exist
✓ Business rules enforced

Example - Quiz Submission:
✓ teamId exists in teams table
✓ answers is array of length 15
✓ Each answer has questionId and optionId
✓ All questionIds are unique
✓ All questionIds exist in questions table
✓ All optionIds exist in options table
✓ Each optionId belongs to its questionId
✓ durationSeconds ≤ 1800
✓ Round status is ACTIVE
✓ Team hasn't already submitted
```

### Database Constraints
```
Unique Constraints:
- teams.name (no duplicate team names)
- user.username (no duplicate usernames)
- votes(fromTeamId, toTeamId) (one vote per pair)
- peerRatings(fromTeamId, toTeamId) (one rating per pair)

Check Constraints:
- judgeScores.score BETWEEN 30 AND 100
- peerRatings.rating BETWEEN 3 AND 10
- voterState.noVotesRemaining BETWEEN 0 AND 3

Foreign Keys:
- All teamId references → teams.id (CASCADE delete)
- All userId references → user.id (CASCADE delete)
```

---

## Admin Workflow Summary

### Pre-Competition
1. Create admin accounts
2. Create judge accounts
3. Create quiz questions with token deltas
4. Set up rounds (QUIZ, VOTING, FINAL)

### Competition Day - Round 1
1. Activate Quiz round: `PATCH /api/rounds/{quizId} { status: "ACTIVE" }`
2. Teams submit quizzes (30 min)
3. End Quiz round: `PATCH /api/rounds/{quizId} { status: "COMPLETED" }`
4. Calculate normalized scores: `POST /api/quiz/calculate-normalized`

### Competition Day - Round 2
1. Activate Voting round: `PATCH /api/rounds/{votingId} { status: "ACTIVE" }`
2. Start voting cycle: `POST /api/admin/voting/start-cycle`
3. For each team:
   - Present 90-second pitch
   - Open voting window (other teams vote)
   - Close voting window
4. Auto-complete missed votes: `POST /api/voting/auto-complete`
5. End Voting round: `PATCH /api/rounds/{votingId} { status: "COMPLETED" }`
6. Calculate approval rates: `POST /api/voting/calculate-approval-rates`

### Competition Day - Round 3
1. Activate Final round: `PATCH /api/rounds/{finalId} { status: "ACTIVE" }`
2. Start rating cycle: `POST /api/admin/rating/start-cycle`
3. For each team:
   - Present 2-minute pitch
   - Open rating window (judges score, peers rate)
   - Close rating window
4. Auto-complete missed ratings: `POST /api/rating/auto-complete`
5. End Final round: `PATCH /api/rounds/{finalId} { status: "COMPLETED" }`

### Post-Competition
1. Calculate final scores: `GET /api/final/calculate-scores`
2. View scoreboard: `GET /api/scoreboard`
3. Export results: `GET /api/admin/export`
4. Announce winners

---

## Verification Checklist

### Before Competition
- [ ] All teams registered successfully
- [ ] Team leader registration enforced (one per team)
- [ ] Quiz questions loaded with correct token deltas
- [ ] Judges registered and have access
- [ ] Admin can activate/deactivate rounds
- [ ] Rules popup displayed during sign-up

### After Round 1
- [ ] All teams submitted quiz or marked as missed
- [ ] Normalized scores calculated (`POST /api/quiz/calculate-normalized`)
- [ ] Q_index values stored for all teams
- [ ] Teams with missed quiz have Q_index = 0

### After Round 2
- [ ] All votes recorded or auto-completed
- [ ] 3-NO limit enforced for all teams
- [ ] Skipped votes auto-filled with YES
- [ ] Approval rates calculated (`POST /api/voting/calculate-approval-rates`)
- [ ] A[t] values stored with quiz influence applied

### After Round 3
- [ ] All judge scores within 30-100 range
- [ ] All peer ratings within 3-10 range (or auto-50)
- [ ] Skipped peer ratings auto-filled with 50
- [ ] J_norm and P_norm calculated correctly

### Final Score
- [ ] Weights sum to 1.00 (55% + 25% + 15% + 5%)
- [ ] All scores normalized to [0,1] before weighting
- [ ] Final_display on [0,100] scale
- [ ] Tiebreaker (alphabetical) applied correctly
- [ ] Scoreboard shows complete breakdown

---

## Error Messages & User Feedback

### Registration
```
✓ Success: "Registration successful! Please read the competition rules carefully."
✗ Team name taken: "This team name is already registered."
✗ Username taken: "This username is already taken."
✗ Password weak: "Password must be at least 8 characters."
```

### Quiz
```
✓ Success: "Quiz submitted successfully! Your scores will be calculated after all teams complete."
✗ Time exceeded: "Quiz submission exceeded 30-minute time limit."
✗ Already submitted: "Your team has already submitted the quiz."
✗ Round not active: "Quiz round is not currently active."
```

### Voting
```
✓ Success (YES): "Vote recorded as YES."
✓ Success (NO): "Vote recorded as NO. You have X NO votes remaining."
⚠ Forced YES: "NO votes exhausted - vote recorded as YES."
⚠ Auto YES: "You missed voting for [Team]. An automatic YES vote has been cast."
✗ Already voted: "You have already voted for this team."
✗ Self-vote: "Cannot vote for your own team."
```

### Rating
```
✓ Success: "Rating submitted successfully for [Team]."
⚠ Auto-50: "You missed rating [Team]. An automatic neutral score of 50 has been assigned."
✗ Already rated: "You have already rated this team."
✗ Self-rate: "Cannot rate your own team."
✗ Out of range: "Peer rating must be between 3-10."
```

### Judge Scoring
```
✓ Success: "Score submitted successfully for [Team]."
✗ Already scored: "You have already scored this team."
✗ Out of range: "Judge score must be between 30-100."
✗ Round not active: "Rating round is not currently active."
```

---

## Summary of Key Numbers

```
ROUND 1 - QUIZ:
- Questions: 15
- Time limit: 30 minutes (1800 seconds)
- Token range per option: -2 to +4
- Categories: 4 (Capital, Marketing, Strategy, Team)
- Weight in final: 5%

ROUND 2 - VOTING:
- Pitch duration: 90 seconds
- NO vote limit: 3 per team
- Auto-vote for skipped: YES
- Marketing influence: +10% max on YES votes
- Capital influence: -10% max on NO votes
- Weight in final: 15%

ROUND 3 - RATINGS:
- Pitch duration: 2 minutes
- Judge score range: 30-100
- Peer rating range: 3-10
- Auto-rating for skipped peer rating: 6.5/10 (neutral midpoint, included in average)
- Judge weight in final: 55%
- Peer weight in final: 25%

FINAL SCORING:
- Total weight: 100% = 55% + 25% + 15% + 5%
- Display scale: 0-100 points
- Tiebreaker: Judge score > Peer score > Approval > Quiz > Alphabetical

PENALTIES:
- Missed Quiz: Q_index = 0 (lose 5%)
- Missed Vote: Auto YES (no penalty to voter)
- Missed Peer Rating: Auto 6.5/10 (neutral, included in average)
- No peer ratings at all: P_norm = 0.5 (neutral fallback for fairness)
```

---

## Conclusion

This business logic ensures:
✓ Fair scoring across all teams
✓ Automatic handling of missed submissions
✓ Clear penalties for non-participation
✓ Quiz influence on voting outcomes
✓ Balanced weight distribution (judges > peers > approval > quiz)
✓ Deterministic tiebreaking
✓ Complete audit trail
✓ Real-time competition management

All edge cases are handled gracefully with appropriate warnings and automatic neutral scores.
