import { Stack } from 'expo-router';
import { StoreProvider } from '../lib/store';

// ไฟล์นี้ครอบทุกหน้า: ใส่ StoreProvider ให้ทุกหน้าเข้าถึงข้อมูลกลางได้
export default function Root() {
  return (
    <StoreProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* หน้า Add New List เด้งขึ้นมาแบบ modal ตามดีไซน์ */}
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
