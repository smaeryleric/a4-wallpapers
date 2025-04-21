import {Cas} from "./Cas";
import {AdImpression, AdType, CAS, MediationManagerEvent} from "react-native-cas";
import {Platform} from "react-native";
import {MediationManager} from "react-native-cas/lib/typescript/modules/mediation-manager.module";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class CasImpl implements Cas {
    private _manager?: MediationManager;

    isReady() {
        return this._manager !== undefined;
    }

    async init() {
        try {
            // Validate CAS SDK integration
            await CAS.debugValidateIntegration();

            // Build the CAS ad manager
            const {manager, result} = await CAS.buildManager(
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
                    casId:
                        Platform.OS === "ios" ? "6618149427" : "com.wallpapers.provider",
                },
                (consentResult) => {
                    console.log("Consent flow result:", consentResult);
                },
            );

            // Store the initialized manager in the context
            this._manager = manager;
            await CAS.setSettings({
                testDeviceIDs: ["6618149427"],
            });
            console.log("CAS manager initialized successfully:", result);
        } catch (error) {
            console.error("Error initializing CAS:", error);
        }
    }

    async showInterstitial(immediately = false) {
        if (!immediately) {
            const canShow = await this._canShowAd("lastInterstitialShownTime", 90_000);
            if (!canShow) {
                console.log("Interstitial ad called too soon, skipping.");
                return;
            }
        }

        const result = await this._showInterstitialAd();
        await AsyncStorage.setItem("lastInterstitialShownTime", Date.now().toString());
        return result;
    }

    async showRewardedForAction(action: string) {
        const countKey = `rewardedCount_${action}`;
        let count = parseInt((await AsyncStorage.getItem(countKey)) || '0', 10);
        count += 1;

        if (count >= 3) {
            await AsyncStorage.setItem(countKey, '0'); // reset count

            return this._showRewardedAd();
        } else {
            await AsyncStorage.setItem(countKey, count.toString());
            console.log(`Rewarded ad not shown. Current count for ${action}: ${count}`);
            return false;
        }
    }

    async showRewarded(immediately = false) {
        if (!immediately) {
            const canShow = await this._canShowAd("lastRewardedShownTime", 90_000);
            if (!canShow) {
                console.log("Rewarded ad called too soon, skipping.");
                return false;
            }
        }

        const result = await this._showRewardedAd();
        await AsyncStorage.setItem("lastRewardedShownTime", Date.now().toString());
        return result;
    }

    private _showRewardedAd() {
        if (this._manager === undefined) {
            throw new Error("Manager doesn't ready");
        }

        return new Promise<boolean>((resolve) => {
            this._manager?.loadRewardedAd();
            const loadedSubscription = this._manager!.addListener(MediationManagerEvent.AdLoaded, () => {
                const callbacks = this._createCallbacks("Rewarded")
                const newCallbacks = {
                    ...callbacks,
                    onComplete: () => {
                        callbacks.onComplete();
                        loadedSubscription.remove();
                        failedSubscription.remove();
                        resolve(true)
                    }
                };
                return this._manager!.showRewardedAd(newCallbacks);
            })
            const failedSubscription = this._manager!.addListener(MediationManagerEvent.AdFailedToLoad, () => {
                loadedSubscription.remove();
                failedSubscription.remove();
                resolve(false);
            })
        })
    }

    private async _showInterstitialAd() {
        if (this._manager === undefined) {
            throw new Error("Manager doesn't ready");
        }

        await this._manager.loadInterstitial();

        while (true) {
            const isReady = await this._manager.isInterstitialReady();

            if (isReady) {
                await this._manager.showInterstitial(
                    this._createCallbacks("Interstitial"),
                );
                break;
            } else {
                await delay(1000);
            }
        }
    }

    private async _canShowAd(key: string, interval: number): Promise<boolean> {
        const lastTime = await this._getLastShownTime(key);
        const now = Date.now();

        // If no time has been set, set it now and return false
        if (lastTime === null || lastTime === 0) {
            await AsyncStorage.setItem(key, now.toString());
            return false;
        }

        return now - lastTime >= interval;
    }

    private _createCallbacks(type: string) {
        return {
            onShown: () => {
                console.log(type + " shown");
            },
            onShowFailed: (message: string) => {
                console.log(type + " shown failed, error: ", message);
            },
            onClicked: () => {
                console.log(type + " shown clicked");
            },
            onComplete: () => {
                console.log(type + " shown completed");
            },
            onClosed: () => {
                console.log(type + " shown closed");
            },
            onImpression: (ad: AdImpression) => {
                console.log(type + " shown, impression: ", JSON.stringify(ad));
            },
        }
    }

    private async _getLastShownTime(key: string): Promise<number | null> {
        const value = await AsyncStorage.getItem(key);
        return value ? parseInt(value, 10) : null;
    }
}

const delay = async (ms: number) => new Promise((res) => setTimeout(res, ms));
