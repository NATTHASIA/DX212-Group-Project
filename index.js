import { Redirect } from 'expo-router';

export default function Index() {
  // สั่งให้หน้าแรกสุด เด้งไปหน้า Sign up ทันที
  return <Redirect href="/signup" />;
}