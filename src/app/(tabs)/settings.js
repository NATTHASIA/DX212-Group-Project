import { useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Btn } from '../../lib/ui';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

export default function Settings() {
  const router = useRouter();
  const { user, mode, setMode, theme } = useStore();
  const [open, setOpen] = useState('');        // หัวข้อที่กำลังขยายอยู่
  const [notif, setNotif] = useState(true);    // สวิตช์แจ้งเตือน (ยังไม่ผูกกับระบบแจ้งเตือนจริง)
  const toggle = (k) => setOpen(open === k ? '' : k);

  // หัวข้อที่กดแล้วขยาย/หุบ
  const Row = ({ k, children }) => (
    <View style={{ marginVertical: 6 }}>
      <TouchableOpacity onPress={() => toggle(k)}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: C.green }}>{open === k ? '⌄' : '›'} {k}</Text>
      </TouchableOpacity>
      {open === k && <View style={{ paddingLeft: 16, paddingTop: 6 }}>{children}</View>}
    </View>
  );

  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: C.red }}>Settings</Text>
      <View style={{ backgroundColor: '#FFE9A8', borderRadius: 14, padding: 14, marginVertical: 12 }}>
        <Text style={{ fontWeight: '800' }}>{user.name}</Text>
      </View>

      <Row k="Account"><Text style={{ color: theme.text }}>Email: {user.email}</Text><Text style={{ color: theme.text }}>Password: ••••••••</Text></Row>
      <Row k="Themes">
        {['dark', 'light'].map((m) => (
          <Text key={m} onPress={() => setMode(m)} style={{ paddingVertical: 4, color: theme.text }}>
            {mode === m ? '✓ ' : '   '}{m === 'dark' ? 'Dark' : 'Light'}
          </Text>
        ))}
      </Row>
      <Row k="Notifications">
        <Switch value={notif} onValueChange={setNotif} trackColor={{ true: C.red }} />
      </Row>
      <Row k="Help"><Text style={{ color: theme.text }}>ติดต่อเรา: support@woll.app</Text></Row>

      {/* Log out -> กลับหน้าแรก (replace เพื่อกัน back กลับเข้าแอพ) */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Btn title="Log Out" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}
