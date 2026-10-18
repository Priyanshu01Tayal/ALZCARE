import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { GamePlayScreen } from '../screens/GamePlayScreen';
import { DoctorInfoScreen } from '../screens/DoctorInfoScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { MedicationsScreen } from '../screens/MedicationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="GamePlay"
            component={GamePlayScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="DoctorInfo" component={DoctorInfoScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Medications" component={MedicationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
