import React from "react";
import RegisterScreen from "./src/screens/RegisterScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      <RegisterScreen />
      {/* or <NavigationContainer>...</NavigationContainer> */}
    </SafeAreaProvider>
  );
}
