// import React from "react";
// import RegisterScreen from "./src/screens/RegisterScreen";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <RegisterScreen />
//       {/* or <NavigationContainer>...</NavigationContainer> */}
//     </SafeAreaProvider>
//   );
// }

// App.tsx
// App.tsx
// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-url-polyfill/auto';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}