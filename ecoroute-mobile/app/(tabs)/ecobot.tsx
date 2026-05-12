import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { MaterialIcons } from '@expo/vector-icons';

export default function EcoBotScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <Header 
        title="EcoBot" 
        showBack={false}

        onProfilePress={() => console.log('Profile pressed')}
      />

      <ScrollView style={styles.chatCanvas} contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {/* Date Divider */}
        <View style={styles.dateDividerWrapper}>
          <View style={styles.dateDivider}>
            <ThemedText style={styles.dateText}>Hari ini</ThemedText>
          </View>
        </View>

        {/* Bot Message 1 */}
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <MaterialIcons name="auto-awesome" size={16} color="#002045" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <View style={styles.botMessageBubble}>
              <ThemedText style={styles.botMessageText}>
                Halo! Saya EcoBot. Ada yang bisa saya bantu terkait pengelolaan sampah atau jadwal armada hari ini?
              </ThemedText>
            </View>
            <ThemedText style={styles.timeTextLeft}>08:00</ThemedText>
          </View>
        </View>

        {/* User Message */}
        <View style={styles.userMessageContainer}>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.userMessageBubble}>
              <ThemedText style={styles.userMessageText}>
                Jadwal hari ini
              </ThemedText>
            </View>
            <ThemedText style={styles.timeTextRight}>08:05</ThemedText>
          </View>
        </View>

        {/* Bot Message 2 */}
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <MaterialIcons name="auto-awesome" size={16} color="#002045" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <View style={[styles.botMessageBubble, { paddingBottom: 16 }]}>
              <ThemedText style={styles.botMessageText}>
                Berdasarkan lokasi Anda, TPS terdekat adalah <ThemedText style={styles.boldText}>TPS Central</ThemedText> yang berjarak 200m.
              </ThemedText>
              
              <TouchableOpacity style={styles.inlineButton}>
                <ThemedText style={styles.inlineButtonText}>Lihat Rute</ThemedText>
                <MaterialIcons name="chevron-right" size={12} color="#002045" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.timeTextLeft}>08:06</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Input Area & Quick Replies */}
      <View style={styles.bottomArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRepliesContainer} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <TouchableOpacity style={styles.quickReplyButton}>
            <ThemedText style={styles.quickReplyText}>Jadwal hari ini</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickReplyButton}>
            <ThemedText style={styles.quickReplyText}>Cara lapor</ThemedText>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.textInput}
              placeholder="Ketik pesan..."
              placeholderTextColor="#43474E"
            />
          </View>
          <TouchableOpacity style={styles.sendButton}>
            <MaterialIcons name="send" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  chatCanvas: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateDividerWrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  dateDivider: {
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dateText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    letterSpacing: 0.48,
    color: '#43474E',
  },
  botMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 24,
    maxWidth: '85%',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // To align with bottom of bubble before time
  },
  botMessageBubble: {
    backgroundColor: '#E5EEFF',
    borderRadius: 16,
    borderBottomLeftRadius: 0,
    padding: 16,
  },
  botMessageText: {
    fontFamily: 'Manrope',
    fontSize: 16,
    lineHeight: 24,
    color: '#0D1C2E',
  },
  boldText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: '#0D1C2E',
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  inlineButtonText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    letterSpacing: 0.28,
    color: '#002045',
  },
  timeTextLeft: {
    fontFamily: 'Manrope',
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
    color: '#43474E',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  userMessageBubble: {
    backgroundColor: '#002045',
    borderRadius: 16,
    borderBottomRightRadius: 0,
    padding: 16,
    maxWidth: '85%',
  },
  userMessageText: {
    fontFamily: 'Manrope',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  timeTextRight: {
    fontFamily: 'Manrope',
    fontSize: 10,
    marginTop: 4,
    marginRight: 4,
    color: '#43474E',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8F9FF',
    paddingTop: 8,
    paddingBottom: 24, // spacing to footer tabs
  },
  quickRepliesContainer: {
    marginBottom: 12,
  },
  quickReplyButton: {
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    alignSelf: 'center',
  },
  quickReplyText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    letterSpacing: 0.48,
    color: '#0D1C2E',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 9999,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    fontFamily: 'Manrope',
    fontSize: 14,
    color: '#0D1C2E',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#002045',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
