import React, { useCallback, useEffect } from "react";
import { AdType, CAS } from "react-native-cas";
import { useCasContext } from "../contexts/cas.context";
import { Button, Platform } from "react-native";

import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Setup = () => {
  const context = useCasContext();
  const navigation = useNavigation();

  const initCas = useCallback(async () => {
    await CAS.debugValidateIntegration();

    const { manager, result } = await CAS.buildManager(
      {
        consentFlow: {
          enabled: true,
          requestATT: true,
        },
        testMode: false,
        userId: "user_id",
        adTypes: [
          AdType.Interstitial,
          AdType.Banner,
          AdType.Rewarded,
          AdType.AppOpen,
        ],
        casId: Platform.OS === "ios" ? "6618149427" : undefined,
      },
      (params) => {
        null;
      },
    );

    context.setManager(manager);

    // navigation.navigate("Menu" as never);
  }, [context, navigation]);

  const showFlow = useCallback(() => {
    return CAS.showConsentFlow(
      {
        requestATT: true,
      },
      (params) => {
        null;
      },
    );
  }, [context]);
  useEffect(() => {
    initCas();
  }, []);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button title={"Initialize CAS"} onPress={initCas} />
      <Button title={"Show Consent Flow"} onPress={showFlow} />
    </SafeAreaView>
  );
};
