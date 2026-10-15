import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import 'react-native-get-random-values'; // 🟢 เพิ่มบรรทัดนี้ไว้บนสุด
import 'react-native-url-polyfill/auto'; // จำเป็นสำหรับ supabase-js บน React Native

export const supabase = createClient(
  'https://abwegbxrqwirphxwqefh.supabase.co', // ใส่ URL ของคุณตรงๆ ในเครื่องหมาย '...'
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid2VnYnhycXdpcnBoeHdxZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzUyOTAsImV4cCI6MjEwNzU1MTI5MH0.M_y90UyD83bExopAB-QSiC3kKoMpXrAzwUW4WkIJnDE',      // ใส่ anon key ของคุณตรงๆ ในเครื่องหมาย '...'
  {
    auth: {
      storage: AsyncStorage,      // เก็บ session ไว้ในเครื่อง = แอพ "จำผู้ใช้ได้"
      persistSession: true,
      autoRefreshToken: true,     // ต่ออายุ token อัตโนมัติ
      detectSessionInUrl: false,  // ไม่ใช่เว็บ จึงปิด
      flowType: 'pkce',           // รูปแบบที่ปลอดภัยสำหรับ OAuth บนมือถือ
    },
  }
);

// ต่ออายุ token เฉพาะตอนแอพเปิดอยู่หน้าจอ (ประหยัดแบตและไม่พลาดตอนกลับมาเปิด)
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});