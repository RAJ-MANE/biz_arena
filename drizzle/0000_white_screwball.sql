CREATE TABLE "account" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "final_pitches" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"presented_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"judge_name" text NOT NULL,
	"team_id" integer NOT NULL,
	"score" integer NOT NULL,
	"round" text DEFAULT 'FINAL' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judges" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "judges_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"text" text NOT NULL,
	"order" integer NOT NULL,
	"token_delta_marketing" integer DEFAULT 0 NOT NULL,
	"token_delta_capital" integer DEFAULT 0 NOT NULL,
	"token_delta_team" integer DEFAULT 0 NOT NULL,
	"token_delta_strategy" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_team_id" integer NOT NULL,
	"to_team_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pitches" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"video_url" text,
	"deck_url" text,
	"presented_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"order" integer NOT NULL,
	"max_token_per_question" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"member_count" integer DEFAULT 5 NOT NULL,
	"answers" json NOT NULL,
	"raw_score" integer NOT NULL,
	"tokens_marketing" integer DEFAULT 0 NOT NULL,
	"tokens_capital" integer DEFAULT 0 NOT NULL,
	"tokens_team" integer DEFAULT 0 NOT NULL,
	"tokens_strategy" integer DEFAULT 0 NOT NULL,
	"remaining_marketing" integer DEFAULT 0 NOT NULL,
	"remaining_capital" integer DEFAULT 0 NOT NULL,
	"remaining_team" integer DEFAULT 0 NOT NULL,
	"remaining_strategy" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rating_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"current_team_id" integer,
	"current_team_name" text,
	"rating_cycle_active" boolean DEFAULT false NOT NULL,
	"rating_active" boolean DEFAULT false NOT NULL,
	"all_pitches_completed" boolean DEFAULT false NOT NULL,
	"current_phase" text,
	"cycle_start_ts" timestamp with time zone,
	"phase_start_ts" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round3_judge_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"judge_name" text NOT NULL,
	"team_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round3_peer_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_team_id" integer NOT NULL,
	"to_team_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"day" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"college" text NOT NULL,
	"tokens_marketing" integer DEFAULT 3 NOT NULL,
	"tokens_capital" integer DEFAULT 3 NOT NULL,
	"tokens_team" integer DEFAULT 3 NOT NULL,
	"tokens_strategy" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "token_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"category" text NOT NULL,
	"tokens_used" integer NOT NULL,
	"votes_gained" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"team_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_team_id" integer NOT NULL,
	"to_team_id" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"current_team_id" integer,
	"current_team_name" text,
	"pitch_cycle_active" boolean DEFAULT false NOT NULL,
	"voting_active" boolean DEFAULT false NOT NULL,
	"all_pitches_completed" boolean DEFAULT false NOT NULL,
	"current_phase" text DEFAULT 'idle' NOT NULL,
	"cycle_start_ts" timestamp,
	"phase_start_ts" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "final_pitches" ADD CONSTRAINT "final_pitches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_ratings" ADD CONSTRAINT "peer_ratings_from_team_id_teams_id_fk" FOREIGN KEY ("from_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_ratings" ADD CONSTRAINT "peer_ratings_to_team_id_teams_id_fk" FOREIGN KEY ("to_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitches" ADD CONSTRAINT "pitches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round3_judge_ratings" ADD CONSTRAINT "round3_judge_ratings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round3_peer_ratings" ADD CONSTRAINT "round3_peer_ratings_from_team_id_teams_id_fk" FOREIGN KEY ("from_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round3_peer_ratings" ADD CONSTRAINT "round3_peer_ratings_to_team_id_teams_id_fk" FOREIGN KEY ("to_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_conversions" ADD CONSTRAINT "token_conversions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_from_team_id_teams_id_fk" FOREIGN KEY ("from_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_to_team_id_teams_id_fk" FOREIGN KEY ("to_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;