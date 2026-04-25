import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Pressable, StyleSheet, View } from 'react-native';

export default function AdminTabsLayout() {
  const { colors, isDark, toggleLightDark } = useAppTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 8 },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerProfileBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerRight: () => (
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerBtn}
              onPress={toggleLightDark}
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.foreground} />
            </Pressable>
            <Pressable
              style={styles.headerProfileBtn}
              onPress={() => router.push('/admin/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open admin profile"
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Admin Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="user-management"
        options={{
          title: 'User Management',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Admin Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
