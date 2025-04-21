import {
    ActivityIndicator,
    BackHandler, FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image, TouchableWithoutFeedback,
} from "react-native";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../util/config";
import Tab from "../ui/tab.component";
import ImageViewer from "react-native-image-zoom-viewer";
import RNFS from "react-native-fs";
import {CameraRoll} from "@react-native-camera-roll/camera-roll";
import {ChevronLeft, Save, Share2Icon, Wallpaper} from "lucide-react-native";
import analytics from "@react-native-firebase/analytics";
import {BannerAd, BannerAdSize} from "react-native-cas";
import {setBothWallpapers} from "react-native-wallpaper-manager-one";
import {AnalyticsCallOptions} from "firebase/analytics";
import Toast from 'react-native-simple-toast';
import CasImpl from "../CasImpl.ts";
import _ from 'lodash';

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

const CAS = new CasImpl();
// noinspection JSIgnoredPromiseFromCall
CAS.init();

const Main = () => {
    const [tabs, setTabs] = useState<TabsDoc>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState<string>();
    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
    const [shownImage, setShownImage] = useState<string>();

    const images = useMemo(() => {
        if (!activeTab) {
            return [];
        }
        const single = tabs[0]?.tabs;
        if (!single) {
            return [];
        }
        return Object.entries(single[activeTab]).map(([, url]) => url);
    }, [activeTab, tabs]);

    const handleTabPress = (tabName: string) => {
        if (activeTab === tabName) {
            return;
        }
        setActiveTab(tabName);
    };

    const handleImagePress = (url: string) => {
        setIsImagePreviewVisible(true);
        setShownImage(url);
    };

    useEffect(() => {
        async function fetch() {
            const dataCollection = collection(db, "tabs");
            const dataSnapshot = await getDocs(dataCollection);
            const dataList = dataSnapshot.docs.map((doc) => doc.data()) as TabsDoc;
            setTabs(dataList);
            setActiveTab(Object.keys(dataList[0].tabs)[0])
            setIsLoaded(true);
        }

        // noinspection JSIgnoredPromiseFromCall
        fetch();
    }, []);


    useEffect(() => {
        const backAction = () => {
            if (isImagePreviewVisible) {
                setIsImagePreviewVisible(false);
                return true; // Возвращаем true, чтобы предотвратить закрытие приложения
            }
            return false; // Возвращаем false, чтобы обычное поведение кнопки "назад" сохранилось
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction,
        );

        return () => backHandler.remove();
    }, [isImagePreviewVisible]);

    const saveImageToGallery = useCallback(async () => {
        if (!shownImage) {
            return;
        }
        showToast("Загрузка...", Toast.SHORT)
        if (Platform.OS === "android") {
            if (!await CAS.showRewarded(true)) {
                showToast("Не удалось загрузить, попробуйте позже.", Toast.SHORT)
                return;
            }
        } else {
            await CAS.showRewardedForAction('SAVE_IMAGE_TO_GALLERY')
        }
        // noinspection ES6MissingAwait
        logEvent("download_Wallpaper", {
            image_url: shownImage,
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
                fromUrl: shownImage,
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
    }, [shownImage]);

    const setWallpaper = useCallback(async () => {
        if (!shownImage) {
            return;
        }
        showToast("Загрузка...", Toast.SHORT)
        if (Platform.OS === "android") {
            if (!await CAS.showRewarded(true)) {
                showToast("Не удалось загрузить, попробуйте позже.", Toast.SHORT)
                return;
            }
        } else {
            await CAS.showRewardedForAction('SET_WALLPAPER')
        }
        // noinspection ES6MissingAwait
        logEvent("set_Wallpaper", {
            image_url: shownImage,
            tab: activeTab,
        });

        showToast("Обои успешно установлены.", Toast.SHORT)
        await setBothWallpapers(shownImage);
    }, [shownImage])

    const _renderImage = useCallback((url: string) => {
        return (
            <TouchableWithoutFeedback
                onPress={() => {
                    handleImagePress(url);

                    setTimeout(() => {
                        // noinspection JSIgnoredPromiseFromCall
                        CAS.showInterstitial(Platform.OS === 'android');
                    }, 1000);
                }}>
                <Image style={styles.image} source={{uri: url}}/>
            </TouchableWithoutFeedback>
        )
    }, [handleImagePress]);

    const _renderList = useCallback(() => {
        const chunks: string[][] = _.chunk(images, 2);

        return (
            <FlatList
                data={chunks}
                renderItem={({item}) => {
                    const [first, second] = item;
                    return (
                        <View style={styles.row}>
                            {_renderImage(first)}
                            {second ? _renderImage(second) : <View style={styles.mockImage}/>}
                        </View>
                    )
                }}
                contentContainerStyle={styles.contentContainer}
            />
        )
    }, [images]);

    const _renderLoader = useCallback(() => {
        return !isLoaded && (
            <View
                style={{flex: 1, alignItems: "center", justifyContent: "center"}}
            >
                <ActivityIndicator size={"large"} color={"blue"}/>
            </View>
        )
    }, [isLoaded]);

    const _renderImagePreview = useCallback(() => {
        return isImagePreviewVisible && shownImage && (
            <Modal visible={isImagePreviewVisible} transparent={true}>
                <ImageViewer
                    pageAnimateTime={800}
                    imageUrls={images.map(url => ({url}))}
                    useNativeDriver={true}
                    saveToLocalByLongPress={false}
                    enablePreload={true}
                    index={images.indexOf(shownImage)}
                    onSwipeDown={() => setIsImagePreviewVisible(false)}
                    enableSwipeDown={true}
                    footerContainerStyle={() => null}
                    onChange={(index) => index !== undefined && setShownImage(images[index])}
                    menuContext={{
                        saveToLocal: "Сохранить в галерею",
                        cancel: "Отмена",
                    }}
                    renderHeader={() => (
                        <TouchableOpacity
                            style={{position: "absolute", top: 33, left: 33, zIndex: 99}}
                            onPress={() => setIsImagePreviewVisible(false)}
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
                        onPress={() => Share.share({message: shownImage})}
                    >
                        <Share2Icon color={"white"} size={35}/>
                        <Text style={styles.buttonText}>Поделиться</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        )
    }, [shownImage, images, saveImageToGallery, setWallpaper, isImagePreviewVisible]);

    const _renderTabs = useCallback(() => {
        return (
            <View>
                <ScrollView
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    contentContainerStyle={styles.rowTab}
                >
                    {tabs &&
                        isLoaded &&
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
        )
    }, [shownImage, tabs, isLoaded, activeTab]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>А4 Обои</Text>
            </View>
            {_renderLoader()}
            {_renderImagePreview()}
            {_renderTabs()}
            {_renderList()}
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
        flexGrow: 1,
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
        aspectRatio: 1 / 1.5,
        flex: 1,
        borderRadius: 10,
        backgroundColor: 'grey'
    },
    mockImage: {
        aspectRatio: 1 / 1.5,
        flex: 1,
    },
    bannerAd: {
        marginLeft: 30,
        marginTop: 12,
        width: "100%",
    },
    row: {
        flexDirection: 'row',
        columnGap: 10,
        marginBottom: 10,
    },
});

export default Main;
