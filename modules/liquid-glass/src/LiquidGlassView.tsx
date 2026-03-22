import { BlurView } from 'expo-blur';
import { Platform, ViewProps } from 'react-native';

// On iOS 26+, the native LiquidGlassModule uses SwiftUI .glassEffect().
// We only activate the native path after a rebuild that includes the Swift module.
// Until then, BlurView (systemChromeMaterial) is the fallback.
const NATIVE_ENABLED = true; // flip to true after `npx expo run:ios` with iOS 26 SDK

let NativeLiquidGlassView: React.ComponentType<ViewProps> | null = null;

if (Platform.OS === 'ios' && NATIVE_ENABLED) {
  try {
    const { requireNativeView } = require('expo');
    NativeLiquidGlassView = requireNativeView<ViewProps>('LiquidGlass');
  } catch {
    // not linked
  }
}

export function LiquidGlassView({ style, children, ...props }: ViewProps) {
  if (NativeLiquidGlassView) {
    return (
      <NativeLiquidGlassView style={style} {...props}>
        {children}
      </NativeLiquidGlassView>
    );
  }
  return (
    <BlurView tint="systemChromeMaterial" intensity={80} style={style} {...props}>
      {children}
    </BlurView>
  );
}
