import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  
  // สร้าง State และรับสัญญาณสำหรับ Hooray
  const params = useLocalSearchParams(); 
  const [showHooray, setShowHooray] = useState(false);

  useEffect(() => {
    // ถ้าหน้า Username ส่งสัญญาณมาว่า showHooray เป็น true ก็เปิดป๊อปอัพ
    if (params.showHooray === 'true') {
      setShowHooray(true);
      // เคลียร์พารามิเตอร์ทิ้งทันที เพื่อไม่ให้มันโหลดซ้ำตอนกดปิด
      router.setParams({ showHooray: '' });
    }
  }, [params.showHooray]);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ส่วนบนสุด: โลโก้ และเส้นคั่น */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
          style={styles.logo} 
        />
      </View>
      <View style={styles.topDivider} />

      {/* ส่วนเนื้อหา: ใช้ภาพพื้นหลัง inside_bg.png พร้อมปรับความโปร่งใส */}
      <ImageBackground 
        source={require('../../../assets/images/inside_bg.png')} 
        style={styles.background}
        resizeMode="cover"
        imageStyle={{ opacity: 0.8 }} 
      >
        <View style={styles.contentContainer}>
          
          {/* หัวข้อ Total Subscription */}
          <Text style={styles.pageTitle}>Total Subscription</Text>

          {/* การ์ดยอดรวม (Card) */}
          <View style={styles.summaryCard}>
            
            {/* ตัวเลข 0.00 และหน่วย */}
            <View style={styles.amountRow}>
              <Text style={styles.amountText}>0.00</Text>
              <Text style={styles.currencyText}> ฿/month</Text>
            </View>
            
            {/* หลอด Progress Bar แบบว่างเปล่า */}
            <View style={styles.emptyProgressBar} />

            {/* ลิงก์ใต้หลอด */}
            <TouchableOpacity>
              <Text style={styles.linkText}>See what cost you?</Text>
            </TouchableOpacity>
          </View>

          {/* ส่วน Empty State (น้องสีเทา) */}
          <View style={styles.emptyStateContainer}>
            <Image 
              source={require('../../../assets/images/gray.png')} 
              style={styles.grayCharacter} 
            />
            <Text style={styles.emptyStateText}>
              You haven't made any{'\n'}recent payments.
            </Text>
          </View>

        </View>
      </ImageBackground>

      {/* ======================================================== */}
      {/* ป๊อปอัพ Hooray แบบใหม่ (จะขึ้นเฉพาะเมื่อ showHooray=true) */}
      <Modal visible={showHooray} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHooray(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Image 
                  source={require('../../../assets/images/Hooray.png')}
                  style={styles.hoorayImg} 
                />
                <Text style={styles.hoorayTitle}>Hooray!</Text>
                <Text style={styles.hooraySub}>Glad you are here</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* ======================================================== */}

    </SafeAreaView>
  );
}

// 🟢 จัดเรียง Styles ใหม่ให้อ่านง่ายขึ้น
const styles = StyleSheet.create({
  // --- โครงสร้างหลัก ---
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
  },
  background: { 
    flex: 1, 
    width: '100%' 
  },
  contentContainer: { 
    flex: 1, 
    paddingHorizontal: 25, 
    paddingTop: 30 
  },
  
  // --- โลโก้และเส้นคั่น ---
  logoContainer: { 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 20 
  },
  logo: { 
    width: width * 0.4, 
    height: 60, 
    resizeMode: 'contain' 
  },
  topDivider: { 
    width: width, 
    height: 1.25, 
    backgroundColor: '#E0E0E0' 
  },

  // --- หัวข้อหลัก ---
  pageTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#000000', 
    marginBottom: 20 
  },

  // --- การ์ดยอดรวม (Summary Card) ---
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#FFEBEB',
    // การตั้งค่าเงาของการ์ด
    shadowColor: '#FFCACA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  amountRow: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    marginBottom: 15 
  },
  amountText: { 
    fontSize: 45, 
    fontWeight: 'bold', 
    color: '#000000', 
    letterSpacing: -1 
  },
  currencyText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#666666', 
    marginLeft: 5 
  },
  emptyProgressBar: { 
    height: 18, 
    backgroundColor: '#BCC6D0', 
    borderRadius: 10, 
    marginBottom: 15 
  },
  linkText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#555555', 
    textDecorationLine: 'underline' 
  },

  // --- ส่วน Empty State (น้องสีเทา) ---
  emptyStateContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  grayCharacter: { 
    width: 220, 
    height: 170, 
    resizeMode: 'contain', 
    marginLeft: -22,
    marginBottom: 20 
  },
  emptyStateText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#999999', 
    textAlign: 'center', 
    lineHeight: 26 
  },

  // --- ป๊อปอัพ Hooray ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(230, 230, 230, 0.85)', // พื้นหลังขุ่นๆ เบลอๆ
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 45, 
    paddingVertical: 50,
    paddingHorizontal: 60,
    alignItems: 'center',
    // การตั้งค่าเงาของป๊อปอัพ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  hoorayImg: { 
    width: 140, 
    height: 140, 
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
    fontWeight: '600', 
    color: '#888' 
  }
});