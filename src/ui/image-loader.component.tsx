import React, {useState} from "react";
import {View, ActivityIndicator, StyleSheet, StyleProp, ViewStyle} from "react-native";
import FastImage from "react-native-fast-image";

export type FastImageLoaderProps = {
    uri: string;
    style: StyleProp<ViewStyle>;
}

const FastImageLoader = ({uri, style}: FastImageLoaderProps) => {
    const [loading, setLoading] = useState(true);

    return (
        <View style={style}>
            <FastImage
                source={{uri}}
                style={styles.img}
                onLoad={() => setLoading(false)}
                resizeMode={FastImage.resizeMode.cover}
            />
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator
                        size="large"
                        color="#0000ff"
                    />
                </View>
            )}
        </View>
    );
};
const styles = StyleSheet.create({
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: "lightgray",
        borderRadius: 10,
    },
    img: {
        flex: 1,
        borderRadius: 10,
    },
});

export default FastImageLoader;
