export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabsParamList = {
  Chats: undefined;
  Profile: undefined;
};

export type ChatsStackParamList = {
  ConversationsList: undefined;
  Chat: { conversationId: string; name: string };
  NewChat: undefined;
  CreateGroup: undefined;
  Call: { conversationId: string; name: string; isIncoming: boolean; offer?: any };
};
