import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { DashboardScreen } from '../screens/DashboardScreen';
import { CourseSelectScreen } from '../screens/CourseSelectScreen';
import { ScorecardScreen } from '../screens/ScorecardScreen';
import { RoundDetailScreen } from '../screens/RoundDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="CourseSelect" 
      component={CourseSelectScreen}
      options={{ 
        title: 'Select Course',
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#FFFFFF'
      }}
    />
    <Stack.Screen 
      name="RoundDetail" 
      component={RoundDetailScreen}
      options={{ 
        headerShown: false,
        // Force new screen instance for each navigation
        animationEnabled: true,
      }}
    />
  </Stack.Navigator>
);

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderRadius: 25,
          marginHorizontal: 10,
          marginBottom: 20,
          height: 60,
          paddingBottom: 5,
        },
        tabBarBackground: () => (
          <BlurView intensity={10} tint="light" style={{ flex: 1, borderRadius: 25, overflow: 'hidden' }} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardStack} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};