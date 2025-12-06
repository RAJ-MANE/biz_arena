# BizArena Competition - Quick Rules Overview

> ** Quick Reference** | For detailed business logic, see [COMPLETE_BUSINESS_LOGIC.md](./COMPLETE_BUSINESS_LOGIC.md)
---

## Competition Flow

```
REGISTRATION → QUIZ (Round 1) → VOTING (Round 2) → RATINGS (Round 3) → WINNER
 ↓ 30 min 3-NO limit 2-min pitches 
Team Leader 15 Questions YES/NO votes Judge + Peer scores 
```
---

## 3 Rounds at a Glance

### **Round 1: Quiz** (5% of final score)
- **30 minutes** to answer **15 questions**
- Better answers = Higher Q_index = Better scoring in finals
- **Missed Quiz**: Q_index = 0 (lose 5% + no voting advantages)

### **Round 2: Voting** (15% of final score)
- Vote **YES** or **NO** for other teams
- **3-NO limit**: Can only vote NO for 3 teams max
- After 3 NOs used → All further NOs auto-convert to YES
- **Skipped Vote**: Automatic YES sent (with warning)

### **Round 3: Ratings** (80% of final score combined)
- Each team presents **2-minute final pitch**
- ‍ **Judges score**: 30-100 points (**55% weight**)
- **Peer teams rate**: 3-10 points (**25% weight**)
- **Missed Peer Rating**: Automatic 6.5/10 (neutral midpoint, included in average)
---

## Final Score Formula

```
Final Score = 0.55×Judges + 0.25×Peers + 0.15×Approval + 0.05×Quiz
 (55%) (25%) (15%) (5%)

Display Score: Final × 100 (0-100 scale)
```

### Component Breakdown:
- **Judges (55%)**: Average judge score normalized from [30-100] to [0-1]
- **Peers (25%)**: Average peer rating normalized from [3-10] to [0-1]
- **Approval (15%)**: Approval rate = YES votes ÷ Total votes from Round 2
- **Quiz (5%)**: Q_index from Round 1 (answer quality, not submission time)
---

## Winner Determination
**Cascading Tiebreaker:**
1. **Highest Final Score** (primary)
2. Judge Score (if tied on final)
3. Peer Score (if still tied)
4. Approval Rate (if still tied)
5. Quiz Index (if still tied)
6. Alphabetical Team Name (last resort)
---

## Key Rules & Penalties

### Registration
 **Only team leader** can register 
 One registration per team (no duplicates) 
 Team name must be **unique** 
 All members login with **same credentials**

### Auto-Handling
| Missed Action | Auto-Response | Impact |
|--------------|---------------|--------|
| **Quiz** | Q_index = 0 | Lose 5% + no voting advantages |
| **Vote (Round 2)** | Auto YES | No penalty to voter, warning shown |
| **Peer Rating (Round 3)** | Auto 6.5/10 | Neutral midpoint, included in average |
| **3 NO votes used** | NO → YES | Further NOs auto-convert to YES |

### Important Notes
- All submissions are **final** (no edits allowed)
- Cannot vote for **own team**
- Cannot rate **own team**
- Duplicate submissions return existing record (idempotent)
- **No peer ratings at all**: P_norm = 0.5 (neutral fallback for fairness)
---

## Visual Scoring Weights

```
┌─────────────────────────────────────────────────────────┐
│ FINAL SCORE COMPOSITION (100%) │
├─────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████ 55% │ Judges
│ ██████████████████████ 25% │ Peer Ratings
│ █████████████ 15% │ Approval Rate
│ ████ 5% │ Quiz Index
└─────────────────────────────────────────────────────────┘
```
---

## Quick Tips

 **For Teams:**
- Focus on correct answers for better Q_index
- Use your 3 NO votes strategically
- Rate all peer teams to avoid auto-6.5
- Prepare strong 2-minute pitch

 **For Judges:**
- Score each team once (30-100 range)
- Duplicate submissions return existing score (idempotent)
- First score submitted is the one counted

 **For Judges:**
- Score range: 30-100 points
- Can score teams multiple times (updates existing score)
- All judge scores are averaged per team

 **For Participants:**
- Read full business logic for edge cases
- All times are strict deadlines
- Duplicate submissions are safe (idempotent)
- Respect professional conduct during pitches
---
**Need more details?** See [COMPLETE_BUSINESS_LOGIC.md](./COMPLETE_BUSINESS_LOGIC.md) for comprehensive documentation including:
- Detailed API endpoints
- Edge case handling
- Database schema
- Authentication flows
- SSE event streaming
- Error codes and messages
---

*Last Updated: After fixing auto-peer rating system (50 → 6.5) and implementing cascading tiebreaker*
