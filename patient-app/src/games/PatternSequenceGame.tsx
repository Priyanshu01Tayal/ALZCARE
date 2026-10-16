import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Button } from '../components/Button';

interface PatternSequenceGameProps {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onComplete: (result: {
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  }) => void;
  onQuit: () => void;
}

const PAD_CONFIG = [
  { id: 0, label: 'Green', color: Colors.emerald, activeColor: '#6EE7B7' },
  { id: 1, label: 'Blue', color: Colors.indigo, activeColor: '#A5B4FC' },
  { id: 2, label: 'Amber', color: Colors.amber, activeColor: '#FDE68A' },
  { id: 3, label: 'Rose', color: Colors.rose, activeColor: '#FDA4AF' },
];

export const PatternSequenceGame: React.FC<PatternSequenceGameProps> = ({
  difficulty = 'Medium',
  onComplete,
  onQuit,
}) => {
  const maxLevels = difficulty === 'Easy' ? 4 : difficulty === 'Hard' ? 8 : 6;

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [litPad, setLitPad] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [level, setLevel] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  } | null>(null);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    setMistakes(0);
    setIsCompleted(false);
    setFinalResult(null);
    setStartTime(Date.now());

    // Generate initial sequence of length 2
    const initialSeq = [
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
    ];
    setSequence(initialSeq);
    setLevel(1);
    setPlayerStep(0);

    // Play initial sequence
    setTimeout(() => {
      playbackSequence(initialSeq);
    }, 700);
  };

  const playbackSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    setPlayerStep(0);

    for (let i = 0; i < seq.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setLitPad(seq[i]);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLitPad(null);
    }

    setIsShowingSequence(false);
  };

  const handlePadPress = (padId: number) => {
    if (isShowingSequence || isCompleted) return;

    // Flash tapped pad
    setLitPad(padId);
    setTimeout(() => setLitPad(null), 200);

    if (sequence[playerStep] === padId) {
      // Correct step
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);

      if (nextStep === sequence.length) {
        // Level cleared!
        if (level >= maxLevels) {
          // Finished game!
          finishGame(level, mistakes);
        } else {
          // Advance to next level
          const nextLevel = level + 1;
          const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
          setLevel(nextLevel);
          setSequence(nextSeq);

          setTimeout(() => {
            playbackSequence(nextSeq);
          }, 800);
        }
      }
    } else {
      // Wrong sequence tap!
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);

      if (nextMistakes >= 3 || level >= 3) {
        // Game over
        finishGame(level, nextMistakes);
      } else {
        // Repeat current sequence for patient
        setTimeout(() => {
          playbackSequence(sequence);
        }, 800);
      }
    }
  };

  const finishGame = (reachedLevel = level, errCount = mistakes) => {
    setIsCompleted(true);
    const duration = Math.max(Math.round((Date.now() - startTime) / 1000), 1);
    const baseScore = reachedLevel * 150;
    const penalty = errCount * 40;
    const score = Math.max(baseScore - penalty, 100);
    const accuracy = Math.min(Math.max(Math.round((reachedLevel / (reachedLevel + errCount)) * 100), 20), 100);

    const result = {
      score,
      accuracy,
      timeTaken: duration,
      moves: reachedLevel + errCount,
    };
    setFinalResult(result);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <Text style={styles.prompt}>
          {isShowingSequence ? 'WATCH THE SEQUENCE...' : 'YOUR TURN TO REPEAT!'}
        </Text>
        <View style={styles.statusBar}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>LEVEL</Text>
            <Text style={styles.statusVal}>
              {level} / {maxLevels}
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>SEQUENCE LENGTH</Text>
            <Text style={[styles.statusVal, { color: Colors.primaryLight }]}>
              {sequence.length}
            </Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>STEPS</Text>
            <Text style={styles.statusVal}>
              {playerStep} / {sequence.length}
            </Text>
          </View>
        </View>
      </View>

      {/* 2x2 Color Pads Grid */}
      <View style={styles.padsGrid}>
        {PAD_CONFIG.map((pad) => {
          const isLit = litPad === pad.id;

          return (
            <TouchableOpacity
              key={pad.id}
              activeOpacity={0.8}
              disabled={isShowingSequence || isCompleted}
              onPress={() => handlePadPress(pad.id)}
              style={[
                styles.pad,
                {
                  backgroundColor: isLit ? pad.activeColor : pad.color,
                  borderColor: isLit ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                  shadowColor: pad.color,
                  shadowOpacity: isLit ? 0.9 : 0.2,
                  transform: [{ scale: isLit ? 1.05 : 1.0 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${pad.label} Pad`}
            >
              <Text style={styles.padLabel}>{pad.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Completion Modal */}
      {isCompleted && finalResult && (
        <View style={styles.completedOverlay}>
          <View style={styles.completedCard}>
            <Text style={styles.completedIcon}>🧩</Text>
            <Text style={styles.completedTitle}>Sequence Exercise Complete!</Text>
            <Text style={styles.completedSubtitle}>
              Great exercise for working memory and sequential recall.
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
                <Text style={styles.resultStatLabel}>Level</Text>
                <Text style={styles.resultStatValue}>{level}/{maxLevels}</Text>
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
const padDimension = (windowWidth - Spacing.lg * 3) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  banner: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prompt: {
    fontSize: Typography.bodySmall,
    color: Colors.textTeal,
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
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  pad: {
    width: padDimension,
    height: padDimension,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  padLabel: {
    color: '#FFFFFF',
    fontSize: Typography.bodyLarge,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
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
