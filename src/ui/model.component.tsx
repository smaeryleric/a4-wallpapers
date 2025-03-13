import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';

const Model = ({navigation, item, url}) => {
  return (
    <TouchableOpacity
      key={item.id}
      onPress={() => navigation.navigate('Links', {item, url})}
      activeOpacity={0.8}
      style={styles.model}>
      <Image source={{uri: item.uri}} style={styles.img} />
      <Text style={styles.titleModel}>{item.title}</Text>
    </TouchableOpacity>
  );
};

export default Model;

const styles = StyleSheet.create({
  model: {
    flexDirection: 'row',
    gap: 20,
  },
  titleModel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19.12,
    letterSpacing: 0.3,
    color: '#0F172A',
  },

  img: {
    width: 120,
    height: 80,
    borderRadius: 10,
  },
});
