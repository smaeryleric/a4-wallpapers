import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { data } from "../data/data";
import Footer from "../ui/footer.component";
import Model from "../ui/model.component";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../util/config";

const Models = ({ navigation }: any) => {
  const [visibleModels, setVisibleModels] = useState<any>({ 0: 4, 1: 4 });
  const loadMore = (categoryIndex: number, category: string) => {
    navigation.navigate("MoreModels", { categoryIndex, category, models, url });
  };
  const [models, setModels] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState<any>([]);
  const [url, setUrl] = useState<any>("");

  useEffect(() => {
    async function fetch() {
      const dataCollection = collection(db, "models");
      const dataLogo = collection(db, "logo");
      const dataCollectionTitle = collection(db, "title");

      const dataTitle = await getDocs(dataCollectionTitle);
      const dataSnap = await getDocs(dataLogo);
      const dataSnapshot = await getDocs(dataCollection);

      const dataListsTitle = dataTitle.docs.map((doc) => doc.data());
      const dataLists = dataSnap.docs.map((doc) => doc.data());
      const dataList = dataSnapshot.docs.map((doc) => doc.data());

      setModels(dataList);
      setUrl(dataLists[0].url);
      setTitle(dataListsTitle);
      setLoading(true);
    }
    fetch();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingVertical: 20,
        backgroundColor: "white",
      }}
    >
      {!loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size={"large"} color={"blue"} />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            {url && <Image source={{ uri: url }} style={styles.logo} />}

            <Text style={styles.title}>{title[0].title}</Text>
            <Text style={styles.secondTitle}>{title[0].second_title}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.models}>
              {models.map((category: any, categoryIndex: number) => (
                <View key={categoryIndex} style={styles.card}>
                  <View style={styles.rowText}>
                    <Text style={styles.titleCategory}>
                      {category.category}
                    </Text>
                    {category.models.length > 4 && (
                      <TouchableOpacity
                        onPress={() =>
                          loadMore(categoryIndex, category.category)
                        }
                      >
                        <Text style={styles.seeAll}>УВИДЕТЬ ВСЕ</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {category.models
                    .slice(0, visibleModels[categoryIndex])
                    .map((item: any, index: number) => (
                      <Model
                        key={index}
                        navigation={navigation}
                        item={item}
                        url={url}
                      />
                    ))}
                </View>
              ))}

              <Footer />
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

export default Models;

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 55,
    height: 55,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 44.8,
    letterSpacing: -1,
    color: "#0F172A",
  },
  secondTitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 23.8,
    color: "#64748B",
    letterSpacing: 0.3,
  },
  models: {
    marginTop: 25,
    paddingHorizontal: 30,
  },
  rowText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCategory: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  seeAll: {
    color: "#0056D2",
    fontSize: 14,
    fontWeight: "500",
  },

  card: {
    marginBottom: 30,
    gap: 15,
  },
});
