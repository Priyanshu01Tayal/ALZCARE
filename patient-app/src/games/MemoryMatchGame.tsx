import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Button } from '../components/Button';

interface MemoryMatchGameProps {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onComplete: (result: {
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  }) => void;
  onQuit: () => void;
}

interface CardItem {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_SETS = ['🧠', '🧩', '⚡', '💡', '🔍', '⭐️', '🎯', '🎨'];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  difficulty = 'Medium',
  onComplete,
  onQuit,
}) => {
  // Easy: 4 pairs (8 cards, 4x2)
  // Medium: 6 pairs (12 cards, 4x3)
  // Hard: 8 pairs (16 cards, 4x4)
  const pairCount = difficulty === 'Easy' ? 4 : difficulty === 'Hard' ? 8 : 6;

  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  } | null>(null);

  // Initialize game deck
  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  // Live timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const startNewGame = () => {
    const selectedEmojis = EMOJI_SETS.slice(0, pairCount);
    const deck = [...selectedEmojis, ...selectedEmojis]
      .map((emoji, idx) => ({
        id: idx,
        value: emoji,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setElapsedSeconds(0);
    setStartTime(Date.now());
    setIsCompleted(false);
    setFinalResult(null);
  };

  const handleCardPress = (index: number) => {
    if (isCompleted) return;
    if (selectedCards.length === 2) return;
    if (cards[index].isFlipped || cards[index].isMatched) return;

    // Flip card
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newSelected;

      if (cards[firstIdx].value === cards[secondIdx].value) {
        // MATCH!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);

          setMatches((m) => {
            const next = m + 1;
            if (next === pairCount) {
              handleGameOver();
            }
            return next;
          });
        }, 300);
      } else {
        // NO MATCH -> Flip back after pause
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedCards([]);
        }, 750);
      }
    }
  };

  const handleGameOver = () => {
    setIsCompleted(true);
    const duration = Math.max(Math.round((Date.now() - startTime) / 1000), elapsedSeconds, 1);
    const calculatedAccuracy = Math.min(
      Math.max(Math.round((pairCount / (moves + 1)) * 100), 10),
      100
    );
    const calculatedScore = Math.max(1000 - duration * 5 - (moves + 1) * 10, 100);

    const resultData = {
      score: calculatedScore,
      accuracy: calculatedAccuracy,
      timeTaken: duration,
      moves: moves + 1,
    };

    setFinalResult(resultData);
  };

  const submitResult = () => {
    if (finalResult) {
      onComplete(finalResult);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>MATCHES</Text>
          <Text style={styles.statusValue}>
            {matches} / {pairCount}
          </Text>
        </View>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>MOVES</Text>
          <Text style={styles.statusValue}>{moves}</Text>
        </View>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>TIME</Text>
          <Text style={styles.statusValue}>{elapsedSeconds}s</Text>
        </View>
      </View>

      {/* Grid of Cards */}
      <View style={styles.gridContainer}>
        {cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;

          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.8}
              onPress={() => handleCardPress(index)}
              style={[
                styles.card,
                isRevealed ? styles.cardRevealed : styles.cardHidden,
                card.isMatched && styles.cardMatched,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isRevealed ? `Card revealed ${card.value}` : `Hidden Card ${index + 1}`
              }
            >
              <Text style={styles.cardEmoji}>{isRevealed ? card.value : '?'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Completion Modal / Summary Panel */}
      {isCompleted && finalResult && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🌟</Text>
            <Text style={styles.completedTitle}>Exercise Completed!</Text>
            <Text style={styles.completedSubtitle}>
              Excellent work exercising your visual memory.
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
                <Text style={styles.resultStatLabel}>Duration</Text>
                <Text style={styles.resultStatValue}>{finalResult.timeTaken}s</Text>
              </View>
            </View>

            <Button
              title="Save & Submit Result"
              onPress={submitResult}
              size="large"
              variant="success"
              style={styles.submitBtn}
            />

            <Button
              title="Play Again"
              onPress={startNewGame}
              variant="secondary"
              size="normal"
              style={styles.retryBtn}
            />
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <Button
          title="Restart Exercise"
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
const cardSize = (windowWidth - Spacing.lg * 2 - Spacing.sm * 6) / 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statusBox: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    maxWidth: 380,
    marginVertical: Spacing.sm,
  },
  card: {
    width: cardSize,
    height: cardSize,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cardHidden: {
    backgroundColor: Colors.cardSecondary,
    borderColor: Colors.border,
  },
  cardRevealed: {
    backgroundColor: '#0F2936',
    borderColor: Colors.primary,
  },
  cardMatched: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.emerald,
    opacity: 0.85,
  },
  cardEmoji: {
    fontSize: Typography.titleHero - 4,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
  },
  bottomBtn: {
    minWidth: 130,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 11, 20, 0.88)',
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
    textAlign: 'center',
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
  retryBtn: {
    width: '100%',
  },
});
