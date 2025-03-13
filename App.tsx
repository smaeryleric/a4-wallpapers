import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigation from "./src/navigaton/root-navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CasProvider } from "./src/contexts/cas.context";
const App = () => {
  return (
    <SafeAreaProvider>
      <CasProvider>
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </CasProvider>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
