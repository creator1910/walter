import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../../lib/theme';

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
  return (
    <Pressable
      onPress={() => router.push('/new-job')}
      style={({ pressed }) => [styles.centerButton, pressed && { opacity: 0.85 }]}
      accessibilityLabel="Neuer Auftrag"
    >
      <Text style={styles.centerButtonText}>+</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: 'DMSans_600SemiBold', fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: C.amber,
        tabBarInactiveTintColor: C.textDim,
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
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    overflow: 'visible',
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    backgroundColor: C.amber,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: C.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerButtonText: {
    fontSize: 30,
    color: '#111111',
    fontFamily: 'DMSans_400Regular',
    lineHeight: 34,
  },
});
