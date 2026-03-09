import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { colors } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult?.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result?.canceled && result?.assets?.[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSignup = async () => {
    if (!name?.trim() || !email?.trim() || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl: string | undefined;

      if (avatarUri) {
        try {
          const formData = new FormData();
          const filename = avatarUri.split('/').pop() ?? 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('file', {
            uri: avatarUri,
            name: filename,
            type,
          } as any);

          const uploadResult = await apiService.uploadImage(formData);
          avatarUrl = uploadResult?.url;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
        }
      }

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        avatarUrl,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Signup failed. Please try again.';
      Alert.alert('Signup Failed', message);
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
              Create Account
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign up to start chatting
            </Text>
          </View>

          <View style={styles.form}>
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              disabled={isLoading}
              mode="outlined"
              style={styles.input}
              textColor={colors.inputText}
              outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
            />

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
              autoComplete="password-new"
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
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              buttonColor={colors.primary}
              textColor={colors.textOnPrimary}
            >
              Sign Up
            </Button>

            <Button
              mode="text"
              onPress={() => navigation?.navigate?.('Login')}
              disabled={isLoading}
              style={styles.linkButton}
              textColor={colors.primaryLight}
            >
              Already have an account? Login
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
    marginBottom: 24,
    marginTop: 16,
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
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    color: colors.textMuted,
    fontSize: 14,
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
