import React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from './theme';

// โลโก้ WOLL (ใช้ข้อความแทนรูปไปก่อน เปลี่ยนเป็น <Image> ได้ภายหลัง)
export const Logo = () => <Text style={s.logo}>WOLL</Text>;

// กรอบหน้าจอ: เว้น safe area + พื้นหลังครีม
export const Screen = ({ children, style }) => (
  <SafeAreaView style={[s.screen, style]}>{children}</SafeAreaView>
);

// ปุ่มหลักสีแดงเข้ม
export const Btn = ({ title, onPress, style }) => (
  <TouchableOpacity style={[s.btn, style]} onPress={onPress} activeOpacity={0.8}>
    <Text style={s.btnT}>{title}</Text>
  </TouchableOpacity>
);

// ช่องกรอกข้อความ
export const Field = (p) => <TextInput placeholderTextColor="#A58" {...p} style={[s.field, p.style]} />;

// ข้อความลิงก์เล็ก ๆ เช่น "Login", "Resend"
export const Link = ({ title, onPress }) => (
  <Text onPress={onPress} style={s.link}>{title}</Text>
);

const s = StyleSheet.create({
  logo: { fontSize: 40, fontWeight: '900', color: C.red, textAlign: 'center', letterSpacing: 2 },
  screen: { flex: 1, backgroundColor: C.cream, padding: 24 },
  btn: { backgroundColor: C.dark, borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginVertical: 8 },
  btnT: { color: '#fff', fontWeight: '700', fontSize: 16 },
  field: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8C9C9', padding: 12, marginVertical: 6 },
  link: { color: C.red, fontWeight: '700' },
});
