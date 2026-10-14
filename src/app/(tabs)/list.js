import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Field } from '../../lib/ui';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function List() {
  const router = useRouter();
  const { subs, delSub, toggleFav, theme } = useStore();
  const [q, setQ] = useState('');
  const shown = subs.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())); // ค้นหาตามชื่อ

  // กดถังขยะ -> ถามยืนยันก่อนลบ
  const confirmDel = (s) =>
    Alert.alert('ลบรายการ?', s.name, [{ text: 'ยกเลิก' }, { text: 'ลบ', style: 'destructive', onPress: () => delSub(s.id) }]);

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <Logo />
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.red, marginTop: 8 }}>Subscription List</Text>
      <Field placeholder="Search" value={q} onChangeText={setQ} />
      <FlatList data={shown} keyExtractor={(s) => s.id}
        ListEmptyComponent={<Text style={{ color: '#999' }}>ยังไม่มีรายการ กด + เพื่อเพิ่ม</Text>}
        renderItem={({ item: s }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 12, borderRadius: 12, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: theme.text }}>{s.name}</Text>
              <Text style={{ color: '#999' }}>{s.price.toFixed(2)} ฿/{s.repeat === 'Yearly' ? 'year' : 'month'}</Text>
            </View>
            {/* ปุ่มยกเลิกสมาชิก: แสดงเมื่อมีลิงก์เท่านั้น */}
            {!!s.cancelUrl && <Text onPress={() => Linking.openURL(s.cancelUrl)} style={{ color: C.red, marginRight: 12 }}>Cancel</Text>}
            <TouchableOpacity onPress={() => toggleFav(s.id)}><Ionicons name={s.fav ? 'star' : 'star-outline'} size={22} color="#F5B301" /></TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDel(s)} style={{ marginLeft: 12 }}><Ionicons name="trash" size={22} color={C.red} /></TouchableOpacity>
          </View>
        )} />
      {/* ปุ่ม + ลอย -> หน้า Add New List */}
      <TouchableOpacity onPress={() => router.push('/add')}
        style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </Screen>
  );
}
