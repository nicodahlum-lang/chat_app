import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
  Keyboard,
  Linking,
  ImageBackground,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Text, TextInput, IconButton, Menu, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../navigation/types';
import type { Message } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { AuthContext } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { Loading } from '../components/Loading';
import { AudioPlayer } from '../components/AudioPlayer';
import { cryptoService } from '../services/crypto';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

type Props = NativeStackScreenProps<ChatsStackParamList, 'Chat'>;

interface DisappearingMessageTimerState {
  [messageId: string]: { viewedAt: Date; durationSeconds: number };
}

export const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { conversationId, name } = route?.params ?? {};
  const { user, updateUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDisappearingMode, setIsDisappearingMode] = useState(false);
  const [disappearDurationSeconds] = useState(10);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [disappearingTimers, setDisappearingTimers] = useState<DisappearingMessageTimerState>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reactionMenuVisible, setReactionMenuVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  useEffect(() => {
    if (!conversationId) return;

    const navTitle = name ?? 'Chat';
    navigation?.setOptions?.({
      title: navTitle,
      headerTitle: () => (
        <View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>{navTitle}</Text>
          {isOtherUserOnline && <Text style={{ fontSize: 12, color: '#10B981' }}>Online</Text>}
        </View>
      ),
      headerRight: () => (
        <IconButton
          icon="phone"
          iconColor={colors.primary}
          size={24}
          onPress={() => navigation.navigate('Call', { conversationId, name: navTitle, isIncoming: false })}
        />
      ),
    });

    loadMessages();
    markAsRead();
    socketService.joinConversation(conversationId);

    // Fetch initial online status (simplified, assumes 1-on-1 for the status text)
    apiService.getOnlineUsers().then(res => {
      // we need to know the other user's id... but we don't have it explicitly stored in chat screen state right now
      // Actually we have messages! We can check if any message from other user is in the online list once messages arrive
      // A better way is to rely on socket events or check participants...
      // Since it's a bit complex to find the exact other userId from ChatScreen immediately, 
      // we will rely heavily on the UserOnline event, but we can also check the current messages:
    }).catch(console.error);

    socketService.onMessageNew(async (data) => {
      if (data?.conversationId === conversationId) {
        let msg = data.message;
        if (msg.messageType === 'TEXT' && msg.content) {
          msg = { ...msg, content: await cryptoService.decryptMessage(msg.content) };
        }
        setMessages((prev) => [msg, ...(prev ?? [])]);
        markAsRead();
        if (msg.isDisappearing && msg.senderId !== user?.id) {
          handleViewDisappearingMessage(msg);
        }
      }
    });

    socketService.onTypingStart((data) => {
      if (data?.conversationId === conversationId && data?.userId !== user?.id) {
        setTypingUsers((prev) => [...(prev ?? []), data?.userName ?? 'Someone']);
      }
    });

    socketService.onTypingStop((data) => {
      if (data?.conversationId === conversationId) {
        setTypingUsers((prev) => prev?.filter?.((name) => name !== data?.userName) ?? []);
      }
    });

    socketService.onMessageViewed(({ messageId, userId, viewedAt }) => {
      setMessages((prev) => prev?.map?.((m) => {
        if (m?.id === messageId) {
          const views = m?.viewedBy ? [...m.viewedBy] : [];
          if (!views.find((v) => v?.userId === userId)) {
            views.push({ userId, viewedAt });
          }
          return { ...m, viewedBy: views };
        }
        return m;
      }) ?? []);
    });

    socketService.onMessageDeleted(({ messageId }) => {
      setMessages((prev) => prev?.map?.((m) => {
        if (m?.id === messageId) {
          return { ...m, isDeleted: true, content: null, imageUrl: null, audioUrl: null, messageType: 'TEXT' };
        }
        return m;
      }) ?? []);
    });

    socketService.onMessageReaction(({ messageId, userId, emoji }) => {
      setMessages((prev) => prev?.map?.((m) => {
        if (m?.id === messageId) {
          let reactions = m.reactions ? [...m.reactions] : [];
          if (!emoji) {
            // Remove reaction
            reactions = reactions.filter(r => r.userId !== userId);
          } else {
            const existingIndex = reactions.findIndex(r => r.userId === userId);
            if (existingIndex > -1) {
              reactions[existingIndex] = { userId, emoji };
            } else {
              reactions.push({ userId, emoji });
            }
          }
          return { ...m, reactions };
        }
        return m;
      }) ?? []);
    });

    socketService.onUserOnline(({ userId }) => {
      if (userId !== user?.id) {
        // If we know the other user is online, set it. 
        // Note: For group chats this might just show "Online" if ANY participant is online
        setIsOtherUserOnline(true);
      }
    });

    socketService.onUserOffline(({ userId }) => {
      if (userId !== user?.id) {
        setIsOtherUserOnline(false);
      }
    });

    const unsubscribeCallOffer = socketService.onCallOffer((data) => {
      if (data.conversationId === conversationId && data.callerId !== user?.id) {
        Alert.alert(
          "Incoming Video Call",
          `${data.callerName || 'Someone'} is calling you...`,
          [
            { text: "Decline", style: "cancel" },
            {
              text: "Accept",
              onPress: () => navigation.navigate('Call', {
                conversationId,
                name: data.callerName || 'Someone',
                isIncoming: true,
                offer: data.offer
              })
            }
          ]
        );
      }
    });

    return () => {
      socketService.leaveConversation(conversationId);
      socketService.offMessageNew();
      socketService.offTypingStart();
      socketService.offTypingStop();
      socketService.offMessageViewed();
      socketService.offMessageDeleted();
      socketService.offMessageReaction();
      socketService.offUserOffline();
      unsubscribeCallOffer();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, name, user?.id, isOtherUserOnline]); // Reacting to isOtherUserOnline to update header

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    Object.entries(disappearingTimers ?? {}).forEach(([messageId, timer]) => {
      const { viewedAt, durationSeconds } = timer ?? {};
      if (!viewedAt || !durationSeconds) return;
      const elapsedMs = Date.now() - viewedAt.getTime();
      const remainingMs = (durationSeconds * 1000) - elapsedMs;
      if (remainingMs > 0) {
        const timeout = setTimeout(() => {
          setMessages((prev) => prev?.filter?.((m) => m?.id !== messageId) ?? []);
          setDisappearingTimers((timers) => { const n = { ...(timers ?? {}) }; delete n[messageId]; return n; });
        }, remainingMs);
        intervals.push(timeout);
      } else {
        setMessages((prev) => prev?.filter?.((m) => m?.id !== messageId) ?? []);
      }
    });
    return () => { intervals.forEach(clearTimeout); };
  }, [disappearingTimers]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await apiService.getMessages(conversationId, 50);

      // Decrypt text messages
      const decryptedMessages = await Promise.all((response?.messages ?? []).map(async (m) => {
        if (m.messageType === 'TEXT' && m.content) {
          return { ...m, content: await cryptoService.decryptMessage(m.content) };
        }
        return m;
      }));

      setMessages(decryptedMessages);
      setHasMore(response?.hasMore ?? false);

      if (response?.messages?.length > 0) {
        // Find the other user's ID to check initial online status
        const otherUserId = response.messages.find(m => m.senderId !== user?.id)?.senderId;
        if (otherUserId) {
          apiService.getOnlineUsers().then(res => {
            if (res.onlineUsers.includes(otherUserId)) {
              setIsOtherUserOnline(true);
            }
          }).catch(console.error);
        }
      }

      // Initialize disappearing timers for my recently viewed messages
      response?.messages?.forEach?.((message) => {
        if (message?.isDisappearing && message?.viewedBy?.length > 0) {
          const myView = message.viewedBy.find((v) => v?.userId === user?.id);
          if (myView && message?.disappearDurationSeconds) {
            setDisappearingTimers((timers) => ({
              ...(timers ?? {}),
              [message.id]: { viewedAt: new Date(myView.viewedAt), durationSeconds: message.disappearDurationSeconds ?? 10 },
            }));
          }
        }
      });
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally { setIsLoading(false); }
  };

  const markAsRead = async () => {
    if (!conversationId) return;
    try { await apiService.markConversationAsRead(conversationId); } catch (error) { console.error('Error marking as read:', error); }
  };

  const handleViewDisappearingMessage = async (message: Message) => {
    if (!message?.isDisappearing || !message?.id) return;
    const alreadyViewed = message?.viewedBy?.some?.((v) => v?.userId === user?.id);
    if (alreadyViewed) return;
    try {
      await apiService.viewMessage(message.id);
      const viewedAt = new Date();
      if (message?.disappearDurationSeconds) {
        setDisappearingTimers((timers) => ({
          ...(timers ?? {}),
          [message.id]: { viewedAt, durationSeconds: message.disappearDurationSeconds ?? 10 },
        }));
      }
    } catch (error) { console.error('Error marking message as viewed:', error); }
  };

  const handleSendText = async () => {
    const text = inputText?.trim();
    if (!text || !conversationId) return;
    setInputText('');
    setIsSending(true);
    Keyboard.dismiss();
    try {
      let encryptedText = text;
      // Get recipient public key (simplified strategy: first other user in chat)
      const otherUserId = messages.find(m => m.senderId !== user?.id)?.senderId;
      if (otherUserId) {
        const pubKey = await apiService.getPublicKey(otherUserId);
        if (pubKey) {
          encryptedText = await cryptoService.encryptMessage(text, pubKey);
        }
      }

      await apiService.sendMessage(conversationId, {
        content: encryptedText, messageType: 'TEXT',
        isDisappearing: isDisappearingMode,
        disappearDurationSeconds: isDisappearingMode ? disappearDurationSeconds : undefined,
        replyToId: replyingTo?.id,
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(text);
    } finally { setIsSending(false); }
  };

  const handleSendImage = async () => {
    if (!conversationId) return;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult?.granted === false) { Alert.alert('Permission Required', 'Please allow access to your photo library'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images' as any, allowsEditing: true, quality: 0.8 });
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        setIsSending(true);
        try {
          const formData = new FormData();
          const filename = imageUri.split('/').pop() ?? 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: imageUri, name: filename, type } as any);
          const uploadResult = await apiService.uploadImage(formData);
          await apiService.sendMessage(conversationId, {
            messageType: 'IMAGE', imageUrl: uploadResult?.url,
            isDisappearing: isDisappearingMode,
            disappearDurationSeconds: isDisappearingMode ? disappearDurationSeconds : undefined,
            replyToId: replyingTo?.id,
          });
          setReplyingTo(null);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Error', 'Failed to upload image');
        } finally { setIsSending(false); }
      }
    } catch (error) { console.error('Error picking image:', error); Alert.alert('Error', 'Failed to pick image'); }
  };

  const handleRecordAudio = async () => {
    if (!conversationId) return;

    if (isRecording) {
      // Stop recording
      try {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setIsRecording(false);
        setRecordingDuration(0);

        if (!recordingRef.current) return;
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (!uri) {
          Alert.alert('Error', 'No recording found');
          return;
        }

        setIsSending(true);
        try {
          const formData = new FormData();
          const filename = `voice_${Date.now()}.m4a`;

          if (Platform.OS === 'web') {
            // Web: fetch the blob from the URI and create a File
            const response = await fetch(uri);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: 'audio/mp4' });
            formData.append('file', file);
          } else {
            // Native: use the React Native format
            formData.append('file', {
              uri,
              name: filename,
              type: 'audio/m4a',
            } as any);
          }

          const uploadResult = await apiService.uploadAudio(formData);
          await apiService.sendMessage(conversationId, {
            messageType: 'AUDIO',
            audioUrl: uploadResult?.url,
            isDisappearing: isDisappearingMode,
            disappearDurationSeconds: isDisappearingMode ? disappearDurationSeconds : undefined,
            replyToId: replyingTo?.id,
          });
          setReplyingTo(null);
        } catch (uploadError) {
          console.error('Error uploading audio:', uploadError);
          Alert.alert('Error', 'Failed to send voice message');
        } finally {
          setIsSending(false);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        setRecordingDuration(0);
      }
    } else {
      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission?.granted) {
          Alert.alert('Permission Required', 'Please allow microphone access to record voice messages');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setIsRecording(true);
        setRecordingDuration(0);

        // Timer for recording duration
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording');
      }
    }
  };

  const getTimeRemaining = (messageId: string): number => {
    const timer = disappearingTimers?.[messageId];
    if (!timer) return 0;
    const { viewedAt, durationSeconds } = timer;
    const elapsedMs = Date.now() - viewedAt.getTime();
    const remainingMs = (durationSeconds * 1000) - elapsedMs;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!conversationId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.startTyping(conversationId);
    typingTimeoutRef.current = setTimeout(() => { socketService.stopTyping(conversationId); }, 2000);
  };

  const handleChangeBackground = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult?.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result?.canceled && result?.assets?.[0]?.uri) {
        setMenuVisible(false);
        const imageUri = result.assets[0].uri;
        setIsSending(true);

        try {
          const formData = new FormData();
          const filename = imageUri.split('/').pop() ?? 'background.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('file', { uri: imageUri, name: filename, type } as any);

          const uploadResult = await apiService.uploadImage(formData);
          const updateResult = await apiService.updateBackground(uploadResult.url);

          if (updateResult.success && user) {
            updateUser({ ...user, themeBackground: uploadResult.url });
            Alert.alert('Success', 'Chat background updated');
          }
        } catch (error) {
          console.error('Error uploading background:', error);
          Alert.alert('Error', 'Failed to update background');
        } finally {
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('Error picking background:', error);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      setMenuVisible(false);
      const result = await apiService.updateBackground(null);
      if (result.success && user) {
        updateUser({ ...user, themeBackground: null });
        Alert.alert('Success', 'Chat background removed');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      Alert.alert('Error', 'Failed to remove background');
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.isDeleted) return;
    setSelectedMessage(message);
    setReactionMenuVisible(true);
  };

  const handleReact = async (emoji: string) => {
    if (!selectedMessage) return;
    setReactionMenuVisible(false);
    try {
      await apiService.reactToMessage(selectedMessage.id, emoji);
      // Optimistic update
      setMessages((prev) => prev.map(m => {
        if (m.id === selectedMessage.id) {
          let reactions = m.reactions ? [...m.reactions] : [];
          const existing = reactions.find(r => r.userId === user?.id);
          if (existing?.emoji === emoji) {
            reactions = reactions.filter(r => r.userId !== user?.id);
          } else if (existing) {
            existing.emoji = emoji;
          } else {
            reactions.push({ userId: user?.id ?? '', emoji });
          }
          return { ...m, reactions };
        }
        return m;
      }));
    } catch (error) {
      console.error('Failed to react:', error);
    }
    setSelectedMessage(null);
  };

  const handleDeleteMessage = (message: Message) => {
    if (message.senderId !== user?.id || message.isDeleted) return;

    Alert.alert(
      'Nachricht löschen',
      'Möchtest du diese Nachricht wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMessage(message.id);
            } catch (error) {
              console.error('Failed to delete message:', error);
              Alert.alert('Fehler', 'Nachricht konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item?.senderId === user?.id;
    const hasBeenViewed = (item?.viewedBy?.length ?? 0) > 0;
    const timeRemaining = item?.isDisappearing ? getTimeRemaining(item?.id ?? '') : 0;
    const shouldShowTimer = item?.isDisappearing && hasBeenViewed && timeRemaining > 0;

    const swipeRef = React.createRef<Swipeable>();

    const renderLeftActions = () => {
      return (
        <View style={styles.replyAction}>
          <IconButton icon="reply" iconColor={colors.primary} size={24} />
        </View>
      );
    };

    const handleSwipeOpen = () => {
      setReplyingTo(item);
      swipeRef.current?.close();
    };

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {!isMyMessage && <Avatar uri={item?.senderAvatar} name={item?.senderName} size={32} />}

        <Swipeable
          ref={swipeRef}
          renderLeftActions={renderLeftActions}
          onSwipeableOpen={handleSwipeOpen}
          friction={2}
          rightThreshold={40}
        >
          <Pressable
            onLongPress={() => handleLongPressMessage(item)}
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
              item?.isDisappearing && styles.disappearingMessageBubble,
            ]}
          >
            {!isMyMessage && <Text style={styles.senderName}>{item?.senderName ?? 'Unknown'}</Text>}

            {item?.isDeleted ? (
              <Text style={[styles.messageText, styles.deletedMessageText, isMyMessage && styles.myMessageText]}>
                🚫 Nachricht gelöscht
              </Text>
            ) : (
              <>
                {item?.quotedMessage && (
                  <View style={styles.quotedMessageBubble}>
                    <Text style={styles.quotedSenderName}>{item.quotedMessage.senderName}</Text>
                    <Text style={styles.quotedContent} numberOfLines={2}>
                      {item.quotedMessage.messageType === 'TEXT' ? item.quotedMessage.content : `[${item.quotedMessage.messageType}]`}
                    </Text>
                  </View>
                )}
                {item?.messageType === 'TEXT' && (
                  <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item?.content ?? ''}</Text>
                )}
                {item?.messageType === 'IMAGE' && item?.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
                )}
                {item?.messageType === 'AUDIO' && item?.audioUrl && (
                  <AudioPlayer uri={item.audioUrl} isMyMessage={isMyMessage} />
                )}
                {item?.linkMetadata && (
                  <Pressable
                    onPress={() => item.linkMetadata?.url && Linking.openURL(item.linkMetadata.url)}
                    style={styles.linkPreviewContainer}
                  >
                    {item.linkMetadata.image ? (
                      <Image source={{ uri: item.linkMetadata.image }} style={styles.linkPreviewImage} />
                    ) : null}
                    <View style={styles.linkPreviewTextContainer}>
                      <Text style={styles.linkPreviewTitle} numberOfLines={1}>{item.linkMetadata.title || 'Link'}</Text>
                      {item.linkMetadata.description ? (
                        <Text style={styles.linkPreviewDescription} numberOfLines={2}>
                          {item.linkMetadata.description}
                        </Text>
                      ) : null}
                      <Text style={styles.linkPreviewUrl} numberOfLines={1}>{item.linkMetadata.url}</Text>
                    </View>
                  </Pressable>
                )}
              </>
            )}

            {item?.reactions && item.reactions.length > 0 && (
              <View style={[styles.reactionsContainer, isMyMessage ? styles.myReactions : styles.otherReactions]}>
                {Object.entries(
                  item.reactions.reduce((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([emoji, count]) => (
                  <View key={emoji} style={styles.reactionBadge}>
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    {count > 1 && <Text style={styles.reactionCount}>{count}</Text>}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.messageFooter}>
              {item?.isDisappearing && (
                <View style={styles.disappearingIndicator}>
                  <Text style={styles.disappearingIcon}>⏱</Text>
                  {shouldShowTimer && <Text style={styles.timerText}>{timeRemaining}s</Text>}
                </View>
              )}
              <Text style={[styles.timestamp, isMyMessage && styles.myTimestamp]}>
                {new Date(item?.createdAt ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMyMessage && (
                <Text style={[styles.readReceipt, hasBeenViewed && styles.readReceiptRead]}>
                  {hasBeenViewed ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </Pressable>
        </Swipeable>
      </View>
    );
  };

  if (isLoading) return <Loading message="Loading messages..." />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={styles.menuContent}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} iconColor={colors.text} />}
          >
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Disappearing Mode</Text>
              <Switch value={isDisappearingMode} onValueChange={setIsDisappearingMode} color={colors.primary} />
            </View>
            <Menu.Item
              onPress={handleChangeBackground}
              title="Change Background"
              leadingIcon="image-area"
            />
            {user?.themeBackground && (
              <Menu.Item
                onPress={handleRemoveBackground}
                title="Remove Background"
                leadingIcon="image-off"
              />
            )}
          </Menu>

          <Menu
            visible={reactionMenuVisible}
            onDismiss={() => { setReactionMenuVisible(false); setSelectedMessage(null); }}
            anchor={{ x: 0, y: 0 }} // Anchor is tricky with FlatList, we'll use a modal-like approach or fixed position
            contentStyle={styles.reactionMenuContent}
          >
            <View style={styles.reactionPicker}>
              {REACTION_EMOJIS.map(emoji => (
                <Pressable key={emoji} onPress={() => handleReact(emoji)} style={styles.reactionOption}>
                  <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <Menu.Item
              onPress={() => {
                setReactionMenuVisible(false);
                setReplyingTo(selectedMessage);
                setSelectedMessage(null);
              }}
              title="Antworten"
              leadingIcon="reply"
            />
            {selectedMessage?.senderId === user?.id && (
              <Menu.Item
                onPress={() => {
                  setReactionMenuVisible(false);
                  handleDeleteMessage(selectedMessage!);
                }}
                title="Löschen"
                leadingIcon="delete"
                titleStyle={{ color: '#EF4444' }}
              />
            )}
          </Menu>
        </View>

        <ImageBackground
          source={user?.themeBackground ? { uri: user.themeBackground } : undefined}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item?.id ?? ''}
            inverted
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
          />
        </ImageBackground>

        {(typingUsers?.length ?? 0) > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingUsers?.join?.(', ') ?? 'Someone'} {typingUsers?.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        {replyingTo && (
          <View style={styles.replyPreviewBar}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewName}>Replying to {replyingTo.senderName}</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.messageType === 'TEXT' ? replyingTo.content : `[${replyingTo.messageType}]`}
              </Text>
            </View>
            <IconButton icon="close" size={20} iconColor={colors.textMuted} onPress={() => setReplyingTo(null)} />
          </View>
        )}

        <View style={styles.inputContainer}>
          {isDisappearingMode && (
            <View style={styles.disappearingModeIndicator}>
              <Text style={styles.disappearingModeText}>⏱ Disappearing Mode ON</Text>
            </View>
          )}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <IconButton icon="image" onPress={handleSendImage} disabled={isSending || isRecording} iconColor={colors.primaryLight} />
            <IconButton
              icon={isRecording ? 'stop-circle' : 'microphone'}
              onPress={handleRecordAudio}
              disabled={isSending}
              iconColor={isRecording ? colors.error : colors.primaryLight}
            />
            {isRecording ? (
              <View style={styles.inputRecordingPlaceholder}>
                <Text style={styles.inputRecordingText}>Tap stop to send</Text>
              </View>
            ) : (
              <TextInput
                value={inputText}
                onChangeText={handleTyping}
                placeholder="Type a message..."
                placeholderTextColor={colors.textMuted}
                mode="outlined"
                style={styles.input}
                multiline
                maxLength={1000}
                disabled={isSending}
                textColor={colors.inputText}
                outlineColor={colors.inputBorder}
                activeOutlineColor={colors.primary}
                theme={{ colors: { onSurfaceVariant: colors.textMuted } }}
              />
            )}
            <IconButton icon="send" onPress={handleSendText} disabled={isSending || isRecording || !inputText?.trim()} iconColor={colors.primary} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  menuContent: { backgroundColor: colors.elevated },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8, minWidth: 200,
  },
  menuText: { color: colors.text },
  messagesList: { paddingHorizontal: 16, paddingVertical: 8 },
  messageContainer: { flexDirection: 'row', marginVertical: 4, maxWidth: '80%' },
  myMessageContainer: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  otherMessageContainer: { alignSelf: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 16, marginHorizontal: 8 },
  myMessageBubble: { backgroundColor: colors.myBubble },
  otherMessageBubble: { backgroundColor: colors.otherBubble },
  disappearingMessageBubble: { borderWidth: 2, borderColor: colors.disappearingBorder },
  senderName: { fontSize: 12, color: colors.primaryLight, marginBottom: 4, fontWeight: '600' },
  messageText: { fontSize: 16, color: colors.otherBubbleText },
  deletedMessageText: { fontStyle: 'italic', color: colors.textMuted },
  myMessageText: { color: colors.myBubbleText },
  messageImage: { width: 200, height: 200, borderRadius: 8 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 8 },
  disappearingIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  timerText: { fontSize: 12, fontWeight: 'bold', color: colors.disappearing },
  timestamp: { fontSize: 10, color: colors.textMuted },
  myTimestamp: { color: colors.myBubbleText, opacity: 0.8 },
  readReceipt: { fontSize: 10, color: colors.textMuted },
  readReceiptRead: { color: colors.primary },
  replyAction: { justifyContent: 'center', alignItems: 'center', width: 60 },
  quotedMessageBubble: { backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: colors.primary },
  quotedSenderName: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  quotedContent: { fontSize: 14, color: colors.text, opacity: 0.8 },
  replyPreviewBar: { flexDirection: 'row', backgroundColor: colors.surface, padding: 8, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  replyPreviewContent: { flex: 1, paddingLeft: 8, borderLeftWidth: 4, borderLeftColor: colors.primary },
  replyPreviewName: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  replyPreviewText: { fontSize: 14, color: colors.textMuted },
  disappearingIcon: { fontSize: 14 },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 8 },
  typingText: { fontSize: 14, color: colors.primaryLight, fontStyle: 'italic' },
  inputContainer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  disappearingModeIndicator: {
    backgroundColor: colors.disappearingBg, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.disappearingBorder,
  },
  disappearingModeText: { fontSize: 12, color: colors.disappearing, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  input: { flex: 1, maxHeight: 100, backgroundColor: colors.inputBg },
  recordingIndicator: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(248, 113, 113, 0.3)',
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error, marginRight: 8,
  },
  recordingText: { fontSize: 13, color: colors.error, fontWeight: '600' },
  inputRecordingPlaceholder: {
    flex: 1, height: 48, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: 8, borderWidth: 1, borderColor: colors.inputBorder,
  },
  inputRecordingText: { color: colors.textMuted, fontSize: 14 },
  backgroundImage: { flex: 1 },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  myReactions: {
    justifyContent: 'flex-end',
  },
  otherReactions: {
    justifyContent: 'flex-start',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  reactionOption: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reactionMenuContent: {
    backgroundColor: colors.elevated,
    borderRadius: 16,
    minWidth: 250,
  },
  linkPreviewContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  linkPreviewImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
  },
  linkPreviewTextContainer: {
    padding: 8,
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  linkPreviewDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  linkPreviewUrl: {
    fontSize: 10,
    color: colors.primaryLight,
    opacity: 0.7,
  },
});
