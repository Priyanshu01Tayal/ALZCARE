'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useGamesQuery, useSubmitGameResultMutation } from '@/hooks/useApi';
import { BrainCircuit, Play, Award, Zap, Clock, Star, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface CardItem {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function PatientGames() {
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const { data: games = [], refetch } = useGamesQuery(user?._id || '');
  const submitResultMutation = useSubmitGameResultMutation();

  const [activeGame, setActiveGame] = useState<any>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);

  const cardValues = ['🧠', '🧩', '⚡', '💡', '🔍', '⭐️', '🎯', '🎨'];

  const initGame = (assignment: any) => {
    setActiveGame(assignment);
    const doubled = [...cardValues, ...cardValues];
    const shuffled = doubled
      .map((val, index) => ({ id: index, value: val, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setAccuracy(0);
    setStartTime(Date.now());
    setGameOver(false);
  };

  const handleCardClick = (id: number) => {
    if (selectedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newSelected;

      if (cards[firstIdx].value === cards[secondIdx].value) {
        // Match!
        setTimeout(() => {
          const matchedCards = cards.map((c, index) => {
            if (index === firstIdx || index === secondIdx) {
              return { ...c, isMatched: true };
            }
            return c;
          });
          setCards(matchedCards);
          setMatches((m) => {
            const nextMatches = m + 1;
            if (nextMatches === cardValues.length) {
              handleGameOver();
            }
            return nextMatches;
          });
          setSelectedCards([]);
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = cards.map((c, index) => {
            if (index === firstIdx || index === secondIdx) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setCards(resetCards);
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  const handleGameOver = () => {
    setGameOver(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const calcAccuracy = Math.round((cardValues.length / (moves + 1)) * 100);
    const finalScore = Math.max(1000 - timeTaken * 5 - moves * 10, 100);

    setAccuracy(calcAccuracy);
    setScore(finalScore);

    // Confetti particles burst
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#0d9488', '#10b981', '#3b82f6'],
    });

    if (user && activeGame) {
      submitResultMutation.mutate({
        patientId: user._id,
        gameName: activeGame.gameName,
        gameId: activeGame._id,
        score: finalScore,
        accuracy: calcAccuracy,
        timeTaken: timeTaken,
      }, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  return (
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">Cognitive Support Program</h1>
        <p className="text-xs text-slate-400">Complete matching exercises assigned by your practitioner to exercise neural activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Assignments side list */}
        <div className="lg:col-span-1 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 h-fit space-y-5 shadow-xl">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Assigned Exercises List</h4>
          
          {games.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/20 border border-white/5 rounded-xl">
              No tasks assigned today. Take some rest!
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((g: any) => (
                <div key={g._id} className="p-4 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 transition">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-xs block">{g.gameName}</span>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                        g.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' :
                        g.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-450' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-455'
                      }`}>
                        {g.difficulty}
                      </span>
                      {g.dueDate && (
                        <span className="text-[9px] text-slate-500">
                          Due: {new Date(g.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {g.status === 'Completed' ? (
                    <span className="px-2.5 py-1 rounded text-[9px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      Done
                    </span>
                  ) : (
                    <button
                      onClick={() => initGame(g)}
                      className="bg-emerald-600 hover:bg-emerald-500 hover:scale-102 text-white p-2 rounded-lg font-bold shrink-0 transition"
                    >
                      <Play className="h-4.5 w-4.5" fill="currentColor" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Game viewport */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl min-h-[420px] flex items-center justify-center relative">
          
          <AnimatePresence mode="wait">
            {!activeGame ? (
              <motion.div
                key="no-game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center max-w-sm space-y-4 flex flex-col items-center justify-center p-6"
              >
                <BrainCircuit className="h-12 w-12 text-slate-500 animate-pulse" />
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Select exercise program to start</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your neural training data will log directly to your medical dashboard upon successful matching of card grids.
                </p>
              </motion.div>
            ) : gameOver ? (
              <motion.div
                key="game-over-panel"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8 border border-white/10 rounded-2xl bg-slate-950/80 backdrop-blur-xl max-w-sm w-full space-y-6"
              >
                <div className="space-y-1">
                  <Star className="h-10 w-10 text-emerald-400 mx-auto animate-bounce mb-2" fill="currentColor" />
                  <h3 className="font-bold text-lg text-white uppercase tracking-wider">Training Completed!</h3>
                  <p className="text-xs text-slate-400">Score logged to clinical record successfully</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-white/5 p-4 rounded-xl bg-white/5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-widest">Score</span>
                    <strong className="text-xl font-extrabold text-white">{score}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-widest">Accuracy</span>
                    <strong className="text-xl font-extrabold text-emerald-450">{accuracy}%</strong>
                  </div>
                </div>

                <button
                  onClick={() => setActiveGame(null)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wider"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="active-match-game"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md space-y-5"
              >
                <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400">Moves: <strong className="text-white font-bold">{moves}</strong></span>
                  <span className="text-xs text-slate-400">Matches: <strong className="text-white font-bold">{matches} / 8</strong></span>
                </div>

                {/* Match Cards grid */}
                <div className="grid grid-cols-4 gap-3">
                  {cards.map((card, index) => {
                    const isOpen = card.isFlipped || card.isMatched;
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300 relative border ${
                          isOpen
                            ? 'bg-slate-900 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950 hover:bg-slate-900 border-white/10 hover:border-white/20 text-transparent'
                        }`}
                      >
                        <span className={`transform transition-all duration-300 ${isOpen ? 'scale-100' : 'scale-0'}`}>
                          {card.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
