import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { Avatar } from '../components/Avatar';
import { colors } from '../theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleSave = async () => {
    if (!name?.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setIsUpdating(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        try {
          const formData = new FormData();
          const filename = avatarUri.split('/').pop() ?? 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: avatarUri, name: filename, type } as any);
          const uploadResult = await apiService.uploadImage(formData);
          avatarUrl = uploadResult?.url;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
        }
      }
      const updatedUser = await apiService.updateProfile({
        name: name.trim(),
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      updateUser(updatedUser);
      setAvatarUri(null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error?.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await logout(); } catch (error) { Alert.alert('Error', 'Failed to logout'); }
        },
      },
    ]);
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setAvatarUri(null);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Profile</Text>
        </View>

        <View style={styles.avatarSection}>
          {isEditing ? (
            <Pressable onPress={pickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarLarge} />
              ) : (
                <Avatar uri={user?.avatarUrl} name={user?.name} size={120} />
              )}
              <View style={styles.avatarOverlay}>
                <Text style={styles.avatarOverlayText}>Change Photo</Text>
              </View>
            </Pressable>
          ) : (
            <Avatar uri={user?.avatarUrl} name={user?.name} size={120} />
          )}
        </View>

        <View style={styles.form}>
          {isEditing ? (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                disabled={isUpdating}
                textColor={colors.inputText}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
              />
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  disabled={isUpdating}
                  style={styles.buttonHalf}
                  textColor={colors.textSecondary}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={isUpdating}
                  disabled={isUpdating}
                  style={styles.buttonHalf}
                  buttonColor={colors.primary}
                  textColor={colors.textOnPrimary}
                >
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text variant="labelLarge" style={styles.label}>Name</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>{user?.name ?? 'Unknown'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="labelLarge" style={styles.label}>Email</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>{user?.email ?? 'Unknown'}</Text>
              </View>
              {user?.createdAt && (
                <View style={styles.infoRow}>
                  <Text variant="labelLarge" style={styles.label}>Member Since</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.button}
                contentStyle={styles.buttonContent}
                buttonColor={colors.primary}
                textColor={colors.textOnPrimary}
              >
                Edit Profile
              </Button>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.buttonContent}
            textColor={colors.error}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    paddingVertical: 4,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  avatarOverlayText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.inputBg,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    marginBottom: 4,
    color: colors.textMuted,
  },
  infoValue: {
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
    borderRadius: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
  footer: {
    marginTop: 'auto',
  },
  logoutButton: {
    borderRadius: 12,
    borderColor: colors.error,
  },
});
