import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Tab = ({ tab, isActive }: { tab: string; isActive: boolean }) => {
  return (
    <View style={[styles.tab, isActive && styles.activeTab]}>
      <Text style={[styles.title, , isActive && styles.activeTitle]}>
        {tab}
      </Text>
    </View>
  );
};

export default Tab;

const styles = StyleSheet.create({
  tab: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "gray",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  title: {
    color: "white",
    fontSize: 18,
  },
  activeTab: {
    backgroundColor: "orange",
  },
  activeTitle: {
    color: "black",
  },
});
