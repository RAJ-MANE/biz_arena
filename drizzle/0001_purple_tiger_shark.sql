CREATE TABLE "team_approval_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"yes_raw" integer DEFAULT 0 NOT NULL,
	"no_raw" integer DEFAULT 0 NOT NULL,
	"yes_effective" text DEFAULT '0' NOT NULL,
	"no_effective" text DEFAULT '0' NOT NULL,
	"approval_rate" text DEFAULT '0.5' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_approval_rates_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "voter_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"no_votes_remaining" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voter_state_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
ALTER TABLE "peer_ratings" ADD COLUMN "is_automatic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "capital_norm" text;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "marketing_norm" text;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "strategy_norm" text;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "team_norm" text;--> statement-breakpoint
ALTER TABLE "quiz_submissions" ADD COLUMN "quiz_index" text;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "is_automatic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "team_approval_rates" ADD CONSTRAINT "team_approval_rates_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voter_state" ADD CONSTRAINT "voter_state_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;