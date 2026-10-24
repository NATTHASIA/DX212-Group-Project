import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // ปิด Header ด้านบน
        tabBarShowLabel: false, // ปิดตัวหนังสือใต้ไอคอน
        tabBarActiveTintColor: '#D32F2F', // สีแดงตอนที่เลือก
        tabBarInactiveTintColor: '#BCC6D0', // สีเทาตอนไม่ได้เลือก
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* 🟢 ปุ่มซ้าย: หน้า Home */}
      <Tabs.Screen
        name="home" 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <Ionicons name="home" size={28} color={color} />
            </View>
          ),
        }}
      />

      {/* 🟢 ปุ่มกลาง: หน้า List */}
      <Tabs.Screen
        name="list"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <FontAwesome5 name="list-ul" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* 🟢 ปุ่มขวา: หน้า Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconFocused : null}>
              <MaterialCommunityIcons name="account" size={30} color={color} /> 
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    height: 80,
    paddingTop: 10,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconFocused: {}
});