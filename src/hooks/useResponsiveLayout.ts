import { useWindowDimensions } from 'react-native';

export type LayoutMode = 'mobile' | 'tablet' | 'fullTablet';

interface ResponsiveLayout {
  mode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isFullTablet: boolean;
  showSidebar: boolean;
  showSplitView: boolean;
  screenWidth: number;
  screenHeight: number;
}

const BREAKPOINTS = {
  tablet: 429,
  fullTablet: 835,
} as const;

/**
 * レスポンシブレイアウトフック
 * 画面幅に応じてモバイル/タブレット/フルタブレットを判定
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  const mode: LayoutMode =
    width >= BREAKPOINTS.fullTablet
      ? 'fullTablet'
      : width >= BREAKPOINTS.tablet
        ? 'tablet'
        : 'mobile';

  return {
    mode,
    isMobile: mode === 'mobile',
    isTablet: mode === 'tablet' || mode === 'fullTablet',
    isFullTablet: mode === 'fullTablet',
    showSidebar: mode === 'fullTablet',
    showSplitView: mode === 'fullTablet',
    screenWidth: width,
    screenHeight: height,
  };
}
