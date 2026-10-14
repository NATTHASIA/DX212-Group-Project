import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modes } from './theme';

// Context = ที่เก็บข้อมูลกลาง ให้ทุกหน้าเรียกใช้ผ่าน useStore() ได้
const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

// ข้อมูลตัวอย่างจากดีไซน์ (ลบทิ้งได้จากหน้า Subscription List)
const SEED = [
  { id: '1', name: 'Youtube', price: 399, repeat: 'Monthly', fav: true, notifyDays: 3, cancelUrl: 'https://www.youtube.com/paid_memberships' },
  { id: '2', name: 'Spotify', price: 249, repeat: 'Monthly', fav: false, notifyDays: 3, cancelUrl: '' },
  { id: '3', name: 'Netflix', price: 499, repeat: 'Monthly', fav: false, notifyDays: 3, cancelUrl: '' },
  { id: '4', name: 'Disney+', price: 199, repeat: 'Monthly', fav: false, notifyDays: 3, cancelUrl: '' },
];

export function StoreProvider({ children }) {
  const [subs, setSubs] = useState(SEED);
  const [mode, setMode] = useState('light');
  const [user, setUser] = useState({ name: 'user67', email: 'you@email.com' });
  const [ready, setReady] = useState(false);

  // โหลดข้อมูลที่เคยบันทึกไว้ตอนเปิดแอพ
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('woll');
        if (raw) { const d = JSON.parse(raw); setSubs(d.subs); setMode(d.mode); }
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  // บันทึกอัตโนมัติทุกครั้งที่รายการหรือธีมเปลี่ยน
  useEffect(() => {
    if (ready) AsyncStorage.setItem('woll', JSON.stringify({ subs, mode })).catch(() => {});
  }, [subs, mode, ready]);

  const addSub = (s) => setSubs((p) => [{ ...s, id: Date.now().toString(), fav: false }, ...p]);
  const delSub = (id) => setSubs((p) => p.filter((x) => x.id !== id));
  const toggleFav = (id) => setSubs((p) => p.map((x) => (x.id === id ? { ...x, fav: !x.fav } : x)));
  // ยอดต่อเดือน = รายเดือน + (รายปี ÷ 12)
  const monthlyTotal = subs.reduce((t, s) => t + (s.repeat === 'Yearly' ? s.price / 12 : s.price), 0);

  return (
    <Ctx.Provider value={{ subs, addSub, delSub, toggleFav, monthlyTotal, mode, setMode, theme: modes[mode], user, setUser }}>
      {children}
    </Ctx.Provider>
  );
}
