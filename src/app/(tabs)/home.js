import { View, Text, ScrollView } from 'react-native';
import { Screen, Logo } from '../../lib/ui';
import { useStore } from '../../lib/store';
import { C } from '../../lib/theme';

const BAR = ['#E3262E', '#FF7A00', '#FFC107', '#2E8B57']; // สีแถบสัดส่วนค่าใช้จ่าย

export default function Home() {
  const { subs, monthlyTotal, theme } = useStore();
  return (
    <Screen style={{ backgroundColor: theme.bg }}>
      <Logo />
      <ScrollView>
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.red, marginTop: 12 }}>Total Subscription</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 16, padding: 16, marginVertical: 10 }}>
          {/* ยอดรวมต่อเดือน */}
          <Text style={{ fontSize: 34, fontWeight: '900', color: theme.text }}>
            {monthlyTotal.toFixed(2)} <Text style={{ fontSize: 14 }}>฿/month</Text>
          </Text>
          {/* แถบสัดส่วน: แต่ละรายการกว้างตามราคา */}
          <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginTop: 8 }}>
            {subs.map((s, i) => <View key={s.id} style={{ flex: s.price, backgroundColor: BAR[i % 4] }} />)}
          </View>
          <Text style={{ color: '#999', marginTop: 6 }}>{subs.length} subscriptions</Text>
        </View>

        <Text style={{ fontWeight: '800', color: theme.text, marginBottom: 6 }}>Recently Paid</Text>
        {subs.length === 0 && <Text style={{ color: '#999' }}>ยังไม่มีรายการ ไปที่แท็บ List แล้วกด + เพื่อเพิ่ม</Text>}
        {subs.slice(0, 4).map((s) => (
          <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.card, padding: 12, borderRadius: 12, marginBottom: 6 }}>
            <Text style={{ color: theme.text }}>{s.name}</Text>
            <Text style={{ color: C.red, fontWeight: '700' }}>{s.price.toFixed(2)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
