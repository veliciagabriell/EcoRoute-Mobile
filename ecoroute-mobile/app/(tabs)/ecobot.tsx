import { View, StyleSheet } from 'react-native';
import { Header } from '@/components/header';
import { EcoBotChat } from '@/components/ecobot-chat';

export default function EcoBotScreen() {
  return (
    <View style={styles.container}>
      <Header 
        title="EcoBot" 
        showBack={false}

        onProfilePress={() => console.log('Profile pressed')}
      />

      <EcoBotChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
});
