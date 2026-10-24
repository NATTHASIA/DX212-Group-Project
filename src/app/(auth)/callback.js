import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { C } from '../../lib/theme';

// หน้าพักรอตอน Google ส่งผู้ใช้กลับเข้าแอพ (กันขึ้น "Unmatched Route")
// ถ้าล็อกอินสำเร็จ Gate จะพาไปต่อเอง ถ้า 5 วิแล้วยังอยู่ที่นี่ แปลว่าไม่สำเร็จ -> กลับหน้าแรก
export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/'), 5000);
    return () => clearTimeout(t);
  }, []);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream }}><ActivityIndicator color={C.red} /></View>;
}
