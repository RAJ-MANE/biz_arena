import { useState, useEffect } from 'react';

interface Round {
  id: number;
  name: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  isCompleted: boolean;
}

export function useRoundStatus(roundType: 'QUIZ' | 'VOTING' | 'FINAL') {
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoundStatus = async () => {
      try {
        const response = await fetch('/api/rounds');
        if (response.ok) {
          const rounds: Round[] = await response.json();
          const targetRound = rounds.find(r => r.name === roundType);
          setIsCompleted(targetRound?.status === 'COMPLETED' || targetRound?.isCompleted || false);
        }
      } catch (error) {
        console.warn(`Failed to check ${roundType} round status:`, error);
        // Default to not completed on error
        setIsCompleted(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkRoundStatus();

    // Poll every 2 seconds for status changes
    const interval = setInterval(checkRoundStatus, 2000);

    return () => clearInterval(interval);
  }, [roundType]);

  return { isCompleted, loading };
}