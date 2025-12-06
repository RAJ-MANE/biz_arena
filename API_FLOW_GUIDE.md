# BizArena Competition API Flow Guide

## Competition Execution Flow

### 1. Setup Phase
- Teams register and create accounts
- Admin creates quiz questions with scoring for each option
- Judges register

### 2. Round 1: Quiz (30 minutes)

**Teams Submit Quiz:**
```http
POST /api/quiz/submit
Content-Type: application/json

{
  "teamId": 1,
  "answers": [
    { "questionId": 1, "optionId": 3 },
    { "questionId": 2, "optionId": 7 },
    ...
  ],
  "durationSeconds": 1200
}
```

**After All Teams Submit - Admin Calculates Normalized Scores:**
```http
POST /api/quiz/calculate-normalized
```

**Response:**
```json
{
  "message": "Normalized scores calculated successfully",
  "totalTeams": 12,
  "maxValues": { "C_max": 45, "M_max": 42, "S_max": 38, "T_max": 40 },
  "updates": [
    {
      "teamId": 1,
      "capitalNorm": "0.888889",
      "marketingNorm": "0.952381",
      "strategyNorm": "0.789474",
      "teamNorm": "0.825000",
      "quizIndex": "0.863936"
    }
  ]
}
```

### 3. Round 2: 90-Second Pitches + Voting

**Teams Cast Votes (3-NO Limit):**
```http
POST /api/votes
Content-Type: application/json

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
  "vote": { "id": 15, "fromTeamId": 1, "toTeamId": 5, "value": 1 },
  "wasForced": false  // true if NO was forced to YES due to limit
}
```

**Check Voting Status:**
```http
GET /api/votes?fromTeamId=1
```

**Response:**
```json
{
  "fromTeamId": 1,
  "votescast": [...],
  "downvoteCount": 2,
  "noVotesRemaining": 1,  // Remaining NO votes
  "votedTeams": [2, 3, 5, 7]
}
```

**After Voting Completes - Admin Calculates Approval Rates:**
```http
POST /api/voting/calculate-approval-rates
```

**Response:**
```json
{
  "message": "Approval rates calculated successfully",
  "totalTeams": 12,
  "hyperparameters": { "ALPHA": 0.10, "BETA": 0.10 },
  "approvalRates": [
    {
      "teamId": 1,
      "teamName": "Team Alpha",
      "Y_raw": 8,
      "N_raw": 2,
      "M_norm": "0.9524",
      "C_norm": "0.8889",
      "Y_eff": "8.76",
      "N_eff": "1.82",
      "approvalRate": "0.8279"
    }
  ]
}
```

### 4. Round 3: 2-Minute Pitches + Ratings

**Judges Submit Scores (30-100):**
```http
POST /api/judges/scores
Content-Type: application/json
Authorization: Bearer <judge_token>

{
  "judgeName": "Judge Smith",
  "teamId": 1,
  "score": 85  // Must be between 30-100
}
```

**Teams Submit Peer Ratings (3-10):**
```http
POST /api/final/ratings
Content-Type: application/json
Authorization: Bearer <team_token>

{
  "fromTeamId": 1,
  "toTeamId": 5,
  "rating": 8  // Must be between 3-10
}
```

### 5. Final Scores

**Calculate Final Scores:**
```http
GET /api/final/calculate-scores
```

**Response:**
```json
{
  "message": "Final scores calculated successfully",
  "totalTeams": 12,
  "weights": {
    "w_J": 0.55,
    "w_P": 0.25,
    "w_A": 0.15,
    "w_Q": 0.05
  },
  "scoreboard": [
    {
      "rank": 1,
      "teamId": 1,
      "teamName": "Team Alpha",
      "college": "MIT",
      "components": {
        "quizIndex": "0.8639",
        "approvalRate": "0.8279",
        "judgeNorm": "0.7857",
        "peerNorm": "0.7143"
      },
      "rawData": {
        "judgeAvg": "85.00",
        "judgeCount": 5,
        "peerAvg": "8.00",
        "peerCount": 11
      },
      "finalScore": "0.779518",
      "finalDisplay": "77.95"
    }
  ],
  "explanation": {
    "formula": "Final_score = 0.55*J_norm + 0.25*P_norm + 0.15*A + 0.05*Q_index"
  }
}
```

**Get Leaderboard (Same as Final Scores):**
```http
GET /api/scoreboard
```

## Score Ranges

| Component | Input Range | Normalized Range | Weight |
|-----------|-------------|------------------|--------|
| Judge Scores | 30-100 | [0, 1] | 55% |
| Peer Ratings | 3-10 | [0, 1] | 25% |
| Approval Rate | - | [0, 1] | 15% |
| Quiz Index | - | [0, 1] | 5% |

## Normalization Formulas

**Judge Scores:**
```
J_norm = (J_avg - 30) / 70
```

**Peer Ratings:**
```
P_norm = (P_avg - 3) / 7
```

**Quiz Index:**
```
Q_index = (C_norm + M_norm + S_norm + T_norm) / 4
where X_norm = max(0, X_raw) / X_max
```

**Approval Rate:**
```
Y_eff = Y_raw × (1 + 0.10 × M_norm)
N_eff = max(0, N_raw × (1 - 0.10 × C_norm))
A = Y_eff / (Y_eff + N_eff)
```

## Admin Endpoints Summary

| Endpoint | When to Call | Purpose |
|----------|--------------|---------|
| `POST /api/quiz/calculate-normalized` | After all quiz submissions | Calculate normalized quiz scores |
| `POST /api/voting/calculate-approval-rates` | After voting completes | Calculate approval rates with quiz influence |
| `GET /api/final/calculate-scores` | After Round 3 | Get final weighted scores |
| `GET /api/scoreboard` | Anytime | View current leaderboard |

## Important Notes

1. **3-NO Limit**: Each team can cast at most 3 NO votes. After exhausting NO votes, any further NO attempts are automatically converted to YES votes.

2. **Quiz Influence**: 
   - Marketing score boosts YES votes by up to 10%
   - Capital score reduces NO votes by up to 10%

3. **Weighted Scoring**: Final score heavily favors judge evaluation (55%), with peer ratings (25%), approval rate (15%), and quiz performance (5%) as supporting factors.

4. **Tiebreaker**: If teams have identical final scores, alphabetical order of team name determines rank.

5. **Database Changes**: All schema changes have been pushed to the production database. New tables and columns are ready to use.

## Testing Quick Commands

```bash
# Test quiz normalization
curl -X POST http://localhost:3001/api/quiz/calculate-normalized

# Test approval rate calculation
curl -X POST http://localhost:3001/api/voting/calculate-approval-rates

# Get final scores
curl http://localhost:3001/api/final/calculate-scores

# Get scoreboard
curl http://localhost:3001/api/scoreboard
```

## Error Handling

All endpoints return consistent error formats:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional information"
}
```

Common error codes:
- `MISSING_REQUIRED_FIELDS`: Missing required parameters
- `INVALID_RATING`: Rating outside valid range
- `INVALID_SCORE`: Score outside valid range (30-100 for judges)
- `ALREADY_VOTED`: Team already voted for this target
- `ALREADY_RATED`: Team already rated this target
- `NO_SUBMISSIONS`: No quiz submissions found
