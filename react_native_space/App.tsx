import React from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { paperTheme } from './src/theme';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <StatusBar barStyle="light-content" backgroundColor="#0D0B1A" />
            <RootNavigator />
          </AuthProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
