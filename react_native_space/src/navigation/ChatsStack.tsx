import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from './types';
import { ConversationsScreen } from '../screens/ConversationsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NewChatScreen } from '../screens/NewChatScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export const ChatsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen
        name="ConversationsList"
        component={ConversationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{ title: 'New Chat' }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Create Group' }}
      />
    </Stack.Navigator>
  );
};
