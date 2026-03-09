import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabsParamList } from '../navigation/types';
import type { Conversation } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

type Props = NativeStackScreenProps<MainTabsParamList, 'Chats'>;

export const ConversationsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const response = await apiService.getConversations();
      setConversations(response?.conversations ?? []);
      setFilteredConversations(response?.conversations ?? []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await apiService.getOnlineUsers();
      setOnlineUsers(new Set(response?.onlineUsers ?? []));
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadOnlineUsers();

      const handleNewMessage = (data: any) => { loadConversations(); };
      socketService.onMessageNew(handleNewMessage);

      socketService.onUserOnline(({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      });

      socketService.onUserOffline(({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      return () => {
        socketService.offMessageNew();
        socketService.offUserOnline();
        socketService.offUserOffline();
      };
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query?.trim()) {
      const filtered = conversations?.filter?.(
        (conv) =>
          conv?.name?.toLowerCase()?.includes(query.toLowerCase()) ||
          conv?.participants?.some?.((p) => p?.name?.toLowerCase()?.includes(query.toLowerCase()))
      ) ?? [];
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  };

  const getConversationName = (conversation: Conversation): string => {
    if (conversation?.type === 'GROUP') return conversation?.name ?? 'Group Chat';
    return conversation?.participants?.[0]?.name ?? 'Unknown';
  };

  const getConversationAvatar = (conversation: Conversation): string | null | undefined => {
    if (conversation?.type === 'GROUP') return conversation?.avatarUrl;
    return conversation?.participants?.[0]?.avatarUrl;
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch { return ''; }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = getConversationName(item);
    const avatarUri = getConversationAvatar(item);
    const lastMessageContent = item?.lastMessage?.content ?? 'No messages yet';
    const timestamp = item?.lastMessage?.createdAt ? formatTimestamp(item.lastMessage.createdAt) : '';

    // Find if the other participant is online
    const otherParticipant = item.participants.find(p => p.id !== user?.id);
    const isOnline = otherParticipant ? onlineUsers.has(otherParticipant.id) : false;

    return (
      <Pressable
        onPress={() => navigation?.navigate?.('Chat', { conversationId: item?.id, name })}
        style={({ pressed }) => [
          styles.conversationItem,
          pressed && styles.conversationItemPressed,
        ]}
      >
        <Avatar uri={avatarUri} name={name} size={56} isOnline={isOnline} />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text variant="titleMedium" style={styles.conversationName} numberOfLines={1}>
              {name}
            </Text>
            {timestamp && (
              <Text variant="bodySmall" style={styles.timestamp}>
                {timestamp}
              </Text>
            )}
          </View>
          <View style={styles.conversationFooter}>
            <Text variant="bodyMedium" style={styles.lastMessage} numberOfLines={1}>
              {lastMessageContent}
            </Text>
            {(item?.unreadCount ?? 0) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) return <Loading message="Loading conversations..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Chats</Text>
        <Searchbar
          placeholder="Search conversations"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          placeholderTextColor={colors.searchPlaceholder}
          iconColor={colors.textMuted}
        />
      </View>

      {(filteredConversations?.length ?? 0) === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="titleMedium" style={styles.emptyTitle}>No conversations yet</Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Start a new chat to begin messaging
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item?.id ?? ''}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation?.navigate?.('NewChat')}
        color={colors.fabIcon}
        customSize={56}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: colors.searchBg,
    borderRadius: 12,
  },
  searchInput: {
    color: colors.searchText,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  conversationItemPressed: {
    backgroundColor: colors.surfaceVariant,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    flex: 1,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    color: colors.textMuted,
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    color: colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.badge,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: colors.badgeText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
    color: colors.text,
  },
  emptyMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.fab,
    borderRadius: 28,
  },
});
