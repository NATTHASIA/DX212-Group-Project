import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 🟢 เพิ่ม Import สำหรับ Google Login
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔴 1. ฟังก์ชันล็อกอินด้วย Email / Password
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message);
    }
    setLoading(false);
  };

  // 🔴 2. ฟังก์ชันล็อกอินด้วย Google (เหมือนหน้า signup)
  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback'); 
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, 
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          const parsedUrl = Linking.parse(result.url);
          
          if (parsedUrl.queryParams?.code) {
            await supabase.auth.exchangeCodeForSession(parsedUrl.queryParams.code);
          } else if (parsedUrl.queryParams?.access_token) {
            await supabase.auth.setSession({
              access_token: parsedUrl.queryParams.access_token,
              refresh_token: parsedUrl.queryParams.refresh_token
            });
          }
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* โลโก้ */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo} 
            />
          </View>

          {/* เส้นคั่นบางๆ ด้านบน */}
          <View style={styles.topDivider} />

          {/* ปุ่มย้อนกลับ และ หัวข้อ Login */}
          <TouchableOpacity 
            style={styles.headerRow}
            onPress={() => router.replace('/')}
          >
            <Ionicons name="chevron-back" size={28} color="#5C0A0A" />
            <Text style={styles.headerTitle}>Login</Text>
          </TouchableOpacity>

          {/* ช่องกรอกข้อมูล */}
          <TextInput 
            style={styles.input} 
            placeholder="Enter Email" 
            placeholderTextColor="#aaa" 
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Enter a password" 
            placeholderTextColor="#aaa" 
            secureTextEntry={true} 
            value={password}
            onChangeText={setPassword}
          />

          {/* ปุ่ม Log In */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>

          {/* เส้นคั่นกลาง (or) */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ปุ่ม Google */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          {/* ลิงก์กลับไปหน้า Sign-up */}
          <TouchableOpacity style={styles.loginLinkRow} onPress={() => router.push('/signup')}>
            <Text style={styles.loginText}>
              Don't have an account? <Text style={styles.loginTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* รูปตัวการ์ตูนน้องแดงด้านล่าง (ใช้ path เดียวกับหน้า signup) */}
      <View style={styles.bottomDecoration}>
        <Image 
          source={require('../../assets/images/red2.png')} 
          style={styles.redCharacter} 
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 150, 
  },
  
  // --- โลโก้ ---
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width * 0.4,
    height: 60,
    resizeMode: 'contain',
  },

  // --- เส้นคั่นด้านบน ---
  topDivider: {
    height: 1.25,                    
    backgroundColor: '#E0E0E0',   
    width: width,                
    marginBottom: 20,            
    marginTop: -5,             
    marginLeft: -30,             
  },

  // --- Header (< Login) ---
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C0A0A',
    marginLeft: 5,
  },

  // --- ช่อง Input ---
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#000',
  },

  // --- ปุ่มหลัก ---
  primaryButton: {
    backgroundColor: '#4A0404',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- เส้นคั่น (--- or ---) ---
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#5C0A0A',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#5C0A0A',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // --- ปุ่ม Google ---
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  // --- ลิงก์ Sign-up ---
  loginLinkRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: '#5C0A0A', // เปลี่ยนคำว่า Sign-up เป็นสีแดงเข้ม
  },

  // --- ของตกแต่งด้านล่าง ---
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1, 
  },
  redCharacter: {
    width: 880,
    height: 880, 
    resizeMode: 'contain',
  },
});