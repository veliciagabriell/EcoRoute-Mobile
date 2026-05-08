/**
 * EcoRoute Color Scheme - Based on Design System
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary Colors
    primary: '#001F3F', // Navy Blue
    primaryLight: '#00357F',
    accent: '#00B4D8', // Cyan Blue
    accentLight: '#48CAE4',
    
    // Semantic Colors
    success: '#06A77D',
    warning: '#F77F00',
    danger: '#D62828',
    critical: '#E74C3C',
    
    // Neutrals
    text: '#1A1A1A',
    textSecondary: '#616161',
    textTertiary: '#9E9E9E',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    border: '#E0E0E0',
    divider: '#EEEEEE',
    
    // Icon & UI
    icon: '#616161',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: '#00B4D8',
    disabled: '#BDBDBD',
  },
  dark: {
    primary: '#001F3F',
    primaryLight: '#00357F',
    accent: '#00B4D8',
    accentLight: '#48CAE4',
    
    success: '#06A77D',
    warning: '#F77F00',
    danger: '#D62828',
    critical: '#E74C3C',
    
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textTertiary: '#9E9E9E',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    border: '#383838',
    divider: '#424242',
    
    icon: '#E0E0E0',
    tabIconDefault: '#9E9E9E',
    tabIconSelected: '#00B4D8',
    disabled: '#666666',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
