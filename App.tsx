import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import RootNavigation from "./src/navigaton/root-navigation";
import {SafeAreaProvider} from "react-native-safe-area-context";

const App = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <RootNavigation/>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
