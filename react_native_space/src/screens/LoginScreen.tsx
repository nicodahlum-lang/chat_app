import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email?.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Login to continue chatting
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              disabled={isLoading}
              mode="outlined"
              style={styles.input}
              textColor={colors.inputText}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              disabled={isLoading}
              mode="outlined"
              style={styles.input}
              textColor={colors.inputText}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={colors.textMuted}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
              textColor={colors.textOnPrimary}
            >
              Login
            </Button>

            <Button
              mode="text"
              onPress={() => navigation?.navigate?.('Signup')}
              disabled={isLoading}
              style={styles.linkButton}
              textColor={colors.primaryLight}
            >
              Don't have an account? Sign Up
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    marginTop: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: colors.errorBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.inputBg,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
  linkButton: {
    marginTop: 8,
  },
});
