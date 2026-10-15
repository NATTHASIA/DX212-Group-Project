import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // 🟢 1. Import ตัวเลือกรูป
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
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';

const { width } = Dimensions.get('window');

export default function Username() {
  const router = useRouter();
  const { setUser } = useStore();
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const [imageUri, setImageUri] = useState(null); // 🟢 2. สร้าง State เก็บรูปที่เลือกจากเครื่อง

  // 🟢 3. ฟังก์ชันเปิดแกลลอรี่เลือกรูป
  const pickImage = async () => {
    // ขออนุญาตเข้าถึงอัลบั้ม
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry', 'We need camera roll permissions to make this work!');
      return;
    }

    // เปิดหน้าต่างเลือกรูป
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // ให้ผู้ใช้ครอปรูปได้
      aspect: [1, 1], // บังคับครอปเป็นสี่เหลี่ยมจัตุรัส
      quality: 0.8, // ลดความละเอียดลงนิดหน่อยเพื่อไม่ให้ไฟล์หนักเกิน
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // บันทึกเส้นทางรูปไว้แสดงผล
    }
  };

  const next = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter a username');
    
    try {
      // 1. ดึง ID ของผู้ใช้ที่เพิ่งล็อกอิน Google สำเร็จ
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');

      let uploadedAvatarUrl = null;

      // 2. ถ้ามีการเลือกรูปภาพ ให้ทำการอัปโหลดขึ้น Storage
      if (imageUri) {
        // แปลงไฟล์รูปในมือถือให้อยู่ในรูปแบบที่พร้อมส่งผ่านเน็ต
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน (ใช้ ID ผู้ใช้ + เวลาปัจจุบัน)
        const fileExt = imageUri.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        // อัปโหลดขึ้นถัง avatars
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // ดึงลิงก์สาธารณะของรูปที่เพิ่งอัปโหลดเสร็จ
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // 3. บันทึกข้อมูล (Username + ลิงก์รูป) ลงตาราง profiles
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: user.id, // ใช้ ID จาก Google เป็นกุญแจหลัก
        username: name.trim(),
        avatar_url: uploadedAvatarUrl,
      });

      if (dbError) throw dbError;

      // 4. อัปเดตข้อมูลในแอป แล้ววาร์ปไปหน้า Home 
      // 🟢 พร้อมส่งสัญญาณ ?showHooray=true ไปด้วย
      setUser((u) => ({ ...u, name: name.trim(), avatar: uploadedAvatarUrl }));
      
      router.replace({ pathname: '/home', params: { showHooray: 'true' } });

    } catch (error) {
      console.error('Error saving profile:', error.message);
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🛠️ ปุ่ม Dev ชั่วคราว (ลอยอยู่มุมขวาบน) */}
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, right: 20, backgroundColor: '#333', padding: 8, borderRadius: 8, zIndex: 999 }}
        onPress={() => router.replace('/home')}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>[Dev] ไป Home</Text>
      </TouchableOpacity>

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

          <TouchableOpacity style={styles.backButton} onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/signup');
          }}>
            <Ionicons name="chevron-back" size={32} color="#000" />
          </TouchableOpacity>

          {/* 🟢 4. ทำให้ส่วนรูปภาพกดเพื่อเปลี่ยนรูปได้ */}
          <TouchableOpacity style={styles.avatarSection} onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              <Image 
                // ถ้ายูสเซอร์เลือกรูปแล้ว ให้โชว์รูปนั้น ถ้ายังให้โชว์รูปน้องแดง
                source={imageUri ? { uri: imageUri } : require('../../assets/images/pfp.png')} 
                style={styles.avatarImage} 
              />
            </View>
            
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Enter Username" 
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={next}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomDecoration}>
        <View style={styles.bottomDivider} />
        <Image 
          source={require('../../assets/images/run_green.png')} 
          style={styles.greenCharacters} 
        />
      </View>

    </SafeAreaView>
  );
}

// 🟢 ส่วน styles เหมือนเดิมทุกประการครับ ไม่ได้ปรับแก้
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
    paddingTop: 10,
    paddingBottom: 220, 
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
    width: '100%',
    marginBottom: 20,
    marginTop: -5,
  },
  backButton: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF1CC', 
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0', 
  },
  avatarImage: {
    width: '145%',
    height: '145%',
    resizeMode: 'cover',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#8B1A1A', 
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff', 
  },
  inputContainer: {
    paddingHorizontal: 40,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000',
    textAlign: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#6A0909', 
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: -1,
  },
  bottomDivider: {
    position: 'absolute',
    bottom: 130, 
    width: '100%',
    height: 1.25,
    backgroundColor: '#E0E0E0',
    zIndex: -1,
  },
  greenCharacters: {
    width: '75%',
    height: 300,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    padding: 32 
  },
  modalContent: {
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center' 
  },
  modalTitle: {
    fontSize: 28, 
    fontWeight: '900', 
    color: C.dark,
    marginBottom: 10,
  },
  modalText: {
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
  }
});