import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button, Searchbar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../navigation/types';
import type { User } from '../types';
import { apiService } from '../services/api';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { colors } from '../theme';

type Props = NativeStackScreenProps<ChatsStackParamList, 'CreateGroup'>;

export const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult?.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any, allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result?.canceled && result?.assets?.[0]?.uri) setAvatarUri(result.assets[0].uri);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query?.trim()) { setUsers([]); return; }
    setIsSearching(true);
    try {
      const results = await apiService.searchUsers(query.trim());
      setUsers(results ?? []);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally { setIsSearching(false); }
  };

  const toggleUserSelection = (user: User) => {
    const isSelected = selectedUsers?.some?.((u) => u?.id === user?.id);
    if (isSelected) setSelectedUsers(selectedUsers?.filter?.((u) => u?.id !== user?.id) ?? []);
    else setSelectedUsers([...(selectedUsers ?? []), user]);
  };

  const handleCreateGroup = async () => {
    if (!groupName?.trim()) { Alert.alert('Error', 'Please enter a group name'); return; }
    if ((selectedUsers?.length ?? 0) < 2) { Alert.alert('Error', 'Please select at least 2 members'); return; }
    setIsCreating(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarUri) {
        try {
          const formData = new FormData();
          const filename = avatarUri.split('/').pop() ?? 'group.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: avatarUri, name: filename, type } as any);
          const uploadResult = await apiService.uploadImage(formData);
          avatarUrl = uploadResult?.url;
        } catch (uploadError) { console.error('Avatar upload error:', uploadError); }
      }
      const participantIds = selectedUsers?.map?.((u) => u?.id ?? '') ?? [];
      const conversation = await apiService.createGroup({ name: groupName.trim(), participantIds, avatarUrl });
      if (conversation?.id) navigation?.replace?.('Chat', { conversationId: conversation.id, name: groupName.trim() });
    } catch (error: any) {
      console.error('Error creating group:', error);
      const message = error?.response?.data?.message || 'Failed to create group';
      Alert.alert('Error', message);
    } finally { setIsCreating(false); }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers?.some?.((u) => u?.id === item?.id);
    return (
      <Pressable
        onPress={() => toggleUserSelection(item)}
        style={({ pressed }) => [styles.userItem, pressed && styles.userItemPressed, isSelected && styles.userItemSelected]}
      >
        <Avatar uri={item?.avatarUrl} name={item?.name} size={48} />
        <View style={styles.userInfo}>
          <Text variant="titleMedium" style={styles.userName}>{item?.name ?? 'Unknown'}</Text>
          <Text variant="bodyMedium" style={styles.userEmail}>{item?.email ?? ''}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>Add Group Photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              label="Group Name" value={groupName} onChangeText={setGroupName} mode="outlined"
              style={styles.input} textColor={colors.inputText} outlineColor={colors.inputBorder}
              activeOutlineColor={colors.primary}
              theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
            />

            {(selectedUsers?.length ?? 0) > 0 && (
              <View style={styles.selectedContainer}>
                <Text variant="titleSmall" style={styles.selectedTitle}>
                  Selected Members ({selectedUsers?.length ?? 0})
                </Text>
                <View style={styles.chipContainer}>
                  {selectedUsers?.map?.((user) => (
                    <Chip key={user?.id} onClose={() => toggleUserSelection(user)} style={styles.chip}
                      textStyle={{ color: colors.text }}>
                      {user?.name ?? 'Unknown'}
                    </Chip>
                  )) ?? []}
                </View>
              </View>
            )}

            <Searchbar
              placeholder="Search users to add" onChangeText={handleSearch} value={searchQuery}
              style={styles.searchBar} inputStyle={styles.searchInput}
              placeholderTextColor={colors.searchPlaceholder} iconColor={colors.textMuted}
            />
          </View>

          {isSearching ? (
            <Loading message="Searching..." />
          ) : (users?.length ?? 0) > 0 ? (
            <View style={styles.userListContainer}>
              <FlatList data={users} renderItem={renderUser} keyExtractor={(item) => item?.id ?? ''} scrollEnabled={false} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained" onPress={handleCreateGroup} loading={isCreating}
            disabled={isCreating || (selectedUsers?.length ?? 0) < 2 || !groupName?.trim()}
            style={styles.createButton} contentStyle={styles.buttonContent}
            buttonColor={colors.primary} textColor={colors.textOnPrimary}
          >
            Create Group
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  form: { padding: 16, gap: 16 },
  avatarContainer: { alignSelf: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.inputBorder, borderStyle: 'dashed',
  },
  avatarPlaceholderText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  input: { backgroundColor: colors.inputBg },
  selectedContainer: { gap: 8 },
  selectedTitle: { fontWeight: '600', color: colors.text },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginRight: 0, backgroundColor: colors.surfaceVariant },
  searchBar: { elevation: 0, backgroundColor: colors.searchBg, borderRadius: 12 },
  searchInput: { color: colors.searchText },
  userListContainer: { flex: 1 },
  userItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: 'center' },
  userItemPressed: { backgroundColor: colors.surfaceVariant },
  userItemSelected: { backgroundColor: colors.primarySurface },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontWeight: '600', marginBottom: 2, color: colors.text },
  userEmail: { color: colors.textSecondary },
  checkmark: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' },
  checkmarkText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  createButton: { borderRadius: 12 },
  buttonContent: { height: 52 },
});
