import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
}

export function ScreenLayout({
  children,
  scrollable = true,
  contentStyle,
  backgroundColor,
}: ScreenLayoutProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bgColor = backgroundColor || colors.background;

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: bgColor }]}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={true}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
