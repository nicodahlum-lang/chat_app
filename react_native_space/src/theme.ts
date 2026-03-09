import { MD3DarkTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Dark Purple Color Palette
export const colors = {
    // Backgrounds
    background: '#0D0B1A',        // Deepest dark purple
    surface: '#1A1730',           // Card/surface background
    surfaceVariant: '#252240',    // Slightly lighter surface
    elevated: '#2E2B4A',         // Elevated elements (search bars, inputs)

    // Purple accents
    primary: '#A855F7',           // Vibrant purple
    primaryDark: '#7C3AED',       // Deeper purple
    primaryLight: '#C084FC',      // Light purple
    primaryMuted: '#6D28D9',      // Muted purple for backgrounds
    primarySurface: 'rgba(168, 85, 247, 0.12)', // Purple tint surface

    // Text
    text: '#F0EEFF',              // Primary text (light)
    textSecondary: '#A09CC0',     // Secondary text
    textMuted: '#6B6490',         // Muted text
    textOnPrimary: '#FFFFFF',     // Text on primary color

    // Borders & Dividers
    border: '#2E2B4A',
    divider: 'rgba(160, 156, 192, 0.15)',

    // Status
    error: '#F87171',
    errorBg: 'rgba(248, 113, 113, 0.15)',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.15)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.15)',

    // Chat bubbles
    myBubble: '#7C3AED',          // My messages
    otherBubble: '#252240',       // Other person messages
    myBubbleText: '#FFFFFF',
    otherBubbleText: '#F0EEFF',

    // FAB & interactive
    fab: '#A855F7',
    fabIcon: '#FFFFFF',

    // Tab bar
    tabActive: '#A855F7',
    tabInactive: '#6B6490',
    tabBackground: '#111025',

    // Unread badge
    badge: '#A855F7',
    badgeText: '#FFFFFF',

    // Searchbar
    searchBg: '#252240',
    searchText: '#F0EEFF',
    searchPlaceholder: '#6B6490',

    // Input fields
    inputBg: '#1A1730',
    inputBorder: '#3D3960',
    inputText: '#F0EEFF',

    // Avatar fallback
    avatarBg: '#7C3AED',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Disappearing messages
    disappearing: '#FBBF24',
    disappearingBg: 'rgba(251, 191, 36, 0.1)',
    disappearingBorder: 'rgba(251, 191, 36, 0.3)',
};

// React Native Paper dark theme with purple customization
export const paperTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: colors.primary,
        onPrimary: colors.textOnPrimary,
        primaryContainer: colors.primaryDark,
        onPrimaryContainer: colors.primaryLight,
        secondary: colors.primaryLight,
        onSecondary: colors.textOnPrimary,
        background: colors.background,
        onBackground: colors.text,
        surface: colors.surface,
        onSurface: colors.text,
        surfaceVariant: colors.surfaceVariant,
        onSurfaceVariant: colors.textSecondary,
        outline: colors.inputBorder,
        elevation: {
            level0: 'transparent',
            level1: colors.surface,
            level2: colors.surfaceVariant,
            level3: colors.elevated,
            level4: colors.elevated,
            level5: colors.elevated,
        },
        error: colors.error,
        onError: '#FFFFFF',
    },
    dark: true,
};

// Navigation theme
export const navigationTheme = {
    ...NavigationDarkTheme,
    dark: true,
    colors: {
        ...NavigationDarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.tabBackground,
        text: colors.text,
        border: colors.border,
        notification: colors.badge,
    },
};
