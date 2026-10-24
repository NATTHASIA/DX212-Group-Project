import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react'; // 🟢 เพิ่ม useState
import {
  Alert, // 🟢 เพิ่ม Alert
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

// 🟢 Import สำหรับ Google Login
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();

  // 🟢 1. สร้างตัวแปรเก็บข้อมูลฟอร์มและสถานะ OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false); // ตัวเปิด/ปิด ด่าน OTP
  const [loading, setLoading] = useState(false);

  // 🔴 2. ฟังก์ชันด่านที่ 1: สมัครและขอ OTP
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('สมัครไม่สำเร็จ', error.message);
    } else {
      Alert.alert('สำเร็จ!', 'เราได้ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว');
      // 🟢 ลบคำสั่ง setIsOtpSent(true); ออก แล้วใส่บรรทัดนี้แทน
      router.push({ pathname: '/otp', params: { email: email } }); 
    }
    setLoading(false);
  };

  // 🔴 3. ฟังก์ชันด่านที่ 2: ยืนยันรหัส OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัส OTP 6 หลัก');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'signup',
    });

    if (error) {
      Alert.alert('รหัสไม่ถูกต้อง', error.message);
    } else {
      Alert.alert('ยินดีต้อนรับ!', 'ยืนยันตัวตนสำเร็จ');
      // รปภ. ใน _layout.js จะพาข้ามไปหน้า /username เอง!
    }
    setLoading(false);
  };

  // 🟢 ฟังก์ชันจัดการ Google Login (เหมือนเดิม)
  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = Linking.createURL('/auth/callback'); 
      console.log("ลิงก์ขากลับคือ:", redirectUrl); 
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      console.log("ลิงก์ที่จะเปิดคือ:", data?.url); 

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          console.log('Google ล็อกอินสำเร็จแล้ว! กำลังบันทึก Session...');
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
      {/* 🛠️ ปุ่ม Dev ชั่วคราว */}
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, right: 20, backgroundColor: '#333', padding: 8, borderRadius: 8, zIndex: 999 }}
        onPress={() => router.push('/username')}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>[Dev] ไป Username</Text>
      </TouchableOpacity>

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

          <View style={styles.topDivider} />

          {/* ปุ่มย้อนกลับ และ หัวข้อ */}
          <TouchableOpacity style={styles.headerRow} onPress={() => {
            // 🟢 ถ้าอยู่หน้า OTP กดย้อนกลับจะกลับไปหน้ากรอกข้อมูล ถ้าไม่ใช่ให้ back กลับหน้าเก่า
            if (isOtpSent) setIsOtpSent(false);
            else router.back();
          }}>
            <Ionicons name="chevron-back" size={28} color="#5C0A0A" />
            <Text style={styles.headerTitle}>{isOtpSent ? 'Enter OTP' : 'Sign up'}</Text>
          </TouchableOpacity>

          {/* 🟢 เช็คว่า ส่ง OTP ไปหรือยัง? ถ้ายัง โชว์ฟอร์มสมัคร */}
          {!isOtpSent ? (
            <View>
              {/* ช่องกรอกข้อมูล */}
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput 
                style={styles.input} 
                placeholder="Create a password" 
                placeholderTextColor="#aaa" 
                secureTextEntry={true} 
                value={password}
                onChangeText={setPassword}
              />
              <TextInput 
                style={styles.input} 
                placeholder="Confirm a password" 
                placeholderTextColor="#aaa" 
                secureTextEntry={true} 
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              {/* ปุ่ม Create an account */}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Create an account'}</Text>
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

              {/* ลิงก์ไปหน้า Log In */}
              <TouchableOpacity style={styles.loginLinkRow} onPress={() => router.push('/login')}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 🟢 ถ้าส่ง OTP ไปแล้ว โชว์หน้ากรอก OTP */
            <View>
              <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666', fontSize: 16 }}>
                Please enter the 6-digit code sent to{'\n'}
                <Text style={{ fontWeight: 'bold', color: '#5C0A0A' }}>{email}</Text>
              </Text>
              
              <TextInput 
                style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 10 }]} 
                placeholder="000000" 
                placeholderTextColor="#aaa"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Verify & Log In'}</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ของตกแต่งด้านล่าง */}
      <View style={styles.bottomDecoration}>
        <Image 
          source={require('../../assets/images/red2.png')} 
          style={styles.redCharacter} 
        />
      </View>

    </SafeAreaView>
  );
}

// โค้ด Styles เหมือนเดิม 100% ครับ
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width * 0.4,
    height: 60,
    resizeMode: 'contain',
  },
  topDivider: {
    height: 1.25,
    backgroundColor: '#E0E0E0',
    width: width,
    marginBottom: 20,
    marginTop: -5,
    marginLeft: -30,
  },
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
    color: '#000000',
  },
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