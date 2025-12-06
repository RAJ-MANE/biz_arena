"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Clock, Zap, Eye, Maximize2, Minimize2, CheckCircle, XCircle, Timer, Trophy, Brain, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import PageLock from "@/components/ui/PageLock";
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Option {
  id: number;
  text: string;
  order: number;
  tokenDeltaMarketing: number;
  tokenDeltaCapital: number;
  tokenDeltaTeam: number;
  tokenDeltaStrategy: number;
}

interface Question {
  id: number;
  text: string;
  order: number;
  maxTokenPerQuestion: number;
  options: Option[];
}

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  teamId?: number;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface QuizResult {
  submission: any;
  tokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
  };
}

// Enhanced Quiz Header Component
const QuizHeader: React.FC<{ 
  timeLeft: number; 
  isFullscreen: boolean; 
  onToggleFullscreen: () => void;
  isMobile: boolean;
}> = ({ timeLeft, isFullscreen, onToggleFullscreen, isMobile }) => (
  <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/50">
    <div className="relative group">
      <div className="absolute -inset-px bg-gradient-to-r from-primary/20 to-accent/20 blur opacity-50"></div>
      <div className={`relative flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} p-4`}>
        <div className={`flex items-center gap-3 ${isMobile ? 'justify-between' : ''}`}>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Brain className="w-4 h-4" />
            Quiz in Progress
          </div>
          {!isMobile && (
            <button
              className="group relative flex items-center gap-2 px-3 py-1.5 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg text-primary text-sm font-medium hover:bg-primary/20 transition-all duration-200"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
              ) : (
                <Maximize2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
              )}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
          )}
        </div>
        
        <div className={`relative flex items-center gap-2 px-3 py-2 backdrop-blur-sm border rounded-lg font-medium text-sm ${
          timeLeft <= 300 
            ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400" 
            : "border-border/50 bg-background/50 text-foreground"
        }`}>
          <Clock className={`w-4 h-4 ${timeLeft <= 300 ? 'animate-pulse' : ''}`} />
          <span className="font-mono">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Mobile Question Navigation
const MobileQuestionNavigation: React.FC<{
  questions: Question[];
  currentQ: number;
  answers: Record<number, number>;
  onQuestionSelect: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ questions, currentQ, answers, onQuestionSelect, isOpen, onToggle }) => (
  <>
    {/* Mobile Navigation Toggle */}
    <button
      onClick={onToggle}
      className="fixed bottom-4 left-4 z-50 lg:hidden flex items-center gap-2 px-4 py-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-lg text-sm font-medium"
    >
      <Menu className="w-4 h-4" />
      Q{questions[currentQ]?.order || 1}
    </button>

    {/* Mobile Navigation Overlay */}
    {isOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onToggle} />
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Questions
            </h3>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  currentQ === idx
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                    : answers[q.id]
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30"
                    : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30"
                }`}
                onClick={() => {
                  onQuestionSelect(idx);
                  onToggle();
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  {answers[q.id] && currentQ !== idx && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Q{q.order}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
);

// Desktop Question Navigation
const DesktopQuestionNavigation: React.FC<{
  questions: Question[];
  currentQ: number;
  answers: Record<number, number>;
  onQuestionSelect: (index: number) => void;
}> = ({ questions, currentQ, answers, onQuestionSelect }) => (
  <div className="hidden lg:block sticky top-24 h-fit">
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
      <div className="relative flex flex-col gap-3 min-w-[160px] p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Questions
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              className={`group relative rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200 ${
                currentQ === idx
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                  : answers[q.id]
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20"
                  : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/20"
              }`}
              onClick={() => onQuestionSelect(idx)}
            >
              <div className="relative flex flex-col items-center justify-center gap-1">
                {answers[q.id] && currentQ !== idx && (
                  <CheckCircle className="w-3 h-3" />
                )}
                <span>Q{q.order}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Question Content Component
const QuestionContent: React.FC<{
  question: Question;
  answer: number | undefined;
  onAnswerChange: (optionId: number) => void;
  locked?: boolean;
  isMobile: boolean;
}> = ({ question, answer, onAnswerChange, locked = false, isMobile }) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 lg:p-8 shadow-2xl">
      <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className={`font-black leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${
            isMobile ? 'text-lg' : 'text-xl'
          }`}>
            Q{question.order}. {question.text}
          </h2>
        </div>
        <p className={`text-muted-foreground bg-primary/5 backdrop-blur-sm px-4 py-3 rounded-lg border border-primary/20 ${
          isMobile ? 'text-sm' : ''
        }`}>
          Select one option. Each choice affects your token allocation.
        </p>
      </div>
      
      <div className="space-y-3">
        {question.options
          .sort((a, b) => a.order - b.order)
          .map((option) => (
            <label
              key={option.id}
              onClick={(e) => {
                // Prevent double events and stop propagation to avoid conflicts with other handlers
                e.preventDefault();
                e.stopPropagation();
                if (locked) return;
                try { console.debug('[Quiz] label onClick', { questionId: question.id, optionId: option.id }); } catch (err) {}
                onAnswerChange(option.id);
              }}
              className={`group relative flex cursor-pointer items-start gap-4 p-4 lg:p-5 transition-all duration-300 rounded-xl border backdrop-blur-sm ${
                answer === option.id 
                  ? "border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg transform -translate-y-0.5" 
                  : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5"
              } ${locked ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              <div className="relative flex-shrink-0 mt-1">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer === option.id}
                  className="sr-only"
                  disabled={locked}
                  aria-hidden="true"
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  answer === option.id 
                    ? 'border-primary bg-primary' 
                    : 'border-border group-hover:border-primary/50'
                }`}>
                  {answer === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-foreground font-medium leading-relaxed ${
                  isMobile ? 'text-sm' : ''
                }`}>
                  {option.text}
                </p>
              </div>
              {answer === option.id && (
                <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-1 ${
                  locked ? 'text-muted-foreground' : 'text-primary'
                }`} />
              )}
            </label>
          ))}
      </div>
    </div>
  </div>
);

// Enhanced Navigation Controls
const NavigationControls: React.FC<{
  currentQ: number;
  totalQuestions: number;
  answeredCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onNextQuestion: () => void;
  isMobile: boolean;
}> = ({ currentQ, totalQuestions, answeredCount, onPrevious, onNext, onNextQuestion, isMobile }) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className={`relative flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl`}>
      <div className={`flex items-center gap-3 ${isMobile ? 'justify-between' : ''}`}>
        <button
          className="group relative flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg text-primary font-medium hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[40px]"
          onClick={onPrevious}
          disabled={currentQ === 0}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {!isMobile && "Previous"}
        </button>
        
        {!isMobile && (
          <span className="text-sm text-muted-foreground font-medium bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
            Question {currentQ + 1} of {totalQuestions} • {answeredCount}/15 answered
          </span>
        )}
        
        <button
          className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
          onClick={onNextQuestion}
          disabled={currentQ === totalQuestions - 1}
        >
          {!isMobile && "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {isMobile && (
        <div className="text-center">
          <span className="text-sm text-muted-foreground font-medium bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
            {currentQ + 1} of {totalQuestions} • {answeredCount}/15
          </span>
        </div>
      )}
    </div>
  </div>
);

// Enhanced Progress Bar
const ProgressBar: React.FC<{ answeredCount: number; total: number }> = ({ answeredCount, total }) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className="relative p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Progress
        </span>
        <span className="text-sm text-muted-foreground font-mono">
          {answeredCount}/{total}
        </span>
      </div>
      <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500 ease-out shadow-lg relative overflow-hidden"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50"></div>
        </div>
      </div>
    </div>
  </div>
);

// Main Quiz Component
const QuizComponent: React.FC<{
  questions: Question[];
  answers: Record<number, number>;
  onAnswerChange: (questionId: number, optionId: number) => void;
  currentQ: number;
  onCurrentQChange: (index: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  quizActive: boolean;
  timeLeft: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  message: string | null;
  onNextQuestion: () => void;
  lockedQuestions: Record<number, boolean>;
  committedTokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
  };
  isMobile: boolean;
}> = ({
  questions,
  answers,
  onAnswerChange,
  currentQ,
  onCurrentQChange,
  onSubmit,
  submitting,
  quizActive,
  timeLeft,
  isFullscreen,
  onToggleFullscreen,
  message,
  onNextQuestion,
  lockedQuestions,
  committedTokens,
  isMobile
}) => {
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentQ];
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25"></div>
          <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-bold mb-2 text-foreground">Loading Quiz...</h3>
            <p className="text-muted-foreground">Please wait while we load the questions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizHeader 
        timeLeft={timeLeft} 
        isFullscreen={isFullscreen} 
        onToggleFullscreen={onToggleFullscreen}
        isMobile={isMobile}
      />
      
      <div className="flex gap-6 items-start">
        <DesktopQuestionNavigation
          questions={questions}
          currentQ={currentQ}
          answers={answers}
          onQuestionSelect={onCurrentQChange}
        />
        
        <div className="flex-1 space-y-6">
          {/* Navigation Controls */}
          <NavigationControls
            currentQ={currentQ}
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            onPrevious={() => onCurrentQChange(Math.max(0, currentQ - 1))}
            onNext={() => onCurrentQChange(Math.min(questions.length - 1, currentQ + 1))}
            onNextQuestion={onNextQuestion}
            isMobile={isMobile}
          />

          {/* Question Content */}
          {currentQuestion && (
            <QuestionContent
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(optionId) => onAnswerChange(currentQuestion.id, optionId)}
              // Locking removed: users can change answers until final submit
              locked={false}
              isMobile={isMobile}
            />
          )}
          
          {/* Progress Bar */}
          <ProgressBar answeredCount={answeredCount} total={15} />
          
          {/* Messages */}
          {message && (
            <div className={`relative group p-4 backdrop-blur-xl border rounded-xl ${
              message.includes('error') || message.includes('failed') 
                ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400" 
                : "border-primary/20 bg-primary/10 text-primary"
            }`}>
              <div className="flex items-center gap-3">
                {message.includes('error') || message.includes('failed') ? (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{message}</span>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex items-center justify-center pb-20 lg:pb-6">
            <button
              onClick={onSubmit}
              disabled={submitting || answeredCount !== 15 || !quizActive || timeLeft <= 0}
              className={`group relative px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden ${
                isMobile ? 'w-full' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : timeLeft <= 0 ? (
                  <>
                    <Timer className="w-5 h-5" />
                    Time's Up!
                  </>
                ) : !quizActive ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Quiz Not Active
                  </>
                ) : answeredCount !== 15 ? (
                  <>
                    <Brain className="w-5 h-5" />
                    Answer All Questions ({answeredCount}/15)
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    Submit Quiz
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileQuestionNavigation
        questions={questions}
        currentQ={currentQ}
        answers={answers}
        onQuestionSelect={onCurrentQChange}
        isOpen={mobileNavOpen}
        onToggle={() => setMobileNavOpen(!mobileNavOpen)}
      />
    </div>
  );
};

// Enhanced Results Component with better mobile layout
const QuizResults: React.FC<{ 
  result: QuizResult; 
  onReturnToDashboard: () => void;
  isMobile: boolean;
}> = ({ result, onReturnToDashboard, isMobile }) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-4 lg:p-6">
    {/* Animated background elements */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
    </div>
    
    <div className={`relative w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-green-600 dark:text-green-400 mb-4 border border-green-500/20">
              <CheckCircle className="w-4 h-4" />
              Quiz Completed
            </div>
            <h2 className={`font-black mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent ${
              isMobile ? 'text-2xl' : 'text-3xl'
            }`}>
              Quiz Completed!
            </h2>
            <p className="text-muted-foreground">
              Your quiz has been submitted successfully!
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <h3 className={`font-bold text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
              Token Distribution
            </h3>
            <div className={`grid gap-3 text-sm ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-500/20">
                  <div className="font-bold text-blue-600 dark:text-blue-400 mb-1 text-xs">Marketing</div>
                  <div className={`font-black text-blue-600 dark:text-blue-400 ${
                    isMobile ? 'text-xl' : 'text-2xl'
                  }`}>
                    {result.tokens.marketing}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-500/20">
                  <div className="font-bold text-green-600 dark:text-green-400 mb-1 text-xs">Capital</div>
                  <div className={`font-black text-green-600 dark:text-green-400 ${
                    isMobile ? 'text-xl' : 'text-2xl'
                  }`}>
                    {result.tokens.capital}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-600 dark:text-purple-400 mb-1 text-xs">Team</div>
                  <div className={`font-black text-purple-600 dark:text-purple-400 ${
                    isMobile ? 'text-xl' : 'text-2xl'
                  }`}>
                    {result.tokens.team}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="font-bold text-orange-600 dark:text-orange-400 mb-1 text-xs">Strategy</div>
                  <div className={`font-black text-orange-600 dark:text-orange-400 ${
                    isMobile ? 'text-xl' : 'text-2xl'
                  }`}>
                    {result.tokens.strategy}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            className="group relative w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={onReturnToDashboard}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function QuizPage() {
  const isMobile = useIsMobile();
  
  // Page lock functionality
  const { isCompleted: isQuizCompleted, loading: roundLoading } = useRoundStatus('QUIZ');

  // Simple modal for rules
  const RulesModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    if (!open) return null;
    
    const handleStartQuiz = () => {
      if (!quizActive) {
        setMessage("Quiz is not currently active. Please wait for the admin to start the quiz.");
        return;
      }
      // Call server to initialize team tokens (idempotent)
      (async () => {
        try {
          const authToken = localStorage.getItem("auth-token");
          const res = await fetch('/api/quiz/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
          });
          if (!res.ok) {
            console.warn('Failed to initialize tokens on start:', await res.text());
          }
        } catch (e) {
          console.error('Error calling /api/quiz/start', e);
        }
      })();

      onClose();
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className={`relative group w-full m-4 ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className={`font-black mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                Quiz Rules
              </h2>
            </div>
            <ul className={`space-y-3 mb-6 text-foreground ${isMobile ? 'text-sm' : 'text-sm'}`}>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>15 questions, 30 minutes total time.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Each option affects your team's token allocation.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Once started, the timer cannot be paused.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Your answers are automatically saved - refreshing won't lose progress.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Browser close/refresh resumes from where you left off.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Submit before time runs out. Auto-submit on timeout.</span>
              </li>
            </ul>
            
            {!quizActive && (
              <div className="mb-4 p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl">
                <p className={`text-yellow-600 dark:text-yellow-400 font-medium ${
                  isMobile ? 'text-sm' : 'text-sm'
                }`}>
                  Quiz is currently pending. Please wait for the admin to activate the quiz before proceeding.
                </p>
              </div>
            )}
            
            <button
              className={`group relative w-full px-6 py-3 font-bold rounded-xl transition-all duration-300 overflow-hidden ${
                quizActive 
                  ? "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
              onClick={handleStartQuiz}
              disabled={!quizActive}
            >
              {quizActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              <div className="relative">
                {quizActive ? "I Understand, Start Quiz" : "Quiz Not Available"}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fullscreen Warning Modal Component
  const FullscreenWarningModal: React.FC<{ open: boolean; onStay: () => void; onExit: () => void }> = ({ 
    open, 
    onStay, 
    onExit 
  }) => {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div className={`relative group w-full m-4 ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-card/90 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className={`font-black mb-4 text-red-600 dark:text-red-400 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                Fullscreen Exit Warning
              </h2>
              <div className={`mb-6 text-foreground space-y-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                <p className="font-bold text-red-600 dark:text-red-400">
                  You have exited fullscreen mode during the quiz!
                </p>
                <p>
                  For exam integrity, the quiz must be completed in fullscreen mode.
                </p>
                <div className="p-3 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl">
                  <p className="font-bold text-yellow-600 dark:text-yellow-400">
                    WARNING: If you exit fullscreen again, your quiz will be automatically submitted and you will need to contact the nearest event coordinator.
                  </p>
                </div>
              </div>
              <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
                <button
                  className="group relative flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={onStay}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Stay in Quiz</div>
                </button>
                <button
                  className="group relative flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={onExit}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Exit Quiz</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [lockedQuestions, setLockedQuestions] = useState<Record<number, boolean>>({});
  const [committedTokens, setCommittedTokens] = useState({
    marketing: 0,
    capital: 0,
    team: 0,
    strategy: 0,
  });
  // Base tokens (fixed starting values)
  const BASE_TOKENS = {
    marketing: 3,
    capital: 3,
    team: 3,
    strategy: 3,
  } as const;

  // Keep a baseTokens state so it can be extended later if needed
  const [baseTokens] = useState(() => ({ ...BASE_TOKENS }));
  // Calculate live tokens from base tokens + selected answers
  const calculateLiveTokens = (base: typeof baseTokens, answersObj: Record<number, number>, qs: Question[]) => {
    const live = { ...base };
    Object.entries(answersObj).forEach(([qid, oid]) => {
      const q = qs.find(x => x.id === Number(qid));
      if (!q) return;
      const opt = q.options.find(o => o.id === oid);
      if (!opt) return;
      live.marketing += Number(opt.tokenDeltaMarketing || 0);
      live.capital += Number(opt.tokenDeltaCapital || 0);
      live.team += Number(opt.tokenDeltaTeam || 0);
      live.strategy += Number(opt.tokenDeltaStrategy || 0);
    });
    return live;
  };

  const liveTokens = useMemo(() => calculateLiveTokens(baseTokens, answers, questions), [baseTokens, answers, questions]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizPending, setQuizPending] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [previousSubmission, setPreviousSubmission] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRules, setShowRules] = useState(true);
  
  // Fullscreen warning state (no auto-submission)
  const [fullscreenWarningShown, setFullscreenWarningShown] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  
  // Refs to improve fullscreen handling and avoid false positives
  const lastFullscreenElementRef = useRef<Element | null>(null);
  const intentionalExitRef = useRef(false);
  const fullscreenDebounceRef = useRef<number | null>(null);

  const quizRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    setIsPending(false);
  }, []);

  // Load persisted locked questions and committed tokens
  useEffect(() => {
    try {
      // Previously we restored persisted locked questions here. Locking has been removed
      // so we no longer restore or persist `quiz_locked_questions` to allow users to
      // change answers until final submission.
      const rawTokens = localStorage.getItem('quiz_committed_tokens');
      if (rawTokens) setCommittedTokens(JSON.parse(rawTokens));
      // Note: We intentionally no longer restore 'quiz_current_tokens'. The UI
      // computes live tokens client-side from BASE_TOKENS + selected options.
    } catch (e) {
      console.error('Failed to restore locked state or tokens:', e);
    }
  }, []);

  // We no longer fetch authoritative team tokens on mount. Clients use BASE_TOKENS
  // and compute live totals from selected answers. Keep effect minimal to avoid
  // triggering network calls during page load.
  useEffect(() => {
    if (!user) return;
  }, [user]);

  // Load quiz questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setQuestions(data);
      } catch (e) {
        console.error("Failed to load questions:", e);
        setMessage("Failed to load quiz questions. Please refresh the page.");
      }
    };
    fetchQuestions();
  }, []);

  // Check quiz status with real-time polling
  useEffect(() => {
    const fetchQuizStatus = async () => {
      try {
        const res = await fetch("/api/rounds");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rounds = await res.json();
        const quizRound = rounds.find((r: any) => r.name === "QUIZ");
        setQuizActive(quizRound?.status === "ACTIVE");
        setQuizCompleted(quizRound?.status === "COMPLETED");
        setQuizPending(quizRound?.status === "PENDING");
      } catch (e) {
        console.error("Failed to check quiz status:", e);
        setQuizActive(false);
        setQuizCompleted(false);
        setQuizPending(false);
      }
    };
    
    fetchQuizStatus();
    const interval = setInterval(fetchQuizStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check if user has already submitted quiz
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      if (!user) return;

      try {
        const teamId = user.team?.id || user.teamId;
        if (!teamId) return;

        const res = await fetch(`/api/quiz/submit?teamId=${teamId}`);
        if (res.ok) {
          const submission = await res.json();
          if (submission) {
            setHasSubmitted(true);
            setPreviousSubmission({
              submission: submission,
              tokens: {
                marketing: submission.tokensMarketing || 0,
                capital: submission.tokensCapital || 0,
                team: submission.tokensTeam || 0,
                strategy: submission.tokensStrategy || 0
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to check previous submission:", e);
      }
    };

    checkPreviousSubmission();
  }, [user]);

  // Timer management with localStorage persistence
  useEffect(() => {
    if (showResult || showRules || hasSubmitted) return;

    const stored = localStorage.getItem('quiz_time_left');
    if (stored) {
      const savedTime = Number(stored);
      if (savedTime > 0) {
        setTimeLeft(savedTime);
      }
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime > 0 ? prevTime - 1 : 0;
        localStorage.setItem('quiz_time_left', String(newTime));
        if (newTime === 0 && Object.keys(answers).length > 0) {
          handleSubmitQuiz();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, showRules, answers, hasSubmitted]);

  // Restore answers from localStorage on mount
  useEffect(() => {
    if (showResult || hasSubmitted) return;

    const storedAnswers = localStorage.getItem('quiz_answers');
    if (storedAnswers) {
      try {
        const parsedAnswers = JSON.parse(storedAnswers);
        if (typeof parsedAnswers === 'object' && parsedAnswers !== null) {
          const answerCount = Object.keys(parsedAnswers).length;
          setAnswers(parsedAnswers);
          console.log('Restored quiz answers from localStorage:', parsedAnswers);
          
          if (answerCount > 0) {
            setMessage(`Progress restored: ${answerCount} question${answerCount === 1 ? '' : 's'} previously answered.`);
            setTimeout(() => setMessage(null), 3000);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved quiz answers:', e);
        localStorage.removeItem('quiz_answers');
      }
    }
  }, [showResult, hasSubmitted]);

  // Clean up timer on quiz completion
  useEffect(() => {
    if (showResult) {
      localStorage.removeItem('quiz_time_left');
      localStorage.removeItem('quiz_answers');
    }
  }, [showResult]);

  // Clean up answers if user has already submitted
  useEffect(() => {
    if (hasSubmitted) {
      localStorage.removeItem('quiz_answers');
      localStorage.removeItem('quiz_time_left');
    }
  }, [hasSubmitted]);

  // Enhanced fullscreen management with auto-submission
  useEffect(() => {
    if (!quizRef.current) return;

    const clearDebounce = () => {
      if (fullscreenDebounceRef.current) {
        clearTimeout(fullscreenDebounceRef.current);
        fullscreenDebounceRef.current = null;
      }
    };

    const handleFullscreenChange = () => {
      const currentEl = document.fullscreenElement;
      const isCurrentlyFullscreen = currentEl === quizRef.current;
      setIsFullscreen(isCurrentlyFullscreen);

      // Track last element that was fullscreen for our quiz
      if (isCurrentlyFullscreen) {
        lastFullscreenElementRef.current = currentEl;
        // If a warning modal was open, close it when the user re-enters fullscreen
        if (showFullscreenWarning) setShowFullscreenWarning(false);
        clearDebounce();
        return;
      }

      // If exit was intentional via our UI, ignore it
      if (intentionalExitRef.current) {
        // reset the flag shortly after intentional exit
        intentionalExitRef.current = false;
        clearDebounce();
        return;
      }

      // Debounce to avoid transient false positives (some browsers fire transient events)
      clearDebounce();
      fullscreenDebounceRef.current = window.setTimeout(() => {
        // Only proceed if the quiz was previously fullscreen
        const prevWasQuiz = lastFullscreenElementRef.current === quizRef.current;
        if (!prevWasQuiz) return;

        // If still not fullscreen for our quiz, treat as exit/violation
        if (document.fullscreenElement !== quizRef.current) {
          if (quizActive && !quizCompleted && !hasSubmitted) {
            if (!fullscreenWarningShown) {
              setFullscreenWarningShown(true);
              setShowFullscreenWarning(true);
            } else {
              // Previously we auto-submitted the quiz after a second violation.
              // Auto-submission has been removed: show a message and require the
              // user to manually submit or contact event staff.
              setMessage("You have exited fullscreen again. Auto-submit is disabled — please contact event staff or manually submit if needed.");
            }
          }
        }
      }, 350);
    };

    const handleVisibilityChange = () => {
      // If the document becomes hidden while our quiz element is fullscreen, start a short debounce
      if (document.visibilityState === 'hidden' && document.fullscreenElement === quizRef.current) {
        clearDebounce();
        fullscreenDebounceRef.current = window.setTimeout(() => {
          // If still fullscreen and document is hidden, consider this suspicious and show warning
          if (document.fullscreenElement === quizRef.current && document.visibilityState === 'hidden') {
              if (!fullscreenWarningShown) {
                setFullscreenWarningShown(true);
                setShowFullscreenWarning(true);
              } else {
                setMessage("You have lost focus while in fullscreen. Auto-submit is disabled — please contact event staff if you need assistance.");
              }
            }
        }, 800);
      }
    };

    const handleWindowBlur = () => {
      // Some platforms blur when switching apps; run a short debounce and let fullscreenchange handle actual exit
      clearDebounce();
      fullscreenDebounceRef.current = window.setTimeout(() => {
        if (document.fullscreenElement !== quizRef.current && lastFullscreenElementRef.current === quizRef.current) {
          if (!fullscreenWarningShown) {
            setFullscreenWarningShown(true);
            setShowFullscreenWarning(true);
          } else {
            setMessage("You switched apps while in fullscreen. Auto-submit is disabled — please contact event staff if you need assistance.");
          }
        }
      }, 1000);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearDebounce();
    };
  }, [quizActive, quizCompleted, hasSubmitted, fullscreenWarningShown, showFullscreenWarning]);

  const toggleFullscreen = () => {
    if (!quizRef.current) return;
    
    if (!isFullscreen) {
      // entering fullscreen intentionally
      quizRef.current.requestFullscreen().catch((e) => {
        console.error("Failed to enter fullscreen:", e);
      });
    } else {
      // mark this exit as intentional so the fullscreenchange handler ignores it
      intentionalExitRef.current = true;
      document.exitFullscreen().catch((e) => {
        console.error("Failed to exit fullscreen:", e);
      });
      // reset the intentional flag after a short delay in case of subsequent events
      setTimeout(() => { intentionalExitRef.current = false; }, 1000);
    }
  };

  const handleAnswerChange = (questionId: number, optionId: number) => {
    // Debug: log selection events to help diagnose selection issues in the wild
    try { console.debug('[Quiz] handleAnswerChange', { questionId, optionId }); } catch (e) {}

    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: optionId };
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      return newAnswers;
    });
    setMessage(null);
  };

  const handleSubmitQuiz = async () => {
    if (!quizActive && timeLeft > 0) {
      setMessage("Quiz is not currently active. Please wait for the admin to start the quiz round.");
      return;
    }

    const teamId = user?.team?.id || user?.teamId;
    if (!teamId) {
      setMessage("Team ID not found. Please sign out and sign back in.");
      return;
    }

    if (Object.keys(answers).length !== 15) {
      setMessage(`Please answer all questions. You have answered ${Object.keys(answers).length} out of 15.`);
      return;
    }

    setSubmitting(true);
    setMessage("Submitting your quiz...");

    try {
      const payload = {
        teamId: teamId,
        answers: Object.entries(answers).map(([qid, oid]) => ({
          questionId: Number(qid),
          optionId: oid
        })),
        durationSeconds: 30 * 60 - timeLeft,
        finalTokens: liveTokens,
      };

      const authToken = localStorage.getItem("auth-token");
      if (!authToken) {
        setMessage("You must be signed in to submit the quiz. Please sign in and try again.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: Submission failed`);
      }

      setResult(data);
      setShowResult(true);
      setMessage(null);
      
      setHasSubmitted(true);
      setPreviousSubmission(data);
      
      localStorage.removeItem('quiz_time_left');
      localStorage.removeItem('quiz_answers');
      
    } catch (error: any) {
      console.error("Quiz submission error:", error);
      setMessage(error?.message || "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit function for fullscreen violations
  // Auto-submit feature removed. In case of fullscreen violations we now show a
  // warning/message to the user but do not automatically submit their quiz.

  // Lock current question and commit its token deltas, then advance to next
  const handleNextQuestion = () => {
    const q = questions[currentQ];
    if (!q) return;

    const selectedOptionId = answers[q.id];
    if (!selectedOptionId) {
      setMessage('Please select an option before proceeding to the next question.');
      return;
    }

    // Locking behavior removed: do not persist locked questions. Keep client state unchanged.

    const opt = q.options.find(o => o.id === selectedOptionId);
    if (opt) {
      setCommittedTokens(prev => {
        const next = {
          marketing: prev.marketing + (opt.tokenDeltaMarketing || 0),
          capital: prev.capital + (opt.tokenDeltaCapital || 0),
          team: prev.team + (opt.tokenDeltaTeam || 0),
          strategy: prev.strategy + (opt.tokenDeltaStrategy || 0),
        };
        try { localStorage.setItem('quiz_committed_tokens', JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }

    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const handleReturnToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Fullscreen warning modal handlers
  const handleStayInQuiz = () => {
    setShowFullscreenWarning(false);
    if (quizRef.current) {
      quizRef.current.requestFullscreen().catch((e) => {
        console.error("Failed to re-enter fullscreen:", e);
        setMessage("Failed to re-enter fullscreen. Please try manually or contact event coordinator.");
      });
    }
  };

  const handleExitQuiz = () => {
  setShowFullscreenWarning(false);
  setMessage("You chose to exit after a fullscreen warning. Auto-submit is disabled — please contact event staff if you need assistance.");
  };

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className={`relative w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className={`font-bold mb-2 text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>Loading...</h2>
              <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Please wait while we load your quiz.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-4 lg:p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className={`relative w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
              <h2 className={`font-black mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                Please Sign In
              </h2>
              <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-sm' : ''}`}>
                You need to be signed in to access the quiz portal.
              </p>
              <div className="space-y-3">
                <Link
                  href="/sign-in"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Sign In</div>
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full flex items-center justify-center px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz completed message
  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-4 lg:p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className={`relative w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
              <div className={`mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>✅</div>
              <h2 className={`font-black mb-4 text-green-600 dark:text-green-400 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Quiz Round Completed
              </h2>
              <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-sm' : ''}`}>
                The quiz round has been completed and is no longer available for new submissions.
              </p>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <Link
                  href="/scoreboard"
                  className="w-full flex items-center justify-center px-6 py-3 bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all duration-300 font-semibold text-green-600 dark:text-green-400"
                >
                  View Scoreboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz already submitted message (lock the quiz)
  if (hasSubmitted && previousSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-4 lg:p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className={`relative w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
              <div className={`mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>🔒</div>
              <h2 className={`font-black mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                Quiz Already Submitted
              </h2>
              <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-sm' : ''}`}>
                You have already completed and submitted the quiz. Each team can only attempt the quiz once.
              </p>
              
              <div className="space-y-4 mb-6">
                <h3 className={`font-bold text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                  Your Results
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-500/20">
                      <div className="font-bold text-blue-600 dark:text-blue-400 mb-1 text-xs">Marketing</div>
                      <div className={`font-black text-blue-600 dark:text-blue-400 ${
                        isMobile ? 'text-xl' : 'text-2xl'
                      }`}>
                        {previousSubmission.tokens.marketing}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-500/20">
                      <div className="font-bold text-green-600 dark:text-green-400 mb-1 text-xs">Capital</div>
                      <div className={`font-black text-green-600 dark:text-green-400 ${
                        isMobile ? 'text-xl' : 'text-2xl'
                      }`}>
                        {previousSubmission.tokens.capital}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20">
                      <div className="font-bold text-purple-600 dark:text-purple-400 mb-1 text-xs">Team</div>
                      <div className={`font-black text-purple-600 dark:text-purple-400 ${
                        isMobile ? 'text-xl' : 'text-2xl'
                      }`}>
                        {previousSubmission.tokens.team}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                      <div className="font-bold text-orange-600 dark:text-orange-400 mb-1 text-xs">Strategy</div>
                      <div className={`font-black text-orange-600 dark:text-orange-400 ${
                        isMobile ? 'text-xl' : 'text-2xl'
                      }`}>
                        {previousSubmission.tokens.strategy}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  Completed on: {new Date(previousSubmission.submission.createdAt).toLocaleDateString()} at {new Date(previousSubmission.submission.createdAt).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <Link
                  href="/scoreboard"
                  className="w-full flex items-center justify-center px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold"
                >
                  View Scoreboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show results (with special handling for auto-submission)
  if (showResult && result) {
    return (
      <div>
        {/* Auto-submission UI removed; auto-submit is disabled. */}
        <QuizResults result={result} onReturnToDashboard={handleReturnToDashboard} isMobile={isMobile} />
      </div>
    );
  }

  // Block access when quiz is pending
  if (quizPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="relative bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-6xl px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors group min-h-[44px]">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 lg:px-6 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className={`relative group w-full ${isMobile ? 'max-w-sm' : 'max-w-lg'}`}>
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className={`font-black text-orange-600 dark:text-orange-400 mb-4 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>
                Quiz Not Yet Available
              </h2>
              <p className={`text-muted-foreground mb-6 leading-relaxed ${isMobile ? 'text-sm' : ''}`}>
                The quiz is currently in preparation mode. Access will be granted once the round becomes active.
                Please return to the dashboard and wait for the official announcement.
              </p>
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <p className={`text-orange-600 dark:text-orange-400 bg-orange-500/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-500/20 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  This prevents premature access to questions and timer activation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  return (
    <PageLock roundType="QUIZ" isCompleted={isQuizCompleted}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden pb-20 lg:pb-6" ref={quizRef}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <RulesModal open={showRules} onClose={() => {
          setShowRules(false);
          if (quizRef.current && !isFullscreen) {
            quizRef.current.requestFullscreen().catch((e) => {
              console.error("Failed to auto-enter fullscreen on quiz start:", e);
              setMessage("Warning: Could not enter fullscreen mode. Please manually enter fullscreen for the best quiz experience.");
            });
          }
        }} />

        <FullscreenWarningModal 
          open={showFullscreenWarning} 
          onStay={handleStayInQuiz}
          onExit={handleExitQuiz}
        />

        <div className="relative bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-6xl px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors group min-h-[44px]">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="relative border-b border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 lg:px-6 py-6">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-start justify-between gap-6'}`}>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-primary mb-3 border border-primary/20">
                  <Brain className="w-4 h-4" />
                  Round 1 • Quiz Portal
                </div>
                <h1 className={`font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent ${
                  isMobile ? 'text-2xl' : 'text-3xl'
                }`}>
                  Techpreneur Summit 2.0 Quiz
                </h1>
                <p className={`text-muted-foreground mt-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 inline-block ${
                  isMobile ? 'text-sm' : ''
                }`}>
                  15 questions • 30 minutes • Token trade-offs per option
                </p>
              </div>
              <div className={`flex-shrink-0 ${isMobile ? 'w-full' : ''}`}>
                <div className="bg-primary/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-primary/20">
                  <p className={`font-bold text-foreground ${isMobile ? 'text-sm' : ''}`}>{user.name}</p>
                  <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Team: {user.team?.name || `Team ID: ${user.teamId || 'None'}`}
                  </p>
                </div>
                <div className={`mt-3 grid grid-cols-4 gap-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  <div className="p-2 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-center dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                    <div className="font-medium">Marketing: {liveTokens.marketing}</div>
                  </div>
                  <div className="p-2 rounded-md bg-green-50 border border-green-100 text-green-700 text-center dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                    <div className="font-medium">Capital: {liveTokens.capital}</div>
                  </div>
                  <div className="p-2 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-center dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300">
                    <div className="font-medium">Team: {liveTokens.team}</div>
                  </div>
                  <div className="p-2 rounded-md bg-orange-50 border border-orange-100 text-orange-700 text-center dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300">
                    <div className="font-medium">Strategy: {liveTokens.strategy}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 lg:px-6 py-6">
          {!quizActive && !showRules ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative bg-card/80 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 lg:p-8 text-center shadow-2xl">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-4 border border-yellow-500/20">
                    <Clock className="w-4 h-4" />
                    Quiz Pending
                  </div>
                  <h3 className={`font-bold mb-2 text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                    Quiz Not Available
                  </h3>
                  <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                    The quiz is currently set to pending status. Please wait for the admin to activate the quiz.
                  </p>
                  <p className={`text-muted-foreground bg-yellow-500/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-500/20 ${
                    isMobile ? 'text-xs' : 'text-sm'
                  }`}>
                    Contact the event organizers if you believe this is an error.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
              </div>
            </div>
          ) : (
            <QuizComponent
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              currentQ={currentQ}
              onCurrentQChange={setCurrentQ}
              onSubmit={handleSubmitQuiz}
              submitting={submitting}
              quizActive={quizActive}
              timeLeft={timeLeft}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              message={message}
              onNextQuestion={handleNextQuestion}
              lockedQuestions={lockedQuestions}
              committedTokens={committedTokens}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </PageLock>
  );
}