import { pgTable, integer, text, varchar, timestamp, boolean, json, serial, uniqueIndex } from 'drizzle-orm/pg-core';

// Team members table

// Admins table for dedicated admin management
export const admins = pgTable("admins", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// Judges table for dedicated judge management
export const judges = pgTable("judges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});



// Auth tables for better-auth
export const user = pgTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  token: text("token").notNull().unique(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});


// Teams
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  college: text('college').notNull(),
  // Tokens available to the team in each category. Default initialized to 3.
  tokensMarketing: integer('tokens_marketing').notNull().default(3),
  tokensCapital: integer('tokens_capital').notNull().default(3),
  tokensTeam: integer('tokens_team').notNull().default(3),
  tokensStrategy: integer('tokens_strategy').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});



// Rounds
export const rounds = pgTable('rounds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // 'QUIZ' | 'VOTING' | 'FINAL'
  day: integer('day').notNull(), // 1 | 2
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACTIVE' | 'COMPLETED'
  startsAt: timestamp('starts_at', { withTimezone: false }),
  endsAt: timestamp('ends_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Quiz questions
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  maxTokenPerQuestion: integer('max_token_per_question').notNull().default(4),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Question options
export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  tokenDeltaMarketing: integer('token_delta_marketing').notNull().default(0),
  tokenDeltaCapital: integer('token_delta_capital').notNull().default(0),
  tokenDeltaTeam: integer('token_delta_team').notNull().default(0),
  tokenDeltaStrategy: integer('token_delta_strategy').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Quiz submissions
export const quizSubmissions = pgTable('quiz_submissions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  memberCount: integer('member_count').notNull().default(5),
  answers: json('answers').notNull(), // [{questionId, optionId}]
  rawScore: integer('raw_score').notNull(), // Total score from all questions
  tokensMarketing: integer('tokens_marketing').notNull().default(0), // Original tokens earned
  tokensCapital: integer('tokens_capital').notNull().default(0),
  tokensTeam: integer('tokens_team').notNull().default(0),
  tokensStrategy: integer('tokens_strategy').notNull().default(0),
  // Remaining tokens after conversions
  remainingMarketing: integer('remaining_marketing').notNull().default(0),
  remainingCapital: integer('remaining_capital').notNull().default(0),
  remainingTeam: integer('remaining_team').notNull().default(0),
  remainingStrategy: integer('remaining_strategy').notNull().default(0),
  durationSeconds: integer('duration_seconds').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Pitches for voting round
export const pitches = pgTable('pitches', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  videoUrl: text('video_url'),
  deckUrl: text('deck_url'),
  presentedAt: timestamp('presented_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Votes in voting round
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(), // +1 or -1
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Token to votes conversions
export const tokenConversions = pgTable('token_conversions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'MARKETING' | 'CAPITAL' | 'TEAM' | 'STRATEGY'
  tokensUsed: integer('tokens_used').notNull(),
  votesGained: integer('votes_gained').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Final pitches
export const finalPitches = pgTable('final_pitches', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  presentedAt: timestamp('presented_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Peer ratings for final round
export const peerRatings = pgTable('peer_ratings', {
  id: serial('id').primaryKey(),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 3-10
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Judge scores for final evaluation
export const judgeScores = pgTable('judge_scores', {
  id: serial('id').primaryKey(),
  judgeName: text('judge_name').notNull(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  round: text('round').notNull().default('FINAL'), // 'FINAL' | 'ROUND3'
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Round 3 judge ratings (0-100) - separate from final judgeScores
export const round3JudgeRatings = pgTable('round3_judge_ratings', {
  id: serial('id').primaryKey(),
  judgeName: text('judge_name').notNull(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 0-100
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Round 3 peer ratings (3-10) - separate from final peerRatings
export const round3PeerRatings = pgTable('round3_peer_ratings', {
  id: serial('id').primaryKey(),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 3-10
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// System settings for configuration management
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Voting state (single-row canonical state for serverless-friendly timer)
export const votingState = pgTable('voting_state', {
  id: serial('id').primaryKey(),
  currentTeamId: integer('current_team_id'),
  currentTeamName: text('current_team_name'),
  pitchCycleActive: boolean('pitch_cycle_active').notNull().default(false),
  votingActive: boolean('voting_active').notNull().default(false),
  allPitchesCompleted: boolean('all_pitches_completed').notNull().default(false),
  currentPhase: text('current_phase').notNull().default('idle'),
  cycleStartTs: timestamp('cycle_start_ts', { withTimezone: false }),
  phaseStartTs: timestamp('phase_start_ts', { withTimezone: false }),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Rating state (single-row canonical state for final ratings)
export const ratingState = pgTable('rating_state', {
  id: serial('id').primaryKey(),
  currentTeamId: integer('current_team_id'),
  currentTeamName: text('current_team_name'),
  ratingCycleActive: boolean('rating_cycle_active').notNull().default(false),
  ratingActive: boolean('rating_active').notNull().default(false),
  allPitchesCompleted: boolean('all_pitches_completed').notNull().default(false),
  // Migration creates `current_phase` as nullable text; keep it nullable here to match DB.
  currentPhase: text('current_phase'),
  // Migration uses TIMESTAMPTZ; use withTimezone: true to match.
  cycleStartTs: timestamp('cycle_start_ts', { withTimezone: true }),
  phaseStartTs: timestamp('phase_start_ts', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});