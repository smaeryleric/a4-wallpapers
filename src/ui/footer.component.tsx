import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {collection, getDocs} from 'firebase/firestore';
import {db} from '../util/config';

const Footer = () => {
  const [urls, setUrls] = useState<any>([]);
  const [loading, setLoading] = useState<any>(false);

  useEffect(() => {
    async function fetch() {
      const dataCollection = collection(db, 'social_url');

      const dataSnapshot = await getDocs(dataCollection);
      const dataList = dataSnapshot.docs.map(doc => doc.data());
      setUrls(dataList);
      setLoading(true);
    }
    fetch();
  }, []);
  return (
    <View style={styles.footer}>
      {loading && (
        <>
          <Text style={styles.footerText}>
            Техническую поддержку можно получить по почте{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL(`mailto:${urls[0].mail}`)}>
              {urls[0].mail}
            </Text>
          </Text>
          <View style={styles.rowLogo}>
            <TouchableOpacity
              onPress={() => Linking.openURL(urls[0].vk)}
              style={styles.bgLogo}>
              <Image
                source={require('../../assets/img/vk.png')}
                style={styles.logo}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(urls[0].yt)}
              style={styles.bgLogo}>
              <Image
                source={require('../../assets/img/yt.png')}
                style={styles.logo}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(urls[0].telegram)}
              style={styles.bgLogo}>
              <Image
                source={require('../../assets/img/telega.png')}
                style={styles.logo}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL(urls[0].web)}
              style={styles.bgLogo}>
              <Image
                source={require('../../assets/img/global.png')}
                style={styles.logo}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  footerText: {
    lineHeight: 23.8,
    letterSpacing: 0.3,
    textAlign: 'center',
    color: '#0F172A',
  },
  footer: {
    marginTop: 20,
  },
  link: {
    color: '#0056D2',
  },
  logo: {
    width: 28,
    height: 28,
  },
  bgLogo: {
    width: 60,
    height: 60,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  rowLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
});
