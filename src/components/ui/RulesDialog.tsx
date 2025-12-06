"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface RulesDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function RulesDialog({ open, onAccept, onCancel }: RulesDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            BizArena Competition Rules
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Please read all rules carefully before creating your account
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 text-sm">
            {/* Competition Structure */}
            <section>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Competition Structure
              </h3>
              <p className="mb-2 text-muted-foreground">
                BizArena consists of <strong>three rounds</strong> with mandatory participation:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4 text-muted-foreground">
                <li><strong>Round 1 - Quiz (30 Minutes):</strong> 15 questions testing entrepreneurial mindset</li>
                <li><strong>Round 2 - Voting (90-Second Pitches):</strong> Teams present and vote on each other</li>
                <li><strong>Round 3 - Final Ratings (2-Minute Pitches):</strong> Judge and peer evaluations</li>
              </ol>
            </section>

            {/* Round 1 Details */}
            <section className="border-l-4 border-primary/30 pl-4 bg-primary/5 py-3 rounded-r">
              <h4 className="font-semibold mb-2 text-primary">Round 1: Quiz (30 Minutes)</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 15 questions with token rewards/penalties in 4 categories</li>
                <li>• Categories: <strong>Capital, Marketing, Strategy, Team</strong></li>
                <li>• Scores normalized to create <strong>Quiz Influence Index (Q_index)</strong></li>
                <li>• Q_index contributes <strong>5% to final score</strong></li>
                <li>• Marketing tokens boost YES votes in Round 2 (+10% max)</li>
                <li>• Capital tokens reduce NO vote impact in Round 2 (-10% max)</li>
              </ul>
            </section>

            {/* Round 2 Details */}
            <section className="border-l-4 border-accent/30 pl-4 bg-accent/5 py-3 rounded-r">
              <h4 className="font-semibold mb-2 text-accent">Round 2: 90-Second Pitch + Voting</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Each team presents 90-second pitch</li>
                <li>• Other teams vote <strong>YES or NO</strong></li>
                <li>• <strong className="text-orange-600 dark:text-orange-400">3-NO LIMIT:</strong> Maximum 3 NO votes per team</li>
                <li>• After 3 NO votes used, further NO attempts <strong>auto-convert to YES</strong></li>
                <li>• Quiz tokens influence vote effectiveness</li>
                <li>• Final Approval Rate contributes <strong>15% to final score</strong></li>
              </ul>
            </section>

            {/* Round 3 Details */}
            <section className="border-l-4 border-yellow-500/30 pl-4 bg-yellow-500/5 py-3 rounded-r">
              <h4 className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">Round 3: 2-Minute Pitch + Ratings</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Each team presents 2-minute final pitch</li>
                <li>• <strong>Judges score: 30-100</strong> (55% weight in final score)</li>
                <li>• <strong>Peer teams rate: 3-10</strong> (25% weight in final score)</li>
                <li>• All scores normalized before applying weights</li>
              </ul>
            </section>

            {/* Final Scoring */}
            <section className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">Final Score Formula</h4>
              <div className="font-mono text-xs bg-background/50 p-3 rounded border border-border/50 mb-2">
                Final = 0.55×Judges + 0.25×Peers + 0.15×Approval + 0.05×Quiz
              </div>
              <p className="text-xs text-muted-foreground">
                Display Score: Final × 100 (0-100 scale)
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div><strong>55%</strong> - Judge scores (30-100 range)</div>
                <div><strong>25%</strong> - Peer ratings (3-10 range)</div>
                <div><strong>15%</strong> - Approval rate (Round 2 voting)</div>
                <div><strong>5%</strong> - Quiz influence (Round 1 tokens)</div>
              </div>
            </section>

            {/* Penalties & Auto-Handling */}
            <section className="border-l-4 border-orange-500/50 pl-4 bg-orange-500/10 py-3 rounded-r">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                Penalties & Automatic Actions
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Missed Quiz:</strong> Q_index = 0 (lose 5% + no Round 2 advantages)</li>
                <li>• <strong>Skipped Vote:</strong> Automatic YES vote sent (with warning)</li>
                <li>• <strong>Missed Peer Rating:</strong> Automatic score of 50 (with warning)</li>
                <li>• <strong>Exceeded 3 NO votes:</strong> Further NOs auto-convert to YES</li>
              </ul>
            </section>

            {/* Team Registration Rules */}
            <section>
              <h4 className="font-semibold mb-2 text-red-600 dark:text-red-400">Team Registration Rules</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ <strong>Only team leader can register</strong> the team</li>
                <li>✓ One registration per team (no duplicates)</li>
                <li>✓ All team members use same login credentials</li>
                <li>✓ Team name must be unique across all teams</li>
                <li>✓ After registration, all team members can login</li>
              </ul>
            </section>

            {/* Winner Determination */}
            <section>
              <h4 className="font-semibold mb-2">Winner Determination</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Primary:</strong> Highest final score wins</li>
                <li>• <strong>Tiebreaker:</strong> Alphabetical order of team name</li>
              </ul>
            </section>

            {/* General Rules */}
            <section>
              <h4 className="font-semibold mb-2">General Competition Rules</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• All decisions are final once submitted (no edits)</li>
                <li>• Be respectful and professional during pitches</li>
                <li>• Follow all timelines and deadlines</li>
                <li>• Use of unauthorized tools or plagiarism leads to disqualification</li>
                <li>• Organizing committee's decision is final</li>
              </ul>
            </section>

            {/* Acknowledgment */}
            <section className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">By proceeding, you acknowledge:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>1. You are the team leader authorized to register</li>
                <li>2. You have read and understood all rules</li>
                <li>3. You will participate in all three rounds</li>
                <li>4. You accept automatic scoring for missed rounds</li>
                <li>5. All information provided is accurate</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel Registration
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAccept}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            I Accept - Create Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
