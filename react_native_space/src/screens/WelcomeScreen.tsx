import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { colors } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineLarge" style={styles.title}>
          Welcome to ChatApp
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Connect instantly with friends and family
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          Send messages, share photos, and enjoy disappearing messages
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation?.navigate?.('Login')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
          textColor={colors.textOnPrimary}
        >
          Login
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation?.navigate?.('Signup')}
          style={[styles.button, styles.outlinedButton]}
          contentStyle={styles.buttonContent}
          textColor={colors.primaryLight}
        >
          Sign Up
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text,
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  description: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  buttonContainer: {
    padding: 24,
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
  outlinedButton: {
    borderColor: colors.primary,
  },
  buttonContent: {
    height: 52,
  },
});
