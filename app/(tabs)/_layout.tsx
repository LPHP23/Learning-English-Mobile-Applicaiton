// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconActive]}>
      <MaterialCommunityIcons
        name={name}
        size={22}
        color={focused ? '#4ADE80' : '#94A3B8'}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-variant-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="clipboard-text-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="book-open-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="account-circle-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#141414',
    borderTopColor: '#2A2A2A',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconActive: {
    backgroundColor: '#1E2D22',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
});
