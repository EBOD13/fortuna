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
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainTabs from './src/screens/MainTabs';
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}