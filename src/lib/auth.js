import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// ถือ 3 อย่างให้ทุกหน้า: session (ล็อกอินอยู่ไหม), profile (มี username แล้วไหม), loading (กำลังเช็กอยู่)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUid = useRef(undefined); // จำ user ล่าสุด เพื่อโหลดโปรไฟล์เฉพาะตอนเปลี่ยนคน

  const loadProfile = async (uid) => {
    if (!uid) return setProfile(null);
    const { data } = await supabase.from('profiles').select('username').eq('id', uid).maybeSingle();
    setProfile(data ?? null); // null = ยังไม่เคยตั้ง username = ผู้ใช้ใหม่
  };

  useEffect(() => {
    // 1) ตอนเปิดแอพ: ถาม Supabase ว่ามี session เก่าค้างในเครื่องไหม
    supabase.auth.getSession().then(async ({ data }) => {
      lastUid.current = data.session?.user.id ?? null;
      setSession(data.session);
      await loadProfile(lastUid.current);
      setLoading(false);
    });

    // 2) ฟังเหตุการณ์ล็อกอิน/ล็อกเอาต์/ต่ออายุ token
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const uid = s?.user.id ?? null;
      setSession(s);
      if (uid === lastUid.current) return; // แค่ต่ออายุ token ไม่ต้องโหลดใหม่
      lastUid.current = uid;
      setLoading(true);
      // ใช้ setTimeout เพราะห้ามเรียก supabase ตรง ๆ ใน callback นี้ (เสี่ยงค้าง)
      setTimeout(async () => { await loadProfile(uid); setLoading(false); }, 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshProfile = () => loadProfile(session?.user.id);
  const signOut = () => supabase.auth.signOut();

  return <Ctx.Provider value={{ session, profile, loading, refreshProfile, signOut }}>{children}</Ctx.Provider>;
}

// ล็อกอินด้วย Google ผ่านเบราว์เซอร์ (ใช้ได้ทั้งใน Expo Go และแอพจริง)
export async function signInWithGoogle() {
  // Expo Go ได้ลิงก์แบบ exp://... ส่วนแอพจริงได้ woll://auth/callback (ต้องตั้ง scheme ใน app.json)
  const redirectTo = Linking.createURL('auth/callback');
  console.log('REDIRECT URL (เอาไปใส่ใน Supabase):', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true }, // เราเปิดเบราว์เซอร์เองด้านล่าง
  });
  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== 'success') return; // ผู้ใช้ปิดหน้าต่างเอง ไม่ถือว่า error

  const code = new URL(res.url).searchParams.get('code'); // PKCE: แลก code เป็น session
  if (!code) throw new Error('ไม่ได้รับรหัสยืนยันจาก Google');
  const { error: e2 } = await supabase.auth.exchangeCodeForSession(code);
  if (e2) throw e2;
  // สำเร็จ: onAuthStateChange ใน AuthProvider ทำงานต่อเอง
}
