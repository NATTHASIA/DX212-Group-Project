import { useRef, useState } from 'react';
import { Text, View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Btn, Link } from '../lib/ui';
import { C } from '../lib/theme';

export default function Otp() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']);
  const refs = useRef([]); // เก็บ ref ของช่องทั้ง 4 เพื่อเลื่อน cursor อัตโนมัติ

  const onChange = (t, i) => {
    const next = [...code]; next[i] = t.slice(-1); setCode(next);
    if (t && i < 3) refs.current[i + 1]?.focus(); // พิมพ์แล้วไปช่องถัดไป
  };

  const next = () => {
    // เดโม: รับรหัสอะไรก็ได้ที่ครบ 4 หลัก (ของจริงต้องตรวจกับเซิร์ฟเวอร์)
    if (code.join('').length < 4) return Alert.alert('กรอกรหัส 4 หลักให้ครบ');
    router.push('/username'); // -> หน้าตั้งชื่อผู้ใช้
  };

  return (
    <Screen>
      <Text onPress={() => router.back()} style={{ fontSize: 18 }}>‹</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.dark, marginTop: 20 }}>Enter your OTP</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24 }}>
        {code.map((c, i) => (
          <TextInput key={i} ref={(r) => (refs.current[i] = r)} value={c} onChangeText={(t) => onChange(t, i)}
            keyboardType="number-pad" maxLength={1}
            style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#FFE9A8', textAlign: 'center', fontSize: 24 }} />
        ))}
      </View>
      <Btn title="Continue" onPress={next} />
      <Text style={{ textAlign: 'center' }}>
        Didn't get it? <Link title="Resend" onPress={() => Alert.alert('ส่งรหัสใหม่แล้ว')} />
      </Text>
    </Screen>
  );
}
