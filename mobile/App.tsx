import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { theme } from './src/theme';
import GoalSetupScreen from './src/screens/GoalSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PlanScreen from './src/screens/PlanScreen';
import SimulationScreen from './src/screens/SimulationScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textLight,
          tabBarStyle: {
            backgroundColor: theme.bgCard,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            paddingTop: 6,
            height: 62,
          },
          tabBarLabelStyle: {
            fontSize: theme.fontXXS,
            fontWeight: '700',
            letterSpacing: 0.5,
            marginBottom: 4,
          },
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 17,
            letterSpacing: -0.3,
            color: theme.text,
          },
        }}>
        <Tab.Screen
          name="Setup"
          component={GoalSetupScreen}
          options={{
            title: 'AI Life Architect',
            tabBarLabel: 'Goal',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🎯</Text>,
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Today',
            tabBarLabel: 'Today',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Plan"
          component={PlanScreen}
          options={{
            title: 'My Plan',
            tabBarLabel: 'Plan',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>📅</Text>,
          }}
        />
        <Tab.Screen
          name="Simulate"
          component={SimulationScreen}
          options={{
            title: 'What If?',
            tabBarLabel: 'Simulate',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>🔮</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}