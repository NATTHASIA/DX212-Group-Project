import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// ดึงขนาดหน้าจอมาคำนวณสัดส่วนให้รองรับทุกรุ่น
const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  // สร้างตัวแปรเก็บค่าแอนิเมชัน
  const bobAnimGreen = useRef(new Animated.Value(0)).current; 
  const bobAnimRed = useRef(new Animated.Value(0)).current;   

  useEffect(() => {
    // 1. แอนิเมชันลอยขึ้นลง (น้องสีเขียว)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnimGreen, { toValue: -20, duration: 2000, useNativeDriver: true }),
        Animated.timing(bobAnimGreen, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 2. แอนิเมชันลอยขึ้นลง (น้องสีแดง ลอยช้ากว่านิดนึงให้ดูเป็นธรรมชาติ)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnimRed, { toValue: -15, duration: 2500, useNativeDriver: true }),
        Animated.timing(bobAnimRed, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ส่วนบน: แก๊งตัวการ์ตูน (ใช้รูปภาพแทนการวาด) */}
      <View style={styles.heroSection}>
        
        {/* น้องสีเขียว */}
        <Animated.View style={[
            styles.greenContainer, 
            { transform: [{ translateY: bobAnimGreen }] }
        ]}>
          <Image 
            source={require('../../assets/images/green.png')}
            style={styles.characterImageGreen}
            resizeMode="contain"
          />
        </Animated.View>

        {/* น้องสีแดง */}
        <Animated.View style={[
            styles.redContainer, 
            { transform: [{ translateY: bobAnimRed }] }
        ]}>
          <Image 
            source={require('../../assets/images/red.png')}
            style={styles.characterImageRed}
            resizeMode="contain"
          />
        </Animated.View>

      </View>

      {/* ส่วนกลาง: โลโก้แบบใช้รูปภาพ */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../../assets/images/LOGO WOLL.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        {/* ถ้ามีข้อความ Manage your subscription ในรูปโลโก้แล้ว สามารถลบ Text บรรทัดล่างนี้ทิ้งได้เลยครับ */}
      </View>

      {/* ส่วนล่าง: โดมสีเหลืองและปุ่ม (ปุ่มใช้โค้ดสร้าง ไม่ใช่รูปภาพ) */}
      <View style={styles.bottomSection}>
        {/* ใช้รูปภาพโดมสีเหลืองแทนการวาด */}
        <Image 
          source={require('../../assets/images/yellow_bg.png')}
          style={styles.yellowDomeImage}
          resizeMode="cover"
        />
        
        <TouchableOpacity 
          style={styles.signupButton}
          activeOpacity={0.8}
          onPress={() => router.push('/signup')} // กดแล้วไปหน้า signup
        >
          <Text style={styles.signupButtonText}>Sign up</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroSection: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
    marginTop: 20,
  },
  // --- การตั้งค่าน้องสีเขียว ---
  greenContainer: {
    position: 'absolute',
    top: -83,   //ยิ่งมาก ยิ่งห่างจากขอบบน
    left: -230,   //ยิ่งมาก ยิ่งห่างจากขอบซ้าย
    zIndex: 1,
  },
  characterImageGreen: {
    width: 850,  // ปรับให้ใหญ่ขึ้น
    height: 850, // ปรับให้ใหญ่ขึ้น
  },
  // --- การตั้งค่าน้องสีแดง ---
  redContainer: {
    position: 'absolute',
    top: -83,   //ยิ่งมาก ยิ่งห่างจากขอบบน
    right: -230,   //ยิ่งมาก ยิ่งห่างจากขอบขวา
    zIndex: 2,
  },
  characterImageRed: {
    width: 850,  // ปรับให้ใหญ่ขึ้น
    height: 850, // ปรับให้ใหญ่ขึ้น
  },
  
  // --- โลโก้ ---
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginTop: -430,   // ดันโลโก้ขึ้นมา
  },
  logoImage: {
    width: 500,    // ปรับความกว้างโลโก้
    height: 800,    // ปรับความสูงโลโก้
  },
  
  // --- โดมด้านล่างและปุ่ม ---
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  yellowDomeImage: {
    position: 'absolute',
    bottom: -40, // ปรับให้โดมสีเหลืองอยู่ด้านล่างสุด
    width: width,
    height: 820, // ปรับความสูงของโดมสีเหลือง
  },
  signupButton: {
    backgroundColor: '#ffffff',
    width: 250,          // 🟢 บังคับความกว้างไปเลย (ลบ paddingHorizontal ออก)
    height: 60,          // 🟢 บังคับความสูงไปเลย (ลบ paddingVertical ออก)
    borderRadius: 30,
    justifyContent: 'center',  // จัดข้อความให้อยู่ตรงกลาง
    alignItems: 'center',      // จัดข้อความให้อยู่ตรงกลาง
    marginBottom: 100,   // ดันขึ้นจากด้านล่าง 100 px
    zIndex: 99,          // บังคับให้อยู่ชั้นบนสุดเสมอ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  signupButtonText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#930D11',
  },
});