import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import analytics from "@react-native-firebase/analytics";

// analytics();
// analytics().setAnalyticsCollectionEnabled(true);

AppRegistry.registerComponent(appName, () => App);
