import { Ionicons } from '@expo/vector-icons'; // 🟢 เพิ่ม Import สำหรับไอคอน
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Home() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const [showHooray, setShowHooray] = useState(false);

  useEffect(() => {
    if (params.showHooray === 'true') {
      setShowHooray(true);
    // 🟢 เพิ่มบรรทัดนี้: สั่งเคลียร์พารามิเตอร์ทิ้งทันที เพื่อไม่ให้มันโหลดซ้ำ
      router.setParams({ showHooray: '' });
    }
  }, [params.showHooray]); // 🟢 เปลี่ยนในวงเล็บให้จับตาดูแค่พารามิเตอร์ตัวนี้

  return (
    <SafeAreaView style={styles.container}>
      {/* 🛠️ ปุ่ม Logout ชั่วคราว (ลอยอยู่มุมขวาบน) */}
      <TouchableOpacity 
        style={{ position: 'absolute', top: 50, right: 20, backgroundColor: 'red', padding: 8, borderRadius: 8, zIndex: 999 }}
        onPress={async () => {
          await supabase.auth.signOut(); // สั่งเตะบัญชีออกจากระบบ
          router.replace('/signup');     // วาร์ปกลับไปหน้า Sign up
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>[Dev] Logout</Text>
      </TouchableOpacity>

      {/* --- พื้นที่เนื้อหาหลักของหน้า Home --- */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>นี่คือหน้า Home โง่ๆ</Text>
      </View>

      {/* 🟢 ป๊อปอัพ Hooray */}
      <Modal visible={showHooray} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHooray(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Image 
                  source={require('../../assets/images/Hooray.png')} 
                  style={styles.hoorayImg} 
                />
                <Text style={styles.hoorayTitle}>Hooray!</Text>
                <Text style={styles.hooraySub}>Glad you are here</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🟢 แถบเมนูด้านล่าง (Bottom Navigation Bar) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={32} color="#C00000" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => console.log('ไปหน้า List')}>
          <Ionicons name="list" size={36} color="#C00000" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => console.log('ไปหน้า Account')}>
          <Ionicons name="person-circle-outline" size={36} color="#C00000" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
  },

  // --- สไตล์ของแถบเมนูด้านล่าง ---
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingBottom: 20, // เผื่อระยะขอบล่างของหน้าจอมือถือ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },

  // --- สไตล์ของป๊อปอัพ Hooray ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(230, 230, 230, 0.85)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 45, 
    paddingVertical: 50,
    paddingHorizontal: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    width: '85%'
  },
  hoorayImg: {
    width: 190,
    height: 190,
    resizeMode: 'contain',
    marginBottom: 20
  },
  hoorayTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#8B1A1A', 
    marginBottom: 8
  },
  hooraySub: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600'
  }
});