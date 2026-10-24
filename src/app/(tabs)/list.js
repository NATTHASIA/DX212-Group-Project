// 😡😡😡 แก้สัญลักษณ์แก้ไข (edit) ให้อยู่ข้าง ๆ ถังขยะ (delete) เวลาปัดขวา, 
// ถ้า user กดรายการจะต้องขึ้นแค่ข้อมูลที่เคยเพิ่มไว้ล่าสุด ดูได้ แต่ยังไม่สามารถแก้ไขได้ถ้าไม่ปัดขวา และกดปุ่ม edit
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
// 🟢 รวมไว้บรรทัดเดียวกันแบบนี้คือถูกต้องที่สุดสำหรับเวอร์ชันใหม่ครับ
// 😡😡😡 แก้ด้วยจร้า Gemini Pro limit 24/10 10:16 + มี render error
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ListScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // --- State สำหรับ Edit Modal ---
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotify, setEditNotify] = useState(true);

  // ดึงข้อมูลทุกครั้งที่เข้ามาหน้านี้ (useFocusEffect)
  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [])
  );

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ดึงข้อมูล list พร้อมกับ logo_url จากตาราง service_catalog
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          service_catalog ( logo_url )
        `)
        .eq('user_id', user.id)
        .order('next_billing_date', { ascending: true }); // เรียงตามวันที่ใกล้สุด

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.log('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันลบข้อมูล
  const deleteItem = async (id) => {
    Alert.alert('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', 
        style: 'destructive',
        onPress: async () => {
          await supabase.from('subscriptions').delete().eq('id', id);
          fetchSubscriptions(); // โหลดข้อมูลใหม่
        }
      }
    ]);
  };

  // ฟังก์ชันบันทึกการแก้ไข
  const saveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        price: parseFloat(editPrice) || 0,
        next_billing_date: editDate,
        notify_days_before: editNotify ? 3 : 0 // ตัวอย่าง: ถ้าเปิดแจ้งเตือนให้เซ็ตเป็น 3 วัน
      };

      const { error } = await supabase.from('subscriptions').update(payload).eq('id', selectedItem.id);
      if (error) throw error;

      Alert.alert('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
      setEditModalVisible(false);
      fetchSubscriptions();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // แปลงวันที่ YYYY-MM-DD เป็น DD MMM (เช่น 23 Oct)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // ระบบค้นหา
  const filteredData = subscriptions.filter(item => {
    const itemName = item.name || '';
    return itemName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // UI สำหรับปุ่มถังขยะตอนปัดซ้าย (Swipe to delete)
  const renderRightActions = (id) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteItem(id)}>
        <Ionicons name="trash-outline" size={28} color="#FFF" />
      </TouchableOpacity>
    );
  };

  // UI ของแต่ละรายการใน List
  const renderItem = ({ item }) => {
    const isNotifyOn = item.notify_days_before > 0;
    const logoUrl = item.service_catalog?.logo_url;

    return (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.8}
          onPress={() => {
            setSelectedItem(item);
            setEditPrice(item.price.toString());
            setEditDate(item.next_billing_date || '');
            setEditNotify(item.notify_days_before > 0);
            setEditModalVisible(true);
          }}
        >
          {/* แถบสีตกแต่งด้านซ้าย */}
          <View style={[styles.cardColorBar, { backgroundColor: item.hex_color || '#000' }]} />
          
          {/* โลโก้แอป */}
          <View style={styles.logoWrapper}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.appLogo} />
            ) : (
              <View style={[styles.fallbackLogo, { backgroundColor: item.hex_color || '#CCC' }]}>
                <Text style={styles.fallbackLogoText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* ชื่อและราคา */}
          <View style={styles.cardInfo}>
            <Text style={styles.appName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.appPrice}>{item.price} ฿/month</Text>
          </View>

          {/* กระดิ่งและวันที่ */}
          <View style={styles.cardRight}>
            <Ionicons 
              name="notifications" 
              size={24} 
              color={isNotifyOn ? "#F4B400" : "#BCC6D0"} // สีเหลืองเมื่อเปิด สีเทาเมื่อปิด
            />
            <Text style={styles.dateText}>{formatDate(item.next_billing_date)}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            
            {/* โลโก้ด้านบน */}
            <View style={styles.logoContainer}>
              <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
            </View>
            <View style={styles.topDivider} />

            <ImageBackground 
              source={require('../../../assets/images/inside_bg.png')} 
              style={styles.background}
              resizeMode="cover"
              imageStyle={{ opacity: 0.15 }}
            >
              <View style={styles.contentContainer}>
                
                <Text style={styles.pageTitle}>Subscription List</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search-outline" size={20} color="#ffffff" style={styles.searchIcon} />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="#FFBDBD"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* รายการ (List) หรือ รูปตอนไม่มีข้อมูล (Empty State) */}
                {!loading && filteredData.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      Setting reminders for{'\n'}your subscriptions!
                    </Text>
                    <Image source={require('../../../assets/images/gray2.png')} style={styles.grayCharacter} />
                  </View>
                ) : (
                  <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                  />
                )}
              </View>
            </ImageBackground>

          </View>
        </TouchableWithoutFeedback>

        {/* ปุ่ม FAB สีแดงมุมขวาล่าง */}
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')} >
          <Ionicons name="add" size={36} color="#ffffff" />
        </TouchableOpacity>

        {/* ================= MODAL สำหรับกดเข้ามาแก้ไข ================= */}
        <Modal visible={isEditModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Edit {selectedItem?.name}</Text>
              
              <Text style={styles.inputLabel}>Price (฿)</Text>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" value={editPrice} onChangeText={setEditPrice} />

              <Text style={styles.inputLabel}>Next Billing Date</Text>
              <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" value={editDate} onChangeText={setEditDate} />

              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Notifications</Text>
                <Switch
                  value={editNotify}
                  onValueChange={setEditNotify}
                  trackColor={{ false: "#D9D9D9", true: "#FF6B6B" }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.modalBtnTextGray}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={saveEdit}>
                  <Text style={styles.modalBtnTextWhite}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logo: { width: width * 0.4, height: 60, resizeMode: 'contain' },
  topDivider: { height: 1.25, backgroundColor: '#E0E0E0', width: width },
  background: { flex: 1, width: '100%' },
  contentContainer: { flex: 1, paddingHorizontal: 25, paddingTop: 30 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#000000', marginBottom: 15 },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B',
    borderRadius: 25, paddingHorizontal: 15, height: 45, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, height: '100%' },
  
  // Empty State
  emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
  emptyStateText: { fontSize: 18, color: '#999999', textAlign: 'center', fontWeight: 'bold', lineHeight: 26, marginBottom: -55 },
  grayCharacter: { width: 370, height: 240, resizeMode: 'contain' },
  
  // Floating Action Button
  fab: {
    position: 'absolute', bottom: 25, right: 25, width: 65, height: 65,
    backgroundColor: '#C62828', borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#C62828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },

  // --- Styles สำหรับ Card รายการ (List Item) ---
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 16, marginVertical: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    borderWidth: 1, borderColor: '#F0F0F0'
  },
  cardColorBar: { width: 6, height: '100%' }, // แถบสีด้านซ้ายของกล่อง
  logoWrapper: { padding: 12 },
  appLogo: { width: 40, height: 40, borderRadius: 8, resizeMode: 'cover' },
  fallbackLogo: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  fallbackLogoText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1, paddingVertical: 15, justifyContent: 'center' },
  appName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  appPrice: { fontSize: 13, color: '#888', fontWeight: '600' },
  cardRight: { paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600' },

  // --- ปุ่มลบ (ถังขยะ) ตอนปัดซ้าย ---
  deleteButton: {
    backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center',
    width: 80, marginVertical: 8, borderTopRightRadius: 16, borderBottomRightRadius: 16,
  },

  // --- Styles สำหรับ Edit Modal ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#5C0A0A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  modalInput: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 15, height: 45, fontSize: 16, color: '#000' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingVertical: 10 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancelBtn: { flex: 1, backgroundColor: '#E0E0E0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 10 },
  modalSaveBtn: { flex: 1, backgroundColor: '#5C0A0A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginLeft: 10 },
  modalBtnTextGray: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  modalBtnTextWhite: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});