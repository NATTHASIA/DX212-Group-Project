import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react'; // 🟢 เพิ่ม useEffect
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
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function OTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); 

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // 🟢 สร้าง state นับถอยหลัง เริ่มที่ 60 วิ
  const inputRefs = useRef([]);

  // 🟢 ฟังก์ชันนับถอยหลัง (ทำงานอัตโนมัติ)
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer); // เคลียร์เวลาเมื่อเปลี่ยนหน้าหรือเวลาหมด
  }, [countdown]);

  // จัดการการพิมพ์และการเลื่อนช่องอัตโนมัติ
  const handleChangeText = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // จัดการการกดปุ่มลบ (Backspace)
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // ยืนยัน OTP
  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอก OTP ให้ครบ 6 หลัก');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otpString,
      type: 'signup',
    });

    if (error) {
      Alert.alert('รหัสไม่ถูกต้อง', error.message);
    } else {
      Alert.alert('สำเร็จ', 'ยืนยันตัวตนเรียบร้อย!');
      // รปภ. ใน _layout.js จะทำงานอัตโนมัติ
    }
    setLoading(false);
  };

  // ขอรหัสใหม่
  const handleResend = async () => {
    if (countdown > 0) return; // 🟢 กันเหนียว ถ้าเวลายังไม่หมด ห้ามกดส่งซ้ำ

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('ส่งรหัสใหม่แล้ว', `ตรวจสอบอีเมล ${email} อีกครั้ง`);
      setCountdown(60); // 🟢 ส่งสำเร็จ ให้เริ่มนับ 60 วินาทีใหม่
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo} 
            />
          </View>

          <View style={styles.topDivider} />

          <TouchableOpacity style={styles.headerRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#5C0A0A" />
            <Text style={styles.headerTitle}>Enter your OTP</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>
            We've sent a 6-digit OTP to{'\n'}
            <Text style={styles.emailText}>{email || 'your email'}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Verifying...' : 'Continue'}</Text>
          </TouchableOpacity>

          {/* 🟢 ส่วนปุ่ม Resend ที่อัปเดตระบบนับเวลา */}
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Did not get the OTP? </Text>
            <TouchableOpacity onPress={handleResend} disabled={loading || countdown > 0}>
              <Text style={[
                styles.resendButtonText, 
                countdown > 0 && { color: '#AAAAAA' } // ถ้ายังนับเวลาอยู่ ให้ตัวอักษรเป็นสีเทา
              ]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomDecoration}>
        <Image 
          source={require('../../assets/images/sit_green.png')} 
          style={styles.greenCharacter} 
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 10, paddingBottom: 150 },
  
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: width * 0.4, height: 60, resizeMode: 'contain' },
  
  topDivider: { height: 1.25, backgroundColor: '#E0E0E0', width: width, marginBottom: 20, marginTop: -5, marginLeft: -30 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginLeft: -10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#8B1A1A', marginLeft: 5 },
  
  subtitle: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 30, marginLeft: 5 },
  emailText: { color: '#666', fontWeight: 'bold' },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: '#FFF2C5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0D4AA',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C0A0A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  primaryButton: {
    backgroundColor: '#5C0A0A',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { color: '#888', fontSize: 14 },
  resendButtonText: { color: '#8B1A1A', fontSize: 14, fontWeight: 'bold' }, // สีแดงตอนกดได้

  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1, 
  },
  greenCharacter: {
    width: 350,
    height: 250,
    resizeMode: 'contain',
  },
});