import {
    ActivityIndicator,
    BackHandler,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../util/config";
import Tab from "../ui/tab.component";
import FastImageLoader from "../ui/image-loader.component";
import ImageViewer from "react-native-image-zoom-viewer";
import RNFS from "react-native-fs";
import {CameraRoll} from "@react-native-camera-roll/camera-roll";
import {ChevronLeft, Save, Share2Icon, Wallpaper} from "lucide-react-native";
import analytics from "@react-native-firebase/analytics";
import type {BannerAdRef} from "react-native-cas";
import {AdImpression, AdType, BannerAd, BannerAdSize, CAS,} from "react-native-cas";
import {useCasContext} from "../contexts/cas.context";
import {MediationManagerEvent} from "react-native-cas/src/utils/types.ts";
import {setBothWallpapers} from "react-native-wallpaper-manager-one";
import {AnalyticsCallOptions} from "firebase/analytics";
import Toast from 'react-native-simple-toast';

type TabData = Record<string, string>;
type TabsData = Record<string, TabData>

type TabsDoc = {
    "tabs": TabsData
}[]

/**
 * @throws never
 */
const showToast = (...args: Parameters<typeof Toast['show']>) => {
    try {
        Toast.show(...args)
    } catch (raw) {
        console.warn(raw);
    }
}

/**
 * @throws never
 */
const logEvent = (name: string, params?: { [key: string]: any }, options?: AnalyticsCallOptions) => {
    try {
        analytics().logEvent(name, params, options)
    } catch (raw) {
        console.warn(raw)
    }
}

const Main = () => {
    const [tabs, setTabs] = useState<TabsDoc>([]);
    const [loading, setLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [urls, setUrls] = useState<{ url: string }[]>([]);
    const [modal, setModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0); // Индекс текущего изображения

    const handleTabPress = (tabName: string) => {
        if (activeTab === tabName) {
            return;
        }
        setActiveTab(tabName);
        const images = Object.values(tabs[0].tabs[tabName]).map((url) => ({
            url,
        }));
        setUrls(images);
    };

    const handleImagePress = (index: number) => {
        setModal(true);
        setCurrentIndex(index);
    };

    useEffect(() => {
        async function fetch() {
            const dataCollection = collection(db, "tabs");
            const dataSnapshot = await getDocs(dataCollection);
            const dataList = dataSnapshot.docs.map((doc) => doc.data()) as TabsDoc;
            setTabs(dataList);
            setLoading(true);
        }

        fetch();
    }, []);

    useEffect(() => {
        if (loading && tabs.length > 0) {
            setActiveTab(Object.keys(tabs[0].tabs)[0]);
        }
    }, [tabs, loading]);

    useEffect(() => {
        if (loading && tabs && activeTab) {
            const images = Object.values(tabs[0].tabs[activeTab]).map((url) => ({
                url,
            }));
            setUrls(images);
        }
    }, [activeTab, loading]);
    const context = useCasContext();
    const ref = useRef<BannerAdRef | null>(null);

    useEffect(() => {
        CAS.debugValidateIntegration();
        CAS.setSettings({
            testDeviceIDs: ["6618149427"],
        });
    }, []);
    useEffect(() => {
        const backAction = () => {
            if (modal) {
                setModal(false);
                return true; // Возвращаем true, чтобы предотвратить закрытие приложения
            }
            return false; // Возвращаем false, чтобы обычное поведение кнопки "назад" сохранилось
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction,
        );

        return () => backHandler.remove();
    }, [modal]);

    const getCurrentImageUrl = () => {
        return urls[currentIndex].url;
    };

    const delay = async (ms: number) => new Promise((res) => setTimeout(res, ms));

    const initCas = useCallback(async () => {
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
            context.setManager(manager);
            console.log("CAS manager initialized successfully:", result);
            setShowBanner(true);
        } catch (error) {
            console.error("Error initializing CAS:", error);
        }
    }, []);

    const showInterstitial = useCallback(async () => {
        const {manager} = context;

        if (manager) {
            await manager.loadInterstitial();

            while (true) {
                const isReady = await manager.isInterstitialReady();

                if (isReady) {
                    await manager.showInterstitial(
                        createCallbacks("Interstitial", context.logCasInfo),
                    );
                    break;
                } else {
                    await delay(1000);
                }
            }
        }
    }, [context]);

    const showRewarded = useCallback(async () => {
        const {manager} = context;

        if (!manager) {
            return false;
        }

        return new Promise((resolve) => {
            const loadedSubscription = manager.addListener(MediationManagerEvent.AdLoaded, () => {
                const callbacks = createCallbacks("Rewarded", context.logCasInfo)
                const newCallbacks = {
                    ...callbacks,
                    onComplete: () => {
                        callbacks.onComplete();
                        loadedSubscription.remove();
                        failedSubscription.remove();
                        resolve(true)
                    }
                };
                manager.showRewardedAd(newCallbacks);
            })
            const failedSubscription = manager.addListener(MediationManagerEvent.AdFailedToLoad, () => {
                loadedSubscription.remove();
                failedSubscription.remove();
                resolve(false);
            })
        })
    }, [context]);

    const createCallbacks = (
        adType: string,
        logger: (...data: any[]) => void,
    ) => ({
        onShown: () => {
            logger(adType + " shown");
        },
        onShowFailed: (message: string) => {
            logger(adType + " shown failed, error: ", message);
        },
        onClicked: () => {
            logger(adType + " shown clicked");
        },
        onComplete: () => {
            logger(adType + " shown completed");
        },
        onClosed: () => {
            logger(adType + " shown closed");
        },
        onImpression: (ad: AdImpression) => {
            logger(adType + " shown, impression: ", JSON.stringify(ad));
        },
    });
    useEffect(() => {
        initCas();
    }, []);

    const saveImageToGallery = useCallback(async () => {
        showToast("Загрузка...", Toast.SHORT)
        if (!await showRewarded()) {
            showToast("Не удалось загрузить, попробуйте позже.", Toast.SHORT)
            return;
        }
        // noinspection ES6MissingAwait
        logEvent("download_Wallpaper", {
            image_url: getCurrentImageUrl(),
            tab: activeTab,
        });

        try {
            // Запрос разрешений на Android

            // Скачивание изображения
            const downloadDest = Platform.select({
                ios: `${RNFS.CachesDirectoryPath}/${Math.random()}.jpg`,
                default: `${RNFS.DownloadDirectoryPath}/${Math.random()}.jpg` // DownloadDirectoryPath - ANDROID ONLY
            });
            const downloadResult = await RNFS.downloadFile({
                fromUrl: getCurrentImageUrl(),
                toFile: downloadDest,
            }).promise;

            if (downloadResult.statusCode === 200) {
                // Добавление изображения в галерею
                CameraRoll.save(downloadDest, {type: "photo"})
                    .then(() =>
                        showToast(
                            "Изображение сохранено в галерею",
                            Toast.SHORT,
                        ),
                    )
                    .catch((error) => {
                        showToast(
                            "Не удалось сохранить изображение",
                            Toast.SHORT,
                        );

                        console.error(error);
                    });
            } else {
                showToast(
                    "Не удалось сохранить изображение.",
                    Toast.SHORT,
                );
            }
        } catch (error) {
            console.log(error);
            showToast(
                "Произошла ошибка при сохранении изображения.",
                Toast.SHORT,
            );

            console.error(error);
        }
    }, [showRewarded, getCurrentImageUrl]);

    const setWallpaper = useCallback(async () => {
        showToast("Загрузка...", Toast.SHORT)
        if (!await showRewarded()) {
            showToast("Не удалось загрузить, попробуйте позже.", Toast.SHORT)
            return;
        }
        // noinspection ES6MissingAwait
        logEvent("set_Wallpaper", {
            image_url: getCurrentImageUrl(),
            tab: activeTab,
        });

        showToast("Обои успешно установлены.", Toast.SHORT)
        await setBothWallpapers(getCurrentImageUrl());
    }, [showRewarded, getCurrentImageUrl])

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>А4 Обои</Text>
            </View>

            {!loading && (
                <View
                    style={{flex: 1, alignItems: "center", justifyContent: "center"}}
                >
                    <ActivityIndicator size={"large"} color={"blue"}/>
                </View>
            )}

            {modal && (
                <Modal visible={modal} transparent={true}>
                    <ImageViewer
                        pageAnimateTime={800}
                        imageUrls={urls}
                        useNativeDriver={true}
                        saveToLocalByLongPress={false}
                        enablePreload={true}
                        index={currentIndex}
                        onSwipeDown={() => setModal(false)}
                        enableSwipeDown={true}
                        footerContainerStyle={() => null}
                        onChange={(index) => index !== undefined && setCurrentIndex(index)} // Обновляем индекс при смене изображения
                        menuContext={{
                            saveToLocal: "Сохранить в галерею",
                            cancel: "Отмена",
                        }}
                        renderHeader={() => (
                            <TouchableOpacity
                                style={{position: "absolute", top: 33, left: 33, zIndex: 99}}
                                onPress={() => setModal(false)}
                            >
                                <ChevronLeft size={35} color={"white"}/>
                            </TouchableOpacity>
                        )}
                        loadingRender={() => (
                            <View
                                style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ActivityIndicator size={"large"}/>
                            </View>
                        )}
                        style={{flex: 1}}
                    />
                    <View
                        style={{
                            position: "absolute",
                            bottom: 90,
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "space-around",
                            flexDirection: "row",
                        }}
                    >
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => saveImageToGallery()}
                        >
                            <Save color={"white"} size={35}/>
                            <Text style={styles.buttonText}>Скачать</Text>
                        </TouchableOpacity>
                        {Platform.OS === "android" && (
                            <TouchableOpacity style={styles.button} onPress={() => setWallpaper()}>
                                <Wallpaper color={"white"} size={35}/>
                                <Text style={styles.buttonText}>Установить</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => Share.share({message: urls[currentIndex].url})}
                        >
                            <Share2Icon color={"white"} size={35}/>
                            <Text style={styles.buttonText}>Поделиться</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}

            <View>
                <ScrollView
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    contentContainerStyle={styles.rowTab}
                >
                    {tabs &&
                        loading &&
                        Object.entries(tabs[0].tabs).map(([tabName]) => (
                            <View key={tabName}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => handleTabPress(tabName)}
                                >
                                    <Tab tab={tabName} isActive={activeTab === tabName}/>
                                </TouchableOpacity>
                            </View>
                        ))}
                </ScrollView>
            </View>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                {loading &&
                    tabs &&
                    Object.entries(tabs[0].tabs).map(
                        ([tabName, urls]) =>
                            activeTab === tabName &&
                            Object.entries(urls).map(([urlKey, urlValue], index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        handleImagePress(index);

                                        setTimeout(() => {
                                            showInterstitial();
                                        }, 1000);
                                    }}
                                >
                                    <FastImageLoader style={styles.image} uri={urlValue} />
                                </TouchableOpacity>
                            )),
                    )}
            </ScrollView>
            <View style={styles.bannerAd}>
                <BannerAd size={BannerAdSize.Smart} refreshInterval={20}/>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        paddingHorizontal: 20,
    },
    title: {
        color: "white",
        fontSize: 28,
    },
    header: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    rowTab: {
        flexDirection: "row",
        paddingVertical: 15,
        gap: 15,
    },
    contentContainer: {
        paddingHorizontal: 15,
        flexDirection: "row",
        gap: 30,
        flexWrap: "wrap",
    },
    button: {
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(128, 128, 128, 0.5)",
        padding: 5,
        borderRadius: 10,
        width: 100,
    },
    buttonText: {
        color: "white",
        fontSize: 13,
        fontWeight: "bold",
    },
    image: {
        width: 140,
        height: 230,
        borderRadius: 10,
    },
    bannerAd: {
        marginLeft: 30,
        marginTop: 12,
        width: "100%",
    },
});

export default Main;
