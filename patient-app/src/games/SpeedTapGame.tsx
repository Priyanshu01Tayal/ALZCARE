import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Button } from '../components/Button';

interface SpeedTapGameProps {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onComplete: (result: {
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  }) => void;
  onQuit: () => void;
}

export const SpeedTapGame: React.FC<SpeedTapGameProps> = ({
  difficulty = 'Medium',
  onComplete,
  onQuit,
}) => {
  const padCount = difficulty === 'Easy' ? 4 : difficulty === 'Hard' ? 6 : 4;
  const targetRounds = difficulty === 'Easy' ? 8 : difficulty === 'Hard' ? 14 : 10;
  const timeoutMs = difficulty === 'Easy' ? 2500 : difficulty === 'Hard' ? 1200 : 1800;

  const [activePad, setActivePad] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMistakes] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [padActiveTime, setPadActiveTime] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [finalResult, setFinalResult] = useState<{
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  } | null>(null);

  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    startNewGame();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [difficulty]);

  const startNewGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRound(0);
    setHits(0);
    setMistakes(0);
    setReactionTimes([]);
    setIsCompleted(false);
    setFinalResult(null);
    setStartTime(Date.now());

    // Trigger first pad after 1 second countdown
    setTimeout(() => {
      triggerNextPad(1, 0, 0, []);
    }, 800);
  };

  const triggerNextPad = (
    currentRound: number,
    currHits: number,
    currMisses: number,
    times: number[]
  ) => {
    if (currentRound > targetRounds) {
      finishGame(currHits, currMisses, times);
      return;
    }

    setRound(currentRound);
    const randomPad = Math.floor(Math.random() * padCount);
    setActivePad(randomPad);
    const now = Date.now();
    setPadActiveTime(now);

    // Timeout if patient didn't tap in time
    timeoutRef.current = setTimeout(() => {
      setActivePad(null);
      const nextMisses = currMisses + 1;
      setMistakes(nextMisses);

      setTimeout(() => {
        triggerNextPad(currentRound + 1, currHits, nextMisses, times);
      }, 500);
    }, timeoutMs);
  };

  const handlePadPress = (padIndex: number) => {
    if (isCompleted || activePad === null) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (padIndex === activePad) {
      // Correct Tap!
      const rt = Date.now() - padActiveTime;
      const nextHits = hits + 1;
      const nextTimes = [...reactionTimes, rt];
      setHits(nextHits);
      setReactionTimes(nextTimes);
      setActivePad(null);

      setTimeout(() => {
        triggerNextPad(round + 1, nextHits, misses, nextTimes);
      }, 400);
    } else {
      // Missed Tap on Wrong Pad
      setActivePad(null);
      const nextMisses = misses + 1;
      setMistakes(nextMisses);

      setTimeout(() => {
        triggerNextPad(round + 1, hits, nextMisses, reactionTimes);
      }, 400);
    }
  };

  const finishGame = (finalHits = hits, finalMisses = misses, times = reactionTimes) => {
    setIsCompleted(true);
    setActivePad(null);
    const duration = Math.max(Math.round((Date.now() - startTime) / 1000), 1);
    const totalMoves = finalHits + finalMisses;
    const accuracy = totalMoves > 0 ? Math.round((finalHits / totalMoves) * 100) : 0;
    const avgRt = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 1000;
    const speedBonus = Math.max(1000 - avgRt, 0);
    const score = Math.max(finalHits * 80 + speedBonus - finalMisses * 25, 100);

    const result = {
      score,
      accuracy,
      timeTaken: duration,
      moves: totalMoves,
    };
    setFinalResult(result);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.prompt}>TAP THE GLOWING SENSOR QUICKLY</Text>
        <View style={styles.statusBar}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>ROUND</Text>
            <Text style={styles.statusVal}>
              {round} / {targetRounds}
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>HITS</Text>
            <Text style={[styles.statusVal, { color: Colors.emerald }]}>{hits}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>MISSES</Text>
            <Text style={[styles.statusVal, { color: Colors.rose }]}>{misses}</Text>
          </View>
        </View>
      </View>

      {/* Sensor Touch Pads */}
      <View style={styles.padsGrid}>
        {Array.from({ length: padCount }).map((_, index) => {
          const isActive = activePad === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => handlePadPress(index)}
              style={[
                styles.pad,
                isActive ? styles.padActive : styles.padInactive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Sensor Pad ${index + 1} ${isActive ? 'Active' : ''}`}
            >
              <View style={[styles.padInner, isActive && styles.padInnerActive]}>
                <Text style={styles.padIcon}>{isActive ? '⚡' : '🔘'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Completion Modal */}
      {isCompleted && finalResult && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>⚡</Text>
            <Text style={styles.completedTitle}>Reflex Challenge Complete!</Text>
            <Text style={styles.completedSubtitle}>
              Great psychomotor reaction and motor coordination.
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
                <Text style={styles.resultStatLabel}>Hits</Text>
                <Text style={styles.resultStatValue}>{hits}/{targetRounds}</Text>
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

      {/* Bottom Controls */}
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
const padSize = (windowWidth - Spacing.lg * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBanner: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prompt: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statusBox: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
  },
  statusVal: {
    fontSize: Typography.titleSmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  padsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.md,
  },
  pad: {
    width: padSize,
    height: padSize,
    borderRadius: padSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  padInactive: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
  padActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: Colors.amberLight,
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  padInner: {
    width: padSize - 30,
    height: padSize - 30,
    borderRadius: (padSize - 30) / 2,
    backgroundColor: Colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padInnerActive: {
    backgroundColor: Colors.amber,
  },
  padIcon: {
    fontSize: 32,
  },
  bottomControls: {
    flexDirection: 'row',
    gap: Spacing.md,
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
