-- Add unique constraint to prevent duplicate votes
ALTER TABLE votes 
ADD CONSTRAINT unique_vote_per_team_pair 
UNIQUE (from_team_id, to_team_id);

-- Add check constraint for peer ratings range (3-10)
ALTER TABLE peer_ratings 
ADD CONSTRAINT check_peer_rating_range 
CHECK (rating >= 3 AND rating <= 10);

-- Add check constraint for round3 peer ratings range (3-10)
ALTER TABLE round3_peer_ratings 
ADD CONSTRAINT check_round3_peer_rating_range 
CHECK (rating >= 3 AND rating <= 10);

-- Add check constraint for round3 judge ratings range (0-100)
ALTER TABLE round3_judge_ratings 
ADD CONSTRAINT check_round3_judge_rating_range 
CHECK (rating >= 0 AND rating <= 100);

-- Add check constraint for judge scores
ALTER TABLE judge_scores 
ADD CONSTRAINT check_judge_score_range 
CHECK (score >= 0);

-- Add check constraint for vote values (-1 or 1 only)
ALTER TABLE votes 
ADD CONSTRAINT check_vote_value 
CHECK (value IN (-1, 1));

-- Add check constraint to prevent negative token balances
ALTER TABLE quiz_submissions 
ADD CONSTRAINT check_remaining_marketing_positive 
CHECK (remaining_marketing >= 0);

ALTER TABLE quiz_submissions 
ADD CONSTRAINT check_remaining_capital_positive 
CHECK (remaining_capital >= 0);

ALTER TABLE quiz_submissions 
ADD CONSTRAINT check_remaining_team_positive 
CHECK (remaining_team >= 0);

ALTER TABLE quiz_submissions 
ADD CONSTRAINT check_remaining_strategy_positive 
CHECK (remaining_strategy >= 0);

-- Add index for better query performance on votes
CREATE INDEX IF NOT EXISTS idx_votes_from_team ON votes(from_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_to_team ON votes(to_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_value ON votes(value);

-- Add index for token conversions
CREATE INDEX IF NOT EXISTS idx_token_conversions_team ON token_conversions(team_id);

-- Add index for quiz submissions
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_team ON quiz_submissions(team_id);

-- Add index for peer ratings
CREATE INDEX IF NOT EXISTS idx_peer_ratings_from_team ON peer_ratings(from_team_id);
CREATE INDEX IF NOT EXISTS idx_peer_ratings_to_team ON peer_ratings(to_team_id);

-- Add index for judge scores
CREATE INDEX IF NOT EXISTS idx_judge_scores_team ON judge_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge ON judge_scores(judge_name);
