import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SettingsRepository } from '../../src/core/data/repository';

export default function TabLayout() {
  const [activeColor, setActiveColor] = useState('#007AFF');

  useEffect(() => {
    let isMounted = true;
    SettingsRepository.getSettings().then(settings => {
      if (!isMounted) return;
      if (settings.dynamicColor) {
        setActiveColor(settings.gridLineColor || '#007AFF');
      } else {
        setActiveColor('#007AFF');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '课表',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
