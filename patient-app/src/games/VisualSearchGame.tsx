import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Button } from '../components/Button';

interface VisualSearchGameProps {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onComplete: (result: {
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  }) => void;
  onQuit: () => void;
}

interface SymbolTile {
  id: number;
  symbol: string;
  isTarget: boolean;
  isFound: boolean;
  isError: boolean;
}

const ALL_SYMBOLS = ['🧠', '🧩', '⚡', '💡', '🔍', '⭐️', '🎯', '🎨', '🚀', '🔑', '💎', '🔔'];

export const VisualSearchGame: React.FC<VisualSearchGameProps> = ({
  difficulty = 'Medium',
  onComplete,
  onQuit,
}) => {
  const targetCount = difficulty === 'Easy' ? 4 : difficulty === 'Hard' ? 8 : 6;
  const totalGridSize = difficulty === 'Easy' ? 12 : difficulty === 'Hard' ? 20 : 16;
  const timeLimit = 30; // 30 seconds

  const [targetSymbol, setTargetSymbol] = useState<string>('🎯');
  const [tiles, setTiles] = useState<SymbolTile[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [finalResult, setFinalResult] = useState<{
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  } | null>(null);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  useEffect(() => {
    if (isCompleted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, timeLeft]);

  const startNewGame = () => {
    // Pick random target
    const randomTarget = ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
    setTargetSymbol(randomTarget);

    const otherSymbols = ALL_SYMBOLS.filter((s) => s !== randomTarget);

    // Create target items
    const targetItems: SymbolTile[] = Array.from({ length: targetCount }, (_, i) => ({
      id: i,
      symbol: randomTarget,
      isTarget: true,
      isFound: false,
      isError: false,
    }));

    // Create distractor items
    const distractorCount = totalGridSize - targetCount;
    const distractorItems: SymbolTile[] = Array.from({ length: distractorCount }, (_, i) => ({
      id: targetCount + i,
      symbol: otherSymbols[Math.floor(Math.random() * otherSymbols.length)],
      isTarget: false,
      isFound: false,
      isError: false,
    }));

    const shuffled = [...targetItems, ...distractorItems].sort(() => Math.random() - 0.5);

    setTiles(shuffled);
    setFoundCount(0);
    setMistakes(0);
    setTimeLeft(timeLimit);
    setIsCompleted(false);
    setFinalResult(null);
    setStartTime(Date.now());
  };

  const handleTilePress = (index: number) => {
    if (isCompleted || timeLeft <= 0) return;
    const tile = tiles[index];
    if (tile.isFound) return;

    if (tile.isTarget) {
      const updated = [...tiles];
      updated[index] = { ...tile, isFound: true };
      setTiles(updated);

      const nextFound = foundCount + 1;
      setFoundCount(nextFound);

      if (nextFound === targetCount) {
        finishGame(nextFound, mistakes);
      }
    } else {
      // Mistake!
      setMistakes((prev) => prev + 1);
      const updated = [...tiles];
      updated[index] = { ...tile, isError: true };
      setTiles(updated);

      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t, i) => (i === index ? { ...t, isError: false } : t))
        );
      }, 500);
    }
  };

  const finishGame = (currFound = foundCount, currMistakes = mistakes) => {
    setIsCompleted(true);
    const duration = Math.min(Math.round((Date.now() - startTime) / 1000), timeLimit);
    const totalTaps = currFound + currMistakes;
    const accuracy = totalTaps > 0 ? Math.round((currFound / totalTaps) * 100) : 0;
    const timeBonus = (timeLimit - duration) * 15;
    const baseScore = currFound * 100;
    const penalty = currMistakes * 30;
    const score = Math.max(baseScore + timeBonus - penalty, 100);

    const result = {
      score,
      accuracy,
      timeTaken: duration,
      moves: totalTaps,
    };
    setFinalResult(result);
  };

  return (
    <View style={styles.container}>
      {/* Target Focus Banner */}
      <View style={styles.targetBanner}>
        <Text style={styles.targetPrompt}>FIND ALL OCCURRENCES OF:</Text>
        <View style={styles.targetIconCircle}>
          <Text style={styles.targetIcon}>{targetSymbol}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            Found: <Text style={styles.statusHighlight}>{foundCount} / {targetCount}</Text>
          </Text>
          <Text style={styles.statusText}>
            Time: <Text style={[styles.statusHighlight, timeLeft <= 5 && { color: Colors.rose }]}>{timeLeft}s</Text>
          </Text>
        </View>
      </View>

      {/* Grid of Search Symbols */}
      <View style={styles.gridContainer}>
        {tiles.map((tile, index) => {
          return (
            <TouchableOpacity
              key={tile.id}
              activeOpacity={0.7}
              onPress={() => handleTilePress(index)}
              style={[
                styles.tile,
                tile.isFound && styles.tileFound,
                tile.isError && styles.tileError,
              ]}
            >
              <Text
                style={[
                  styles.tileText,
                  tile.isFound && styles.tileTextFound,
                ]}
              >
                {tile.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Game Result Modal */}
      {isCompleted && finalResult && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🎯</Text>
            <Text style={styles.completedTitle}>Visual Search Complete!</Text>
            <Text style={styles.completedSubtitle}>
              Great focus on visual scanning and target acquisition.
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Score</Text>
                <Text style={styles.resultStatValue}>{finalResult.score}</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Accuracy</Text>
                <Text style={[styles.resultStatValue, { color: Colors.emerald }]}>
                  {finalResult.accuracy}%
                </Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatLabel}>Found</Text>
                <Text style={styles.resultStatValue}>{foundCount}/{targetCount}</Text>
              </View>
            </View>

            <Button
              title="Save & Submit Result"
              onPress={() => onComplete(finalResult)}
              size="large"
              variant="success"
              style={styles.submitBtn}
            />

            <Button
              title="Play Again"
              onPress={startNewGame}
              variant="secondary"
              size="normal"
            />
          </View>
        </View>
      )}

      {/* Bottom Action Controls */}
      <View style={styles.bottomControls}>
        <Button
          title="Restart"
          onPress={startNewGame}
          variant="secondary"
          size="small"
          style={styles.bottomBtn}
        />
        <Button
          title="Exit"
          onPress={onQuit}
          variant="outline"
          size="small"
          style={styles.bottomBtn}
        />
      </View>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const tileSize = (windowWidth - Spacing.lg * 2 - Spacing.sm * 6) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetBanner: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderActive,
    marginBottom: Spacing.md,
  },
  targetPrompt: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
  },
  targetIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  targetIcon: {
    fontSize: 32,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  statusHighlight: {
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: 380,
  },
  tile: {
    width: tileSize,
    height: tileSize,
    borderRadius: 14,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tileFound: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: Colors.emerald,
  },
  tileError: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    borderColor: Colors.rose,
  },
  tileText: {
    fontSize: Typography.titleHero - 6,
  },
  tileTextFound: {
    transform: [{ scale: 1.15 }],
  },
  bottomControls: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  bottomBtn: {
    minWidth: 120,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 11, 20, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    zIndex: 100,
  },
  completedCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  completedIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  completedTitle: {
    fontSize: Typography.titleMedium,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  completedSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.cardSecondary,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
  },
  resultStatValue: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  submitBtn: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
});
