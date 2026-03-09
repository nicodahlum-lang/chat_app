import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { Text, Searchbar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../navigation/types';
import type { User } from '../types';
import { apiService } from '../services/api';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { colors } from '../theme';

type Props = NativeStackScreenProps<ChatsStackParamList, 'NewChat'>;

export const NewChatScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load all users when screen opens
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    setIsSearching(true);
    try {
      const results = await apiService.searchUsers('');
      setAllUsers(results ?? []);
      setUsers(results ?? []);
      setHasSearched(true);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query?.trim()) {
      setUsers(allUsers);
      setHasSearched(true);
      return;
    }
    // Filter locally from loaded users
    const q = query.toLowerCase();
    const filtered = allUsers.filter(
      (u) => u?.name?.toLowerCase()?.includes(q) || u?.email?.toLowerCase()?.includes(q)
    );
    setUsers(filtered);
    setHasSearched(true);
  };

  const handleSelectUser = async (user: User) => {
    try {
      const conversation = await apiService.createOneOnOne({ participantId: user?.id ?? '' });
      if (conversation?.id) {
        navigation?.replace?.('Chat', { conversationId: conversation.id, name: user?.name ?? 'Chat' });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation');
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      onPress={() => handleSelectUser(item)}
      style={({ pressed }) => [styles.userItem, pressed && styles.userItemPressed]}
    >
      <Avatar uri={item?.avatarUrl} name={item?.name} size={48} />
      <View style={styles.userInfo}>
        <Text variant="titleMedium" style={styles.userName}>{item?.name ?? 'Unknown'}</Text>
        <Text variant="bodyMedium" style={styles.userEmail}>{item?.email ?? ''}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search users by name or email"
          onChangeText={handleSearch}
          value={searchQuery}
          autoFocus
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          placeholderTextColor={colors.searchPlaceholder}
          iconColor={colors.textMuted}
        />
        <Button
          mode="outlined"
          onPress={() => navigation?.navigate?.('CreateGroup')}
          style={styles.createGroupButton}
          icon="account-multiple-plus"
          textColor={colors.primaryLight}
        >
          Create Group
        </Button>
      </View>

      {isSearching ? (
        <Loading message="Searching..." />
      ) : hasSearched && (users?.length ?? 0) === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>No users found</Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>Try a different search term</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>Search for users</Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Enter a name or email to find people to chat with
          </Text>
        </View>
      ) : (
        <FlatList data={users} renderItem={renderUser} keyExtractor={(item) => item?.id ?? ''} contentContainerStyle={styles.listContent} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, gap: 12 },
  searchBar: { elevation: 0, backgroundColor: colors.searchBg, borderRadius: 12 },
  searchInput: { color: colors.searchText },
  createGroupButton: { borderRadius: 12, borderColor: colors.primary },
  listContent: { flexGrow: 1 },
  userItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider, alignItems: 'center' },
  userItemPressed: { backgroundColor: colors.surfaceVariant },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontWeight: '600', marginBottom: 2, color: colors.text },
  userEmail: { color: colors.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginBottom: 8, textAlign: 'center', color: colors.text },
  emptyMessage: { color: colors.textSecondary, textAlign: 'center' },
});
