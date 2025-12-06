"use client"

import React from 'react';
import Link from 'next/link';

interface PageLockProps {
  roundType: 'QUIZ' | 'VOTING' | 'FINAL' | 'SCOREBOARD';
  isCompleted: boolean;
  children: React.ReactNode;
}

const ROUND_ICONS = {
  QUIZ: '📝',
  VOTING: '🗳️',
  FINAL: '🏆',
  SCOREBOARD: '🏅'
};

const ROUND_NAMES = {
  QUIZ: 'Quiz Round',
  VOTING: 'Voting Round',
  FINAL: 'Final Round',
  SCOREBOARD: 'Scoreboard'
};

const ROUND_DESCRIPTIONS = {
  QUIZ: 'The quiz round has been completed by the admin. No more quiz submissions are being accepted.',
  VOTING: 'The voting round has been completed by the admin and is no longer accepting votes.',
  FINAL: 'The final round has been completed by the admin. No more registrations or ratings are being accepted.',
  SCOREBOARD: 'The competition has been completed by the admin. The scoreboard is now in view-only mode.'
};

export default function PageLock({ roundType, isCompleted, children }: PageLockProps) {
  if (!isCompleted) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500 ease-in-out">
      <div className="max-w-md w-full mx-4 rounded-lg border border-green-300 bg-green-50 p-8 text-center shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <div className="text-6xl mb-4 animate-pulse">{ROUND_ICONS[roundType]}</div>
        <h2 className="text-2xl font-bold mb-4 text-green-800">{ROUND_NAMES[roundType]} Completed</h2>
        <p className="text-green-700 mb-6">
          {ROUND_DESCRIPTIONS[roundType]}
          <br />
          <span className="text-sm mt-2 block text-green-600">
            The page will automatically reactivate when the round is resumed by admin.
          </span>
        </p>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/scoreboard"
            className="block w-full px-4 py-2 border border-green-300 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors"
          >
            View Scoreboard
          </Link>
        </div>
        <div className="mt-6 text-xs text-gray-500">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Monitoring for round resumption...</span>
          </div>
        </div>
      </div>
    </div>
  );
}