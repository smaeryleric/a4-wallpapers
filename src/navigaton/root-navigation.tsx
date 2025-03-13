import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Models from "../screens/models.component";
import MoreModels from "../screens/more-models.component";
import Main from "../screens/main.component";

const RootNavigation = () => {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={Main}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MoreModels"
        component={MoreModels}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigation;
