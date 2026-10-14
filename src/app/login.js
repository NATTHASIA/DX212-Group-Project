import { useState } from 'react';
import { Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Logo, Btn, Field, Link } from '../lib/ui';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const login = () => {
    if (!email || !pw) return Alert.alert('กรอก Email และรหัสผ่านก่อน');
    router.replace('/home'); // เข้าแอพหลัก (replace = กด back แล้วไม่กลับมาหน้า login)
  };

  return (
    <Screen>
      <Text onPress={() => router.back()} style={{ fontSize: 18 }}>‹ Login</Text>
      <Logo />
      <Field placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Field placeholder="Password" value={pw} onChangeText={setPw} secureTextEntry />
      <Btn title="Log in" onPress={login} />
      <Text style={{ textAlign: 'center' }}>OR</Text>
      <Btn title="Continue with Google" style={{ backgroundColor: '#fff' }} onPress={() => router.replace('/home')} />
      <Text style={{ textAlign: 'center', marginTop: 8 }}>
        Don't have an account? <Link title="Sign up" onPress={() => router.push('/signup')} />
      </Text>
    </Screen>
  );
}
