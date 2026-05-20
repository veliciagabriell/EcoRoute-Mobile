import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type ChatMessageData = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <ThemedText style={[styles.text, isUser ? styles.userText : styles.botText]}>
          {message.content}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#002045',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#E5EEFF',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#0D1C2E',
  },
});
