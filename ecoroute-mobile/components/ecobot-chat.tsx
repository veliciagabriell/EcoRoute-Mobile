import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ChatMessage, type ChatMessageData } from '@/components/chat-message';
import { sendChat, streamChat } from '@/services/chatbot-service';

const initialBotMessage: ChatMessageData = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Halo! Aku EcoBot. Tanyakan apa saja tentang EcoRoute, TPS, IoT monitoring, atau pengelolaan sampah.',
};

export function EcoBotChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessageData[]>([initialBotMessage]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const canSend = input.trim().length > 0 && !isStreaming;

  const formattedMessages = useMemo(
    () =>
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    [messages]
  );

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!canSend) return;

    const content = input.trim();
    const timestamp = Date.now();
    const botId = `bot-${timestamp}`;

    const userMessage: ChatMessageData = {
      id: `user-${timestamp}`,
      role: 'user',
      content,
    };

    const botMessage: ChatMessageData = {
      id: botId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput('');
    setError(null);
    setIsStreaming(true);
    setIsTyping(true);

    const messagesToSend = [
      ...formattedMessages.filter((message) => message.content !== ''),
      { role: userMessage.role, content: userMessage.content },
    ];

    unsubscribeRef.current?.();
    unsubscribeRef.current = streamChat(messagesToSend, {
      onToken: (token) => {
        setIsTyping(false);
        setMessages((prev) => {
          const next = [...prev];
          const index = next.findIndex((item) => item.id === botId);
          if (index >= 0) {
            next[index] = { ...next[index], content: next[index].content + token };
          }
          return next;
        });
      },
      onDone: () => {
        console.log('[EcoBotChat] Stream selesai');
        setIsStreaming(false);
        setIsTyping(false);
      },
      onError: async (message) => {
        console.error('[EcoBotChat] Stream error:', message);
        setIsTyping(false);

        if (message.includes('belum terkonfigurasi') || message.includes('belum dikonfigurasi')) {
          setError(message);
          setMessages((prev) => prev.filter((item) => item.id !== botId));
          setIsStreaming(false);
          return;
        }

        console.log('[EcoBotChat] Mencoba fallback ke sendChat...');
        setError('Koneksi streaming gagal, mencoba ulang...');

        try {
          const reply = await sendChat(messagesToSend);
          setError(null);
          setMessages((prev) => {
            const next = [...prev];
            const index = next.findIndex((item) => item.id === botId);
            if (index >= 0) {
              next[index] = { ...next[index], content: reply };
            }
            return next;
          });
        } catch (err) {
          const fallbackMessage =
            err instanceof Error ? err.message : 'EcoBot sedang bermasalah. Coba lagi nanti.';
          console.error('[EcoBotChat] Fallback juga gagal:', fallbackMessage);
          setError(fallbackMessage);
          setMessages((prev) => prev.filter((item) => item.id !== botId));
        } finally {
          setIsStreaming(false);
        }
      },
    });
  };

  const handleDismissError = () => setError(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesContainer}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) =>
          message.content.length > 0 ? <ChatMessage key={message.id} message={message} /> : null
        )}

        {isTyping && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <ThemedText style={styles.typingText}>EcoBot sedang mengetik...</ThemedText>
          </View>
        )}
      </ScrollView>

      {error && (
        <TouchableOpacity style={styles.errorBox} onPress={handleDismissError} activeOpacity={0.8}>
          <MaterialIcons name="error-outline" size={16} color="#93000A" style={{ marginRight: 6 }} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <MaterialIcons name="close" size={14} color="#93000A" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Tulis pertanyaanmu..."
          placeholderTextColor="#9EA3AE"
          value={input}
          onChangeText={setInput}
          editable={!isStreaming}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.75}
        >
          {isStreaming ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  messagesContainer: {
    padding: 20,
    paddingBottom: 16,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFDAD6',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#93000A',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 198, 207, 0.4)',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#F3F5FA',
    fontSize: 14,
    color: '#0D1C2E',
    borderWidth: 1,
    borderColor: 'rgba(196, 198, 207, 0.3)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
