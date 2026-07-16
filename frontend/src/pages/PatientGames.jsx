import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, CheckCircle2, Play, Trophy, Clock, HelpCircle, RotateCcw } from 'lucide-react';

const PatientGames = () => {
  const { user } = useContext(AuthContext);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Game active session state
  const [activeGame, setActiveGame] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  // Results log history state
  const [gameResults, setGameResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchGames = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getGames(user._id || user.user?._id);
      setGames(res.data);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameResults = async () => {
    if (!user) return;
    try {
      setLoadingResults(true);
      const res = await api.getGameResults(user._id || user.user?._id);
      setGameResults(res.data);
    } catch (err) {
      console.error('Failed to load game results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchGames();
    fetchGameResults();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (activeGame && !gameFinished) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeGame, gameFinished]);

  const startGame = (assignment) => {
    setActiveGame(assignment);
    setMoves(0);
    setMatchesCount(0);
    setSeconds(0);
    setGameFinished(false);
    setSelectedCards([]);

    // Create deck: 8 emojis paired
    const emojis = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🍑', '🍋'];
    const deck = [];
    emojis.forEach((emoji, index) => {
      deck.push({ id: index * 2, symbol: emoji, isFlipped: false, isMatched: false });
      deck.push({ id: index * 2 + 1, symbol: emoji, isFlipped: false, isMatched: false });
    });

    // Shuffle deck
    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  };

  const handleCardClick = (index) => {
    if (gameFinished || cards[index].isFlipped || cards[index].isMatched || selectedCards.length >= 2) {
      return;
    }

    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);
      const first = newSelected[0];
      const second = newSelected[1];

      if (cards[first].symbol === cards[second].symbol) {
        setTimeout(() => {
          const matchedDeck = [...cards];
          matchedDeck[first].isMatched = true;
          matchedDeck[second].isMatched = true;
          setCards(matchedDeck);
          setSelectedCards([]);
          
          const newMatches = matchesCount + 1;
          setMatchesCount(newMatches);

          if (newMatches === 8) {
            setGameFinished(true);
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetDeck = [...cards];
          resetDeck[first].isFlipped = false;
          resetDeck[second].isFlipped = false;
          setCards(resetDeck);
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleSubmitResult = async () => {
    if (!activeGame) return;
    
    // Minimize accuracy at 10% increments
    const accuracy = Math.round((8 / Math.max(moves, 8)) * 100);
    const score = Math.max(2000 - moves * 50 - seconds * 10, 200);

    try {
      await api.submitGameResult({
        assignmentId: activeGame._id,
        score,
        accuracy,
        timeTaken: seconds
      });
      alert('Cognitive exercise result submitted successfully!');
      setActiveGame(null);
      fetchGames();
      fetchGameResults();
    } catch (err) {
      console.error(err);
      alert('Failed to save score log: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
      </div>
    );
  }

  const assignedGames = games.filter((g) => g.status === 'Assigned');

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
          <BrainCircuit className="h-5 w-5 text-clinical-600" />
          <span>My Cognitive Training Games</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Exercise working memory, language skills, and spatial coordination as prescribed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Assigned Games */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>Assigned Exercises</span>
            </h3>

            {assignedGames.length === 0 ? (
              <div className="p-8 text-center text-slate-450 bg-white border border-slate-150 rounded-xl text-xs">
                No active cognitive game assignments from your doctor.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedGames.map((g) => (
                  <div key={g._id} className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-clinical-600 bg-clinical-50 border border-clinical-150 px-2 py-0.5 rounded-full inline-block">
                          Active Training
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          g.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : (
                            g.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-150' : 'bg-amber-50 text-amber-700 border-amber-150'
                          )
                        }`}>
                          {g.difficulty || 'Medium'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">{g.gameName}</h4>
                      <p className="text-[10px] text-slate-400">
                        Assigned on {new Date(g.assignedAt || g.createdAt).toLocaleDateString()}
                        {g.dueDate && ` • Due by ${new Date(g.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => startGame(g)}
                      className="w-full flex items-center justify-center space-x-2 bg-clinical-600 hover:bg-clinical-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-md shadow-clinical-600/10"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start Exercises</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance History logs list */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-clinical-600" />
              <span>Cognitive Game Results History</span>
            </h3>

            {loadingResults ? (
              <div className="flex h-16 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-clinical-600 border-t-transparent"></div>
              </div>
            ) : gameResults.length === 0 ? (
              <div className="p-8 text-center text-slate-450 bg-white border border-slate-150 rounded-xl text-xs">
                No cognitive training metrics recorded yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-150 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                      <th className="py-3 px-6">Exercise Game</th>
                      <th className="py-3 px-6">Score</th>
                      <th className="py-3 px-6">Accuracy</th>
                      <th className="py-3 px-6">Time Taken</th>
                      <th className="py-3 px-6">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gameResults.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/30">
                        <td className="py-3 px-6 font-bold text-slate-800">{r.gameName}</td>
                        <td className="py-3 px-6 font-mono font-bold text-clinical-600">{r.score}</td>
                        <td className="py-3 px-6 text-slate-655 font-semibold">{r.accuracy}%</td>
                        <td className="py-3 px-6 text-slate-500">{r.timeTaken} seconds</td>
                        <td className="py-3 px-6 text-slate-400">
                          {new Date(r.completionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Game Guidelines info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-150 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-clinical-600" />
              <span>Training Guidelines</span>
            </h3>
            
            <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
              <p>
                Cognitive support training is a daily clinical recommendation. These games are designed to stimulate memory recall, verbal association speed, and spatial coordination.
              </p>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p><strong>Memory Match:</strong> Matches card pairs. Stimulates working visual memory pathways.</p>
                <p><strong>Visual Search:</strong> Locates specific shapes within cluttered arrays. Stimulates focus and speed.</p>
                <p><strong>Accuracy:</strong> Calculated based on mistakes. Strive for 100% accuracy by matching with minimal wrong flips!</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Match Game Modal Overlay */}
      {activeGame && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 flex flex-col space-y-6">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-clinical-600 uppercase tracking-wider block">
                  Interactive Training
                </span>
                <h3 className="text-lg font-bold text-slate-800">{activeGame.gameName}</h3>
              </div>
              
              <button
                onClick={() => setActiveGame(null)}
                className="text-slate-400 hover:text-slate-655 text-xs font-bold px-2 py-1 bg-slate-100 rounded"
              >
                Quit Game
              </button>
            </div>

            {/* Scoreboard metrics row */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-450 uppercase block">Timer</span>
                <span className="text-sm font-bold text-slate-700 font-mono">
                  {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-450 uppercase block">Flips (Moves)</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{moves}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-450 uppercase block">Matches</span>
                <span className="text-sm font-bold text-slate-700 font-mono">{matchesCount} / 8</span>
              </div>
            </div>

            {/* Game Card Grid Viewport */}
            {!gameFinished ? (
              <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto w-full aspect-square">
                {cards.map((card, idx) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    className={`aspect-square rounded-xl border text-2xl flex items-center justify-center transition-all duration-300 font-bold focus:outline-none ${
                      card.isFlipped || card.isMatched
                        ? 'bg-clinical-50 border-clinical-300 text-slate-800 scale-95 shadow-inner'
                        : 'bg-clinical-600 border-clinical-700 hover:bg-clinical-500 text-white shadow-md'
                    }`}
                  >
                    {(card.isFlipped || card.isMatched) ? card.symbol : '?'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-6 text-center space-y-4">
                <Trophy className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-800 text-lg">Brain Exercise Completed!</h4>
                  <p className="text-xs text-emerald-600">You matched all cards successfully. Let's record the score.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-left pt-2 border-t border-emerald-100 text-xs">
                  <div>
                    <span className="text-slate-500">Accuracy Score:</span>
                    <strong className="block text-slate-800 text-sm font-bold">
                      {Math.round((8 / Math.max(moves, 8)) * 100)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Duration:</span>
                    <strong className="block text-slate-800 text-sm font-bold">{seconds} seconds</strong>
                  </div>
                </div>

                <button
                  onClick={handleSubmitResult}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10"
                >
                  Log Cognitive Results & Submit
                </button>
              </div>
            )}

            {/* Restart option */}
            {!gameFinished && (
              <button
                onClick={() => startGame(activeGame)}
                className="inline-flex items-center space-x-1 justify-center text-xs font-semibold text-slate-450 hover:text-slate-655 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Grid</span>
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PatientGames;
