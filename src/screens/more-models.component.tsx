import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import Model from '../ui/model.component';
import {ChevronLeft} from 'lucide-react-native';

const MoreModels = ({navigation, route}: any) => {
  let {categoryIndex, category, models, url} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.rowHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.5}
          style={styles.arrow}>
          <ChevronLeft color={'#0F172A'} />
        </TouchableOpacity>
        <Text style={styles.titleCategory}>{category}</Text>
        <View style={{flex: 0.4}} />
      </View>

      <ScrollView contentContainerStyle={styles.models}>
        {models[categoryIndex].models.map((item: any, index: number) => (
          <Model key={index} navigation={navigation} item={item} url={url} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MoreModels;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
  },
  models: {
    gap: 20,
    paddingHorizontal: 20,
  },
  titleCategory: {
    fontSize: 18,
    fontWeight: '600',
    paddingLeft: 20,
    color: '#0F172A',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingLeft: 20,
    justifyContent: 'space-between',
  },
  arrow: {
    borderRadius: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
});
