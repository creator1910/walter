import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { LayoutGrid, Plus, User } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F, useTheme } from '../../lib/theme';

const TAB_BAR_HEIGHT = 60;
const CENTER_BUTTON_SIZE = 68;

function CenterTabButton() {
  const router = useRouter();
  const t = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/new-job')}
      style={({ pressed }) => [
        styles.centerButton,
        { backgroundColor: t.primary },
        pressed && { transform: [{ scale: 1.02 }] },
      ]}
      accessibilityLabel="Neuer Auftrag"
    >
      <Plus size={28} color={t.on_primary} strokeWidth={2} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 8) + 8;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.on_surface,
        headerTitleStyle: { fontFamily: F.headlineSemi, fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: [styles.tabBar, { bottom: tabBarBottom }],
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.outline,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.tabBarBlurClip, { borderColor: t.outline_variant + '26' }]}>
            <BlurView tint="systemChromeMaterial" intensity={80} style={StyleSheet.absoluteFill} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarLabel: 'Übersicht',
          tabBarIcon: ({ color }) => <LayoutGrid size={20} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="new-job-tab"
        options={{
          tabBarButton: () => <CenterTabButton />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <User size={20} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    // marginHorizontal survives React Navigation's left:0/right:0 override
    marginHorizontal: 48,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderTopWidth: 0,
    overflow: 'visible', // allows + button to protrude above the bar
    backgroundColor: 'transparent',
  },
  tabBarBlurClip: {
    borderRadius: TAB_BAR_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    // borderColor set inline via theme (t.outline_variant at 15% opacity)
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: F.body,
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    // protrudes above the bar
    marginTop: -(CENTER_BUTTON_SIZE - TAB_BAR_HEIGHT) / 2,
  },
});
