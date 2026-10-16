import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { submitGameResultApi } from '../services/api';
import { Colors, Typography, Spacing } from '../constants/theme';
import { Header } from '../components/Header';
import { MemoryMatchGame } from '../games/MemoryMatchGame';
import { VisualSearchGame } from '../games/VisualSearchGame';
import { SpeedTapGame } from '../games/SpeedTapGame';
import { PatternSequenceGame } from '../games/PatternSequenceGame';

type GamePlayRouteProp = RouteProp<RootStackParamList, 'GamePlay'>;

export const GamePlayScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<GamePlayRouteProp>();

  const { gameName, difficulty = 'Medium', assignmentId } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGameComplete = async (result: {
    score: number;
    accuracy: number;
    timeTaken: number;
    moves: number;
  }) => {
    setIsSubmitting(true);
    try {
      await submitGameResultApi({
        assignmentId,
        gameName,
        difficulty,
        score: result.score,
        accuracy: result.accuracy,
        timeTaken: result.timeTaken,
        duration: result.timeTaken,
        moves: result.moves,
      });

      Alert.alert(
        'Result Recorded!',
        `Your score of ${result.score} (Accuracy: ${result.accuracy}%) has been saved to your clinical record and synced with your doctor.`,
        [
          {
            text: 'View Progress',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit game result:', error);
      Alert.alert(
        'Submission Notice',
        error.message || 'Could not save score to medical server. Please check connection.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuit = () => {
    Alert.alert(
      'Leave Exercise?',
      'Are you sure you want to stop this exercise session? Any progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const renderActiveGame = () => {
    const normalizedName = gameName.toLowerCase();

    if (normalizedName.includes('match') || normalizedName.includes('memory')) {
      return (
        <MemoryMatchGame
          difficulty={difficulty}
          onComplete={handleGameComplete}
          onQuit={handleQuit}
        />
      );
    }

    if (normalizedName.includes('visual') || normalizedName.includes('search')) {
      return (
        <VisualSearchGame
          difficulty={difficulty}
          onComplete={handleGameComplete}
          onQuit={handleQuit}
        />
      );
    }

    if (normalizedName.includes('speed') || normalizedName.includes('tap') || normalizedName.includes('reflex')) {
      return (
        <SpeedTapGame
          difficulty={difficulty}
          onComplete={handleGameComplete}
          onQuit={handleQuit}
        />
      );
    }

    if (normalizedName.includes('pattern') || normalizedName.includes('sequence') || normalizedName.includes('simon')) {
      return (
        <PatternSequenceGame
          difficulty={difficulty}
          onComplete={handleGameComplete}
          onQuit={handleQuit}
        />
      );
    }

    // Default to Memory Match
    return (
      <MemoryMatchGame
        difficulty={difficulty}
        onComplete={handleGameComplete}
        onQuit={handleQuit}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={gameName}
        subtitle={`${difficulty} Difficulty • Cognitive Training`}
        showBack
        onBack={handleQuit}
      />

      <View style={styles.gameContainer}>
        {renderActiveGame()}

        {isSubmitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.submittingText}>Recording score to clinical record...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 11, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  submittingText: {
    marginTop: Spacing.md,
    fontSize: Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: Typography.bold,
  },
});
