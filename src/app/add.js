import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../lib/store';
import { C } from '../lib/theme';
import { Btn, Field, Screen } from '../lib/ui';

// ตัวเลือกแบบกดสลับ (chip) ใช้กับ Repeat และ Notifications
const Chips = ({ options, value, onPick, label }) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 }}>
    {options.map((o) => (
      <TouchableOpacity key={String(o)} onPress={() => onPick(o)}
        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: value === o ? C.dark : '#fff' }}>
        <Text style={{ color: value === o ? '#fff' : C.dark }}>{label ? label(o) : o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function Add() {
  const router = useRouter();
  const { addSub } = useStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(''); // รูปแบบ YYYY-MM-DD (เปลี่ยนเป็น DateTimePicker ภายหลังได้)
  const [repeat, setRepeat] = useState('Monthly');
  const [payment, setPayment] = useState('');
  const [notifyDays, setNotifyDays] = useState(3);
  const [cancelUrl, setCancelUrl] = useState('');

  const save = () => {
    // ตรวจชื่อและราคาก่อนบันทึก
    if (!name.trim()) return Alert.alert('ใส่ชื่อบริการ');
    const p = parseFloat(price);
    if (!(p > 0)) return Alert.alert('ราคาต้องเป็นตัวเลขมากกว่า 0');
    addSub({ name: name.trim(), price: p, date, repeat, payment, notifyDays, cancelUrl: cancelUrl.trim() });
    // TODO: ตั้งแจ้งเตือนล่วงหน้า notifyDays วัน (lib/notify.js) ตามขั้นตอนข้อ 9
    router.back(); // กลับหน้า List
  };

  return (
    <Screen>
      <ScrollView>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.dark, marginBottom: 8 }}>Add New List</Text>
        <Text>Name</Text><Field value={name} onChangeText={setName} placeholder="เช่น Netflix" />
        <Text>Price (฿)</Text><Field value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
        <Text>Date</Text><Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <Text>Repeat</Text><Chips options={['Monthly', 'Yearly']} value={repeat} onPick={setRepeat} />
        <Text>Payment</Text><Field value={payment} onChangeText={setPayment} placeholder="เช่น บัตร KTC" />
        <Text>Notifications</Text>
        <Chips options={[1, 3, 7]} value={notifyDays} onPick={setNotifyDays} label={(d) => `${d} day${d > 1 ? 's' : ''} before`} />
        <Text>Cancel Subscription (link)</Text><Field value={cancelUrl} onChangeText={setCancelUrl} autoCapitalize="none" placeholder="https://..." />
        <Btn title="OK" onPress={save} />
        <Btn title="Cancel" onPress={() => router.back()} style={{ backgroundColor: '#fff' }} />
      </ScrollView>
    </Screen>
  );
}
