// App.js — Root navigation & auth gate
import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, Fredoka_400Regular, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

import { listenAuthState, getUserProfile } from './src/services/auth';
import { COLORS } from './src/config/theme';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import WaitingRoomScreen from './src/screens/WaitingRoomScreen';
import LudoGameScreen from './src/screens/LudoGameScreen';
import SnLGameScreen from './src/screens/SnLGameScreen';
import TicTacToeGameScreen from './src/screens/TicTacToeGameScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: COLORS.bgDark },
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        },
      ],
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.8, 1],
      }),
    },
  }),
};

export default function App() {
  // undefined = still checking auth, null = signed out, object = signed in
  const [authUser, setAuthUser] = useState(undefined);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [localUser, setLocalUser] = useState(null);

  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const unsub = listenAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        setProfileLoading(true);

        // Fetch profile — retry once because signInAsGuest writes the profile
        // AFTER the auth event fires (race condition).
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          await new Promise((r) => setTimeout(r, 1500));
          profile = await getUserProfile(firebaseUser.uid);
        }

        setUserProfile(profile);
        setProfileLoading(false);
      } else {
        setAuthUser(null);
        setUserProfile(null);
        setProfileLoading(false);
      }
    });
    return unsub;
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && authUser !== undefined) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authUser]);

  // Show spinner while fonts load, Firebase checks auth, or profile is loading
  if (!fontsLoaded || authUser === undefined || profileLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Construct the unified user object
  const user = (authUser && userProfile)
    ? { uid: authUser.uid, ...userProfile }
    : localUser;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          {!user ? (
            // Auth flow
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} setLocalUser={setLocalUser} />}
            </Stack.Screen>
          ) : (
            // Main app
            <>
              <Stack.Screen name="Home">
                {(props) => <HomeScreen {...props} user={user} setLocalUser={setLocalUser} />}
              </Stack.Screen>
              <Stack.Screen name="Lobby" component={LobbyScreen} />
              <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} />
              <Stack.Screen name="LudoGame" component={LudoGameScreen} />
              <Stack.Screen name="SnLGame" component={SnLGameScreen} />
              <Stack.Screen name="TicTacToeGame" component={TicTacToeGameScreen} />
              <Stack.Screen name="Results" component={ResultsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
