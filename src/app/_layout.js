import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StoreProvider } from '../lib/store';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // ฟังก์ชันเฝ้ามองสถานะการล็อกอิน
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        console.log('ตรวจพบ Session! กำลังเช็กประวัติผู้ใช้...');
        
        try {
          // 🟢 1. วิ่งไปเช็กในตาราง profiles ว่าผู้ใช้คนนี้เคยมี username หรือยัง?
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          // 🟢 2. แยกทางเดินตามผลลัพธ์
          if (data && data.username) {
            console.log('ผู้ใช้เก่า: พาไปหน้า Home...');
            router.replace('/home'); 
          } else {
            console.log('ผู้ใช้ใหม่: พาไปหน้าตั้งชื่อ...');
            router.replace('/username'); 
          }

        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้:', error.message);
          // ถ้าเช็กไม่ได้ (เช่น เน็ตหลุด) ให้พาไปหน้าตั้งชื่อกันเหนียวไว้ก่อน
          router.replace('/username'); 
        }
        
      } else {
        console.log('ยังไม่ล็อกอิน หรือ ล็อกเอาท์แล้ว');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <StoreProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 🟢 ประกาศหน้าทั้งหมดให้ระบบรู้จัก ป้องกันบั๊กจอดำ/ค้างใน Android */}
        <Stack.Screen name="index" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="username" />
        <Stack.Screen name="home" />
        
        {/* หน้า Add New List เด้งขึ้นมาแบบ modal */}
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}