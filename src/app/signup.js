import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
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
import { supabase } from '../lib/supabase'; // เช็ก path ให้ตรงกับโฟลเดอร์ lib ของคุณด้วยนะครับ

// 🟢 จำเป็นต้องใส่เพื่อให้เบราว์เซอร์สามารถปิดและเด้งกลับเข้าแอปได้
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const router = useRouter();

  // 🟢 ฟังก์ชันจัดการ Google Login
  const handleGoogleLogin = async () => {
    try {
      // 1. สร้างลิงก์ exp:// หรือ wollsubtracker:// สำหรับเด้งกลับมา
      const redirectUrl = Linking.createURL('/auth/callback'); 
      console.log("ลิงก์ขากลับคือ:", redirectUrl); // 🟢 เติมบรรทัดนี้เข้าไป
      
      // 2. ขอ URL ล็อกอิน Google จาก Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // ให้ Supabase ส่งแค่ URL มาเปิดเอง
        },
      });

      console.log("ลิงก์ที่จะเปิดคือ:", data?.url); // 🟢 เพิ่มบรรทัดนี้เข้าไปเพื่อดูลิงก์ครับ

      if (error) throw error;

      // 3. เปิดเบราว์เซอร์ให้ล็อกอิน
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success') {
          console.log('Google ล็อกอินสำเร็จแล้ว!');
          // ระบบ Auth.js ที่คุณลงไว้จะจับ Session ได้เองแล้วพาเปลี่ยนหน้าอัตโนมัติ
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ส่วนเนื้อหาที่เลื่อนได้ */}
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

          {/* เติมเส้นบางๆ ตรงนี้ */}
          <View style={styles.topDivider} />

          {/* ปุ่มย้อนกลับ และ หัวข้อ */}
          <TouchableOpacity style={styles.headerRow} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#5C0A0A" />
            <Text style={styles.headerTitle}>Sign up</Text>
          </TouchableOpacity>

          {/* ช่องกรอกข้อมูล */}
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" />
          <TextInput style={styles.input} placeholder="Create a password" placeholderTextColor="#aaa" secureTextEntry={true} />
          <TextInput style={styles.input} placeholder="Confirm a password" placeholderTextColor="#aaa" secureTextEntry={true} />

          {/* ปุ่ม Create an account */}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create an account</Text>
          </TouchableOpacity>

          {/* เส้นคั่นกลาง (or) */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 🟢 ปุ่ม Google (เพิ่ม onPress เรียกใช้งานฟังก์ชัน) */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          {/* ลิงก์ไปหน้า Log In */}
          <TouchableOpacity style={styles.loginLinkRow}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Log In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ย้ายของตกแต่งมาไว้ล่างสุดตรงนี้ */}
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
    paddingBottom: 150, // เว้นที่ว่างด้านล่างเพื่อไม่ให้เนื้อหาเลื่อนไปทับหน้าน้องแดง
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

  // เติมสไตล์ของเส้นคั่นตรงนี้
  topDivider: {
    height: 1.25,                    // ความหนาของเส้น
    backgroundColor: '#E0E0E0',   // สีเทาอ่อนๆ บางๆ
    width: width,                // กว้างเต็มจอ
    marginBottom: 20,            // ระยะห่างจากเส้น ถึงคำว่า < Sign up
    marginTop: -5,             // ระยะห่างจากโลโก้ ถึงเส้นคั่น
    marginLeft: -30,             // ปรับให้เส้นเต็มจอ (เนื่องจาก ScrollView มี paddingHorizontal)
  },

  // --- Header (< Sign up) ---
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

  // --- ลิงก์ Log in ---
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
    height: 880, // ปรับความสูงให้พอดี ไม่ให้กินที่มากไป
    resizeMode: 'contain',
  },
});