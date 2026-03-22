import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { F, useTheme } from '../../lib/theme';

function GridIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      <View style={{ width: 9, height: 9, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 9, height: 9, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 9, height: 9, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 9, height: 9, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <View style={{ width: 18, height: 7, borderRadius: 4, backgroundColor: color, marginTop: 2 }} />
    </View>
  );
}

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
      <Text style={[styles.centerButtonText, { color: t.on_primary }]}>+</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.on_surface,
        headerTitleStyle: { fontFamily: F.headlineSemi, fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: t.surface }],
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.outline,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Übersicht',
          tabBarLabel: 'Übersicht',
          tabBarIcon: ({ color }) => <GridIcon color={color} />,
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
          title: 'Firmenprofil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <PersonIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    overflow: 'visible',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: F.body,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  centerButtonText: {
    fontSize: 30,
    fontFamily: F.body,
    lineHeight: 34,
  },
});
