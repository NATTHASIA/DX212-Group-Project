import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function AddScreen() {
  const router = useRouter();

  const [price, setPrice] = useState('');
  // 🟢 เปลี่ยน Date ให้เก็บเป็น Object ของวันที่แทนข้อความธรรมดา
  const [date, setDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [payment, setPayment] = useState('');
  const [repeat, setRepeat] = useState('Monthly');
  const [notifyDays, setNotifyDays] = useState(3);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cancelUrl, setCancelUrl] = useState(''); 

  const [services, setServices] = useState([]); 
  const [selectedService, setSelectedService] = useState(null); 
  const [isCustom, setIsCustom] = useState(false); 
  const [customName, setCustomName] = useState(''); 
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [isRepeatModalVisible, setRepeatModalVisible] = useState(false); 
  const [isNotifyModalVisible, setNotifyModalVisible] = useState(false); 

  const [color, setColor] = useState('#000000'); 
  const [isColorModalVisible, setColorModalVisible] = useState(false);
  const [tempColor, setTempColor] = useState('#000000'); 
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  const repeatOptions = ['Never', 'Weekly', 'Every 2 weeks', 'Monthly', 'Every 2 months', 'Every 3 months', 'Every 6 months', 'Yearly'];
  const notifyOptions = [3, 2, 1];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from('service_catalog').select('*').eq('is_active', true);
    if (data) setServices(data);
  };

  const defaultColors = Array.from(new Set(services.map(s => s.brand_color).filter(Boolean)));

  const updateHexFromRgb = (red, green, blue) => {
    const toHex = (c) => { const hex = Math.round(c).toString(16); return hex.length === 1 ? '0' + hex : hex; };
    setTempColor(`#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase());
  };
  const updateRgbFromHex = (hex) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      setR(parseInt(cleanHex.substring(0, 2), 16));
      setG(parseInt(cleanHex.substring(2, 4), 16));
      setB(parseInt(cleanHex.substring(4, 6), 16));
    }
  };

  const handleSelectService = (item) => {
    setIsCustom(false);
    setSelectedService(item);
    setColor(item.brand_color || '#000000'); 
    setCancelUrl(item.cancel_url || ''); // แก้ไขตรงกับใน DB แล้ว
    setServiceModalVisible(false);
  };

  const handleCustom = () => {
    setIsCustom(true);
    setSelectedService(null);
    setCancelUrl(''); 
    setColor('#000000');
    setServiceModalVisible(false);
  };

  const saveToSupabase = async () => {
    if (!isCustom && !selectedService) return Alert.alert('แจ้งเตือน', 'กรุณาเลือกบริการ หรือเลือกพิมพ์ชื่อเอง');
    const finalName = isCustom ? customName.trim() : selectedService?.name;
    if (!finalName) return Alert.alert('แจ้งเตือน', 'กรุณาระบุชื่อบริการ');

    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) return Alert.alert('แจ้งเตือน', 'ราคาต้องเป็นตัวเลขมากกว่า 0');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');

      // 🟢 แปลงวันที่ให้เป็น Format YYYY-MM-DD เสมอ
      const formattedDate = date.toISOString().split('T')[0];

      const payload = {
        user_id: user.id,
        catalog_id: isCustom ? null : selectedService?.id,
        name: isCustom ? finalName : null, 
        hex_color: color,
        price: p,
        billing_cycle: repeat,
        next_billing_date: formattedDate, // 🟢 ส่งค่าที่แปลงแล้วเข้า Database
        notify_days_before: notificationsEnabled ? notifyDays : 0,
        custom_cancle_url: cancelUrl || null
      };

      const { error } = await supabase.from('subscriptions').insert([payload]);
      if (error) throw error;
      
      Alert.alert('Success!', 'Subscription added successfully.');
      router.back(); 

    } catch (error) {
      Alert.alert('Database Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
      </View>
      <View style={styles.topDivider} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ImageBackground source={require('../../assets/images/inside_bg.png')} style={styles.background} imageStyle={{ opacity: 0.15 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              <Text style={styles.pageTitle}>Add New List</Text>

              <View style={styles.cardContainer}>
                
                {/* 1. Name & Color */}
                <View style={styles.row}>
                  <View style={styles.flex2}>
                    <Text style={styles.label}>Name</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setServiceModalVisible(true)}>
                      <Text style={[styles.dropdownText, !selectedService && !isCustom && { color: '#999999' }]}>
                        {isCustom ? customName || 'Select Service...' : selectedService?.name || 'Select Service...'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#000" />
                    </TouchableOpacity>

                    {isCustom && (
                      <TextInput 
                        style={[styles.input, { marginTop: 10 }]} 
                        value={customName} 
                        onChangeText={setCustomName} 
                        placeholder="Type custom name"
                        placeholderTextColor="#999999" 
                      />
                    )}
                  </View>

                  <View style={styles.colorPickerContainer}>
                    <Text style={styles.colorHexText}>{color}</Text>
                    <TouchableOpacity 
                      style={[styles.colorCircle, { backgroundColor: color }]} 
                      onPress={() => {
                        setTempColor(color);
                        updateRgbFromHex(color);
                        setColorModalVisible(true);
                      }}
                    />
                  </View>
                </View>

                {/* 2. Price & Date */}
                <View style={[styles.row, styles.marginTop]}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Price</Text>
                    <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#999999" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                  </View>
                  <View style={styles.spacer} />
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Date</Text>
                    
                    {/* 🟢 เปลี่ยนเป็นปุ่มกดเพื่อเปิดปฏิทิน */}
                    <TouchableOpacity 
                      style={[styles.input, { justifyContent: 'center' }]} 
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{ color: '#000', fontSize: 14 }}>
                        {date.toISOString().split('T')[0]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. Payment & Repeat */}
                <View style={[styles.row, styles.marginTop]}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Payment</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="e.g. kbank"
                      placeholderTextColor="#999999" 
                      value={payment} 
                      onChangeText={setPayment} />
                  </View>
                  <View style={styles.spacer} />
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Repeat</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setRepeatModalVisible(true)}>
                      <Text style={styles.dropdownText}>{repeat}</Text>
                      <Ionicons name="chevron-down" size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Notifications */}
                <View style={styles.marginTop}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Notifications</Text>
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: "#D9D9D9", true: "#FF6B6B" }}
                      thumbColor="#FFF"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 10, marginTop: -5 }}
                    />
                  </View>
                  <TouchableOpacity style={[styles.dropdown, { opacity: notificationsEnabled ? 1 : 0.5 }]} disabled={!notificationsEnabled} onPress={() => setNotifyModalVisible(true)}>
                    <Text style={styles.dropdownText}>{notifyDays} day{notifyDays > 1 ? 's' : ''} before</Text>
                    <Ionicons name="chevron-down" size={16} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* 5. Cancel URL */}
                <View style={styles.marginTop}>
                  <Text style={styles.label}>Cancel URL</Text>
                  <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#999999" value={cancelUrl} onChangeText={setCancelUrl} autoCapitalize="none" />
                </View>

                {/* 6. Buttons */}
                <TouchableOpacity style={styles.okButton} onPress={saveToSupabase}>
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

              </View>
            </ScrollView>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ================= 🟢 MODAL เลือกวันที่ (เฉพาะ iOS) ================= */}
      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.listModalBox, { padding: 0 }]}>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                textColor="#000000"       // 🟢 บังคับตัวหนังสือเป็นสีดำ
                themeVariant="light"      // 🟢 บังคับให้ใช้โหมดสว่าง (Light Mode) เสมอ
                onChange={(event, selectedDate) => {
                  if (selectedDate) setDate(selectedDate);
                }}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ================= 🟢 MODAL เลือกวันที่ (สำหรับ Android) ================= */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* ================= MODAL เลือกแอป (Service) ================= */}
      <Modal visible={isServiceModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.listModalBox}>
            <Text style={styles.modalTitle}>Select Service</Text>
            <ScrollView style={{ width: '100%', maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {services.map((item) => (
                <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => handleSelectService(item)}>
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.customItem} onPress={handleCustom}>
                <Ionicons name="add-circle-outline" size={20} color="#5C0A0A" style={{ marginRight: 8 }}/>
                <Text style={styles.customItemText}>Custom (พิมพ์ชื่อแอปเอง)</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setServiceModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL ตัวเลือก Repeat ================= */}
      <Modal visible={isRepeatModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.listModalBox}>
            <Text style={styles.modalTitle}>Select Repeat</Text>
            <ScrollView style={{ width: '100%', maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {repeatOptions.map((opt) => (
                <TouchableOpacity key={opt} style={styles.listItem} onPress={() => { setRepeat(opt); setRepeatModalVisible(false); }}>
                  <Text style={[styles.listItemText, repeat === opt && styles.activeListItemText]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setRepeatModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL ตัวเลือก Notifications ================= */}
      <Modal visible={isNotifyModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.listModalBox}>
            <Text style={styles.modalTitle}>Select Notification</Text>
            <ScrollView style={{ width: '100%', maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {notifyOptions.map((opt) => (
                <TouchableOpacity key={opt} style={styles.listItem} onPress={() => { setNotifyDays(opt); setNotifyModalVisible(false); }}>
                  <Text style={[styles.listItemText, notifyDays === opt && styles.activeListItemText]}>{opt} day{opt > 1 ? 's' : ''} before</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setNotifyModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL Color Picker ================= */}
      <Modal visible={isColorModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlayColor}>
          <View style={styles.colorModalBox}>
            <View style={[styles.previewColorBox, { backgroundColor: tempColor }]} />
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>R ({r})</Text>
              <Slider style={{flex: 1}} minimumValue={0} maximumValue={255} step={1} value={r} minimumTrackTintColor="#FF0000" onValueChange={(val) => { setR(val); updateHexFromRgb(val, g, b); }} />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>G ({g})</Text>
              <Slider style={{flex: 1}} minimumValue={0} maximumValue={255} step={1} value={g} minimumTrackTintColor="#00FF00" onValueChange={(val) => { setG(val); updateHexFromRgb(r, val, b); }} />
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>B ({b})</Text>
              <Slider style={{flex: 1}} minimumValue={0} maximumValue={255} step={1} value={b} minimumTrackTintColor="#0000FF" onValueChange={(val) => { setB(val); updateHexFromRgb(r, g, val); }} />
            </View>

            <View style={styles.hexRow}>
              <Text style={styles.modalLabelDark}>Hex #</Text>
              <TextInput style={styles.hexInput} value={tempColor} onChangeText={(val) => { setTempColor(val); updateRgbFromHex(val); }} autoCapitalize="characters" maxLength={7} />
            </View>

            <View style={styles.topDividerColorModal} />
            <Text style={[styles.modalLabelDark, { marginTop: 10, marginBottom: 10 }]}>Default Brand Colors</Text>
            
            <View style={styles.presetContainer}>
              {defaultColors.map((c, index) => (
                <TouchableOpacity key={index} style={[styles.presetCircle, { backgroundColor: c, borderColor: tempColor === c ? '#FFF' : '#444', borderWidth: tempColor === c ? 2 : 1 }]} onPress={() => { setTempColor(c); updateRgbFromHex(c); }} />
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelBtnColor} onPress={() => setColorModalVisible(false)}><Text style={styles.modalBtnTextColor}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtnColor} onPress={() => { setColor(tempColor); setColorModalVisible(false); }}><Text style={styles.modalSaveTextColor}>Apply</Text></TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  background: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  
  logoContainer: { 
    alignItems: 'center', 
    marginTop: 15, 
    marginBottom: 20,
    marginLeft: 8,
  },

  logo: { width: width * 0.4, height: 60, resizeMode: 'contain' },
  topDivider: { width: width, height: 1.25, backgroundColor: '#E0E0E0' },

  pageTitle: { fontSize: 26, fontWeight: '900', color: '#000', marginBottom: 20, marginTop: 25 },

  cardContainer: { backgroundColor: '#FFF3CD', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  marginTop: { marginTop: 15 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  spacer: { width: 15 },
  label: { fontSize: 14, fontWeight: '900', color: '#7A0000', marginBottom: 6 },
  
  input: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 40, fontSize: 14, color: '#000', elevation: 2 },
  dropdown: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 15, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  dropdownText: { fontSize: 14, color: '#000', flex: 1 },
  
  colorPickerContainer: { alignItems: 'center', marginLeft: 15 },
  colorHexText: { fontSize: 10, color: '#333', marginBottom: 4, fontWeight: 'bold' },
  colorCircle: { width: 45, height: 35, borderRadius: 20, borderWidth: 1, borderColor: '#CCC' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },

  okButton: { backgroundColor: '#5C0A0A', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 3 },
  okButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#FFF', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 3 },
  cancelButtonText: { color: '#999', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayColor: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  
  listModalBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 16, color: '#000', marginBottom: 10 },
  listItem: { width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  listItemText: { fontSize: 16, color: '#000', fontWeight: 'bold' },
  
  activeListItemText: { color: '#E50914', fontWeight: 'bold' },

  customItem: { width: '100%', paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 10, marginTop: 10 },
  customItemText: { fontSize: 16, color: '#5C0A0A', fontWeight: 'bold' },
  
  // 🟢 แก้ไขปุ่ม Done ของปฏิทินให้สวยงาม
  modalCloseBtn: { backgroundColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 16, marginBottom: 20, marginTop: 10 },
  modalCloseBtnText: { color: '#333', fontWeight: 'bold' },

  colorModalBox: { width: '90%', backgroundColor: '#2C2C2E', borderRadius: 20, padding: 20 }, 
  previewColorBox: { width: '100%', height: 70, borderRadius: 10, marginBottom: 20, borderWidth: 2, borderColor: '#444' },
  sliderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sliderLabel: { color: '#FFF', width: 50, fontSize: 12, fontWeight: 'bold' },
  hexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalLabelDark: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  hexInput: { backgroundColor: '#444', color: '#FFF', borderRadius: 8, padding: 10, fontSize: 14, width: 100, textAlign: 'center', letterSpacing: 1 },
  topDividerColorModal: { height: 1, backgroundColor: '#444', width: '100%', marginVertical: 10 },
  presetContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  presetCircle: { width: 30, height: 30, borderRadius: 15, margin: 5 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelBtnColor: { flex: 1, backgroundColor: '#444', padding: 12, borderRadius: 12, alignItems: 'center', marginRight: 10 },
  modalBtnTextColor: { color: '#FFF', fontWeight: 'bold' },
  modalSaveBtnColor: { flex: 1, backgroundColor: '#0A84FF', padding: 12, borderRadius: 12, alignItems: 'center', marginLeft: 10 },
  modalSaveTextColor: { color: '#FFF', fontWeight: 'bold' }
});