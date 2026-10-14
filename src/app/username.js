import { useState } from 'react';
import { Text, View, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Btn, Field } from '../lib/ui';
import { useStore } from '../lib/store';
import { C } from '../lib/theme';

export default function Username() {
  const router = useRouter();
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [done, setDone] = useState(false); // true = แสดงป๊อปอัพ Hooray!

  const next = () => {
    if (!name.trim()) return Alert.alert('ตั้งชื่อผู้ใช้ก่อน');
    setUser((u) => ({ ...u, name: name.trim() }));
    setDone(true);
  };

  return (
    <Screen style={{ alignItems: 'center' }}>
      <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: C.red, marginTop: 60, marginBottom: 20 }} />
      <Field placeholder="Enter username" value={name} onChangeText={setName} style={{ width: '100%' }} />
      <Btn title="Continue" onPress={next} style={{ width: '100%' }} />

      {/* ป๊อปอัพ Hooray! แล้วกดปุ่มเพื่อเข้าหน้า Home */}
      <Modal visible={done} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: C.dark }}>Hooray!</Text>
            <Text style={{ marginBottom: 12 }}>Glad you are here.</Text>
            <Btn title="Let's go" onPress={() => { setDone(false); router.replace('/home'); }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
