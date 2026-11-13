import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function ListScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  // 🟢 State หลักสำหรับคุม Modal (โหมด View หรือ Edit)
  const [modalMode, setModalMode] = useState(null); // null | 'view' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);

  // 🟢 State รอง สำหรับคุมป๊อปอัพย่อย "ให้อยู่ซ้อนบนหน้า Edit อีกที"
  const [editPopup, setEditPopup] = useState(null); // null | 'service' | 'repeat' | 'notify' | 'color' | 'date'

  // --- State สำหรับแก้ไขข้อมูล ---
  const [editSelectedService, setEditSelectedService] = useState(null);
  const [editIsCustom, setEditIsCustom] = useState(false);
  const [editCustomName, setEditCustomName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [editPayment, setEditPayment] = useState('');
  const [editRepeat, setEditRepeat] = useState('Monthly');
  const [editNotifyDays, setEditNotifyDays] = useState(3);
  const [editNotificationsEnabled, setEditNotificationsEnabled] = useState(true);
  const [editCancelUrl, setEditCancelUrl] = useState('');

  // --- State สำหรับ Edit Color Picker ---
  const [editColor, setEditColor] = useState('#000000');
  const [editTempColor, setEditTempColor] = useState('#000000');
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  const repeatOptions = ['Never', 'Weekly', 'Every 2 weeks', 'Monthly', 'Every 2 months', 'Every 3 months', 'Every 6 months', 'Yearly'];
  const notifyOptions = [3, 2, 1];

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
      fetchServices();
    }, [])
  );

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`*, service_catalog ( id, name, logo_url, brand_color, cancel_url )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false, nullsFirst: false }); // 🟢 เติม nullsFirst: false เข้าไปตรงนี้ครับ

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.log('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('service_catalog').select('*').eq('is_active', true);
    if (data) setServices(data);
  };

  const getDisplayName = (item) => {
    if (!item) return '';
    return item.name || item.service_catalog?.name || '';
  };

  const defaultColors = Array.from(new Set(services.map(s => s.brand_color).filter(Boolean)));

  const updateHexFromRgb = (red, green, blue) => {
    const toHex = (c) => { const hex = Math.round(c).toString(16); return hex.length === 1 ? '0' + hex : hex; };
    setEditTempColor(`#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase());
  };

  const updateRgbFromHex = (hex) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      setR(parseInt(cleanHex.substring(0, 2), 16) || 0);
      setG(parseInt(cleanHex.substring(2, 4), 16) || 0);
      setB(parseInt(cleanHex.substring(4, 6), 16) || 0);
    }
  };

  const deleteItem = (id) => {
    Alert.alert('ยืนยันการลบ', 'คุณต้องการลบรายการนี้ใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('subscriptions').delete().eq('id', id);
          setModalMode(null);
          fetchSubscriptions();
        }
      }
    ]);
  };

  const openLink = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Error', 'ไม่สามารถเปิดลิงก์นี้ได้');
    } catch (error) {
      Alert.alert('Error', 'เกิดข้อผิดพลาดในการเปิดลิงก์');
    }
  };

  const openEditModal = () => {
    if (!selectedItem) return;

    if (selectedItem.catalog_id) {
      const foundService = services.find(s => s.id === selectedItem.catalog_id) || selectedItem.service_catalog;
      setEditIsCustom(false);
      setEditSelectedService(foundService);
      setEditCustomName(''); 
    } else {
      setEditIsCustom(true);
      setEditSelectedService(null);
      setEditCustomName(selectedItem.name || '');
    }

    setEditPrice(selectedItem.price ? selectedItem.price.toString() : '');
    setEditDate(selectedItem.next_billing_date ? new Date(selectedItem.next_billing_date) : new Date());
    setEditPayment(selectedItem.payment || ''); // ดึงข้อมูล payment ขึ้นมาแสดงตอน Edit
    setEditRepeat(selectedItem.billing_cycle || 'Monthly');
    setEditNotifyDays(selectedItem.notify_days_before > 0 ? selectedItem.notify_days_before : 3);
    setEditNotificationsEnabled(selectedItem.notify_days_before > 0);
    setEditCancelUrl(selectedItem.custom_cancle_url || '');
    setEditColor(selectedItem.hex_color || '#000000');

    setEditPopup(null);
    setModalMode('edit');
  };

  const handleSelectEditService = (item) => {
    setEditIsCustom(false);
    setEditSelectedService(item);
    setEditColor(item.brand_color || '#000000');
    setEditCancelUrl(item.cancel_url || '');
    setEditPopup(null); 
  };

  const handleEditCustom = () => {
    setEditIsCustom(true);
    setEditSelectedService(null);
    setEditCancelUrl('');
    setEditColor('#000000');
    setEditPopup(null);
  };

  const saveEdit = async () => {
    if (!selectedItem) return;
    if (!editIsCustom && !editSelectedService) return Alert.alert('แจ้งเตือน', 'กรุณาเลือกบริการ หรือพิมพ์ชื่อเอง');
    
    const finalName = editIsCustom ? editCustomName.trim() : null; // 🟢 คืนค่า Name ให้เป็น Null ถ้าเลือกบริการจากระบบ
    if (editIsCustom && !finalName) return Alert.alert('แจ้งเตือน', 'กรุณาระบุชื่อบริการ');

    const p = parseFloat(editPrice);
    if (isNaN(p) || p <= 0) return Alert.alert('แจ้งเตือน', 'ราคาต้องเป็นตัวเลขมากกว่า 0');

    try {
      const formattedDate = editDate.toISOString().split('T')[0];
      const payload = {
        catalog_id: editIsCustom ? null : editSelectedService?.id,
        name: finalName, 
        hex_color: editColor,
        price: p,
        billing_cycle: editRepeat,
        next_billing_date: formattedDate,
        notify_days_before: editNotificationsEnabled ? parseInt(editNotifyDays) : 0, 
        custom_cancle_url: editCancelUrl || null,
        payment: editPayment 
      };

      const { error } = await supabase.from('subscriptions').update(payload).eq('id', selectedItem.id);
      if (error) throw error;

      Alert.alert('สำเร็จ', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
      setModalMode(null);
      fetchSubscriptions();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatDateDDMM = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  };

  const filteredData = subscriptions.filter(item => {
    const itemName = getDisplayName(item);
    return itemName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }) => {
    const isNotifyOn = item.notify_days_before > 0;
    const logoUrl = item.service_catalog?.logo_url;
    const displayName = getDisplayName(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedItem(item);
          setModalMode('view');
        }}
      >
        <View style={styles.logoWrapper}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.appLogo} />
          ) : (
            <View style={[styles.fallbackLogo, { backgroundColor: item.hex_color || '#CCC' }]}>
              <Text style={styles.fallbackLogoText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.appName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.appPrice}>{item.price} ฿/month</Text>
        </View>

        <View style={styles.cardRight}>
          <Ionicons 
            name={isNotifyOn ? "notifications" : "notifications-off"} 
            size={24} 
            color={isNotifyOn ? "#F4B400" : "#BCC6D0"} 
          />
          <Text style={styles.dateText}>{formatDateShort(item.next_billing_date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
          </View>
          <View style={styles.topDivider} />

          <ImageBackground source={require('../../../assets/images/inside_bg.png')} 
            style={styles.background} 
            resizeMode="cover" 
            imageStyle={{ opacity: 0.8 }}>
            
            <View style={styles.contentContainer}>
              
              <Text style={styles.pageTitle}>Subscription List</Text>

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

              {!loading && filteredData.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Setting reminders for{'\n'}your subscriptions!</Text>
                  <Image source={require('../../../assets/images/gray2.png')} style={styles.grayCharacter} />
                </View>
              ) : (
                <FlatList
                  data={filteredData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                />
              )}
            </View>
          </ImageBackground>
        </View>
      </TouchableWithoutFeedback>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
        <Ionicons name="add" size={36} color="#ffffff" />
      </TouchableOpacity>

      {/* ========================================================================= */}
      {/* 🟢 SINGLE MODAL ควบคุมทุกหน้าต่าง (ป้องกันบั๊กหน้าค้างของ iOS) */}
      {/* ========================================================================= */}
      <Modal visible={modalMode !== null} transparent animationType="fade" onRequestClose={() => setModalMode(null)}>
        
        {/* ================= 1. โหมด View Data (การ์ดสีเหลือง) ================= */}
        {modalMode === 'view' && (
          <TouchableWithoutFeedback onPress={() => setModalMode(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.viewModalBox}>
                  <TouchableOpacity style={styles.closeIconTopRight} onPress={() => setModalMode(null)}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>

                  <View style={styles.viewHeaderRow}>
                    <View style={styles.viewLogoWrapper}>
                      {selectedItem?.service_catalog?.logo_url ? (
                        <Image source={{ uri: selectedItem.service_catalog.logo_url }} style={styles.viewLogo} />
                      ) : (
                        <View style={[styles.viewFallbackLogo, { backgroundColor: selectedItem?.hex_color || '#CCC' }]}>
                          <Text style={styles.viewFallbackLogoText}>{getDisplayName(selectedItem).charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.viewTitleWrapper}>
                      <Text style={styles.viewTitle}>{getDisplayName(selectedItem)}</Text>
                      <Text style={styles.viewHex}>{selectedItem?.hex_color}</Text>
                    </View>
                    <Text style={styles.viewPriceBig}>{selectedItem?.price?.toFixed(2)}</Text>
                  </View>
                  <View style={styles.viewDashedLine} />

                  <View style={styles.viewDataRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewLabelSmall}>Payment</Text>
                      <Text style={styles.viewValueRed}>{selectedItem?.payment || 'Credit Card'}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.viewLabelSmall}>Date</Text>
                      <Text style={styles.viewValueRed}>{formatDateDDMM(selectedItem?.next_billing_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.viewDashedLine} />

                  <View style={styles.viewDataRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewLabelSmall}>
                        Notification{' '}
                        <Text style={{ color: selectedItem?.notify_days_before > 0 ? '#D32F2F' : '#999', fontWeight: 'bold' }}>
                          {selectedItem?.notify_days_before > 0 ? 'ON' : 'OFF'}
                        </Text>
                      </Text>
                      <Text style={styles.viewValueRed}>
                        {selectedItem?.notify_days_before > 0 ? `${selectedItem.notify_days_before} day${selectedItem.notify_days_before > 1 ? 's' : ''} before` : 'Disabled'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.viewLabelSmall}>Repeat</Text>
                      <Text style={styles.viewValueRed}>{selectedItem?.billing_cycle}</Text>
                    </View>
                  </View>
                  <View style={styles.viewDashedLine} />

                  <View style={styles.viewDataCol}>
                    <Text style={styles.viewLabelSmall}>Cancel Subscription URL</Text>
                    {selectedItem?.custom_cancle_url ? (
                      <TouchableOpacity onPress={() => openLink(selectedItem.custom_cancle_url)}>
                        <Text style={styles.viewLinkText} numberOfLines={1}>{selectedItem.custom_cancle_url}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.viewLinkTextNone}>- ไม่ระบุ -</Text>
                    )}
                  </View>
                  <View style={styles.viewSolidLine} />

                  <View style={styles.viewBtnRow}>
                    <TouchableOpacity style={styles.viewDeleteBtn} onPress={() => deleteItem(selectedItem?.id)}>
                      <Text style={styles.viewDeleteText}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.viewEditBtn} onPress={openEditModal}>
                      <Text style={styles.viewEditText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* ================= 2. โหมด Edit Data (ล้อตามหน้า Add ทุกประการ) ================= */}
        {modalMode === 'edit' && (
          <View style={{ flex: 1 }}>
            
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                  <View style={styles.editModalBox}>
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      <Text style={styles.editPageTitle}>Edit</Text>

                      <View style={styles.editCardContainer}>
                        {/* Name & Color */}
                        <View style={styles.row}>
                          <View style={styles.flex2}>
                            <Text style={styles.label}>Name</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => { Keyboard.dismiss(); setEditPopup('service'); }}>
                              <Text style={[styles.dropdownText, !editSelectedService && !editIsCustom && { color: '#999999' }]}>
                                {editIsCustom ? editCustomName || 'Select Service...' : editSelectedService?.name || 'Select Service...'}
                              </Text>
                              <Ionicons name="chevron-down" size={16} color="#000" />
                            </TouchableOpacity>

                            {editIsCustom && (
                              <TextInput
                                style={[styles.input, { marginTop: 10 }]}
                                value={editCustomName}
                                onChangeText={setEditCustomName}
                                placeholder="Type custom name"
                                placeholderTextColor="#999999"
                              />
                            )}
                          </View>

                          <View style={styles.colorPickerContainer}>
                            <Text style={styles.colorHexText}>{editColor}</Text>
                            <TouchableOpacity
                              style={[styles.colorCircle, { backgroundColor: editColor }]}
                              onPress={() => {
                                Keyboard.dismiss();
                                setEditTempColor(editColor);
                                updateRgbFromHex(editColor);
                                setEditPopup('color');
                              }}
                            />
                          </View>
                        </View>

                        {/* Price & Date */}
                        <View style={[styles.row, styles.marginTop]}>
                          <View style={styles.flex1}>
                            <Text style={styles.label}>Price</Text>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#999999" keyboardType="decimal-pad" value={editPrice} onChangeText={setEditPrice} />
                          </View>
                          <View style={styles.spacer} />
                          <View style={styles.flex1}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                              style={[styles.input, { justifyContent: 'center' }]}
                              onPress={() => {
                                Keyboard.dismiss();
                                if (Platform.OS === 'ios') setEditPopup('date');
                                else setEditPopup('date-android');
                              }}
                            >
                              <Text style={{ color: '#000', fontSize: 14 }}>
                                {editDate.toISOString().split('T')[0]}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Payment & Repeat */}
                        <View style={[styles.row, styles.marginTop]}>
                          <View style={styles.flex1}>
                            <Text style={styles.label}>Payment</Text>
                            <TextInput style={styles.input} placeholder="Credit Card" placeholderTextColor="#999999" value={editPayment} onChangeText={setEditPayment} />
                          </View>
                          <View style={styles.spacer} />
                          <View style={styles.flex1}>
                            <Text style={styles.label}>Repeat</Text>
                            <TouchableOpacity style={styles.dropdown} onPress={() => { Keyboard.dismiss(); setEditPopup('repeat'); }}>
                              <Text style={styles.dropdownText}>{editRepeat}</Text>
                              <Ionicons name="chevron-down" size={16} color="#000" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Notifications */}
                        <View style={styles.marginTop}>
                          <View style={styles.switchRow}>
                            <Text style={styles.label}>Notifications</Text>
                            <Switch
                              value={editNotificationsEnabled}
                              onValueChange={setEditNotificationsEnabled}
                              trackColor={{ false: "#D9D9D9", true: "#FF6B6B" }}
                              thumbColor="#FFF"
                              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 10, marginTop: -5 }}
                            />
                          </View>
                          <TouchableOpacity
                            style={[styles.dropdown, { opacity: editNotificationsEnabled ? 1 : 0.5 }]}
                            disabled={!editNotificationsEnabled}
                            onPress={() => { Keyboard.dismiss(); setEditPopup('notify'); }}
                          >
                            <Text style={styles.dropdownText}>{editNotifyDays} day{editNotifyDays > 1 ? 's' : ''} before</Text>
                            <Ionicons name="chevron-down" size={16} color="#000" />
                          </TouchableOpacity>
                        </View>

                        {/* Cancel URL */}
                        <View style={styles.marginTop}>
                          <Text style={styles.label}>Cancel Subscription URL</Text>
                          <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#999999" value={editCancelUrl} onChangeText={setEditCancelUrl} autoCapitalize="none" />
                        </View>

                        {/* Buttons */}
                        <TouchableOpacity style={styles.okButton} onPress={saveEdit}>
                          <Text style={styles.okButtonText}>OK</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalMode(null)}>
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                      </View>
                    </ScrollView>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* 🟢 OVERLAY YOY: ส่วนของป๊อปอัพตัวเลือกต่างๆ (ซ้อนทับอยู่บนหน้า Edit อีกที) */}
            
            {editPopup === 'service' && (
              <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 100, elevation: 100 }]}>
                <View style={styles.listModalBox}>
                  <Text style={styles.modalTitle}>Select Service</Text>
                  <ScrollView style={{ width: '100%', maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                    {services.map((item) => (
                      <TouchableOpacity key={item.id} style={styles.listItem} onPress={() => handleSelectEditService(item)}>
                        <Text style={styles.listItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.customItem} onPress={handleEditCustom}>
                      <Ionicons name="add-circle-outline" size={20} color="#5C0A0A" style={{ marginRight: 8 }} />
                      <Text style={styles.customItemText}>Custom (พิมพ์ชื่อแอปเอง)</Text>
                    </TouchableOpacity>
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditPopup(null)}>
                    <Text style={styles.modalCloseBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {editPopup === 'repeat' && (
              <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 100, elevation: 100 }]}>
                <View style={styles.listModalBox}>
                  <Text style={styles.modalTitle}>Select Repeat</Text>
                  <ScrollView style={{ width: '100%', maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                    {repeatOptions.map((opt) => (
                      <TouchableOpacity key={opt} style={styles.listItem} onPress={() => { setEditRepeat(opt); setEditPopup(null); }}>
                        <Text style={[styles.listItemText, editRepeat === opt && styles.activeListItemText]}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditPopup(null)}>
                    <Text style={styles.modalCloseBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {editPopup === 'notify' && (
              <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 100, elevation: 100 }]}>
                <View style={styles.listModalBox}>
                  <Text style={styles.modalTitle}>Select Notification</Text>
                  <ScrollView style={{ width: '100%', maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                    {notifyOptions.map((opt) => (
                      <TouchableOpacity key={opt} style={styles.listItem} onPress={() => { setEditNotifyDays(opt); setEditPopup(null); }}>
                        <Text style={[styles.listItemText, editNotifyDays === opt && styles.activeListItemText]}>{opt} day{opt > 1 ? 's' : ''} before</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditPopup(null)}>
                    <Text style={styles.modalCloseBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {editPopup === 'date' && Platform.OS === 'ios' && (
              <View style={[StyleSheet.absoluteFill, styles.modalOverlay, { zIndex: 100, elevation: 100 }]}>
                <View style={[styles.listModalBox, { padding: 0 }]}>
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display="spinner"
                    textColor="#000000"
                    themeVariant="light"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) setEditDate(selectedDate);
                    }}
                  />
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditPopup(null)}>
                    <Text style={styles.modalCloseBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {editPopup === 'color' && (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[StyleSheet.absoluteFill, styles.modalOverlayColor, { zIndex: 100, elevation: 100 }]}>
                  <View style={styles.colorModalBox}>
                    <View style={[styles.previewColorBox, { backgroundColor: editTempColor }]} />

                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>R ({r})</Text>
                      <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={255} step={1} value={r} minimumTrackTintColor="#FF0000" onValueChange={(val) => { setR(val); updateHexFromRgb(val, g, b); }} />
                    </View>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>G ({g})</Text>
                      <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={255} step={1} value={g} minimumTrackTintColor="#00FF00" onValueChange={(val) => { setG(val); updateHexFromRgb(r, val, b); }} />
                    </View>
                    <View style={styles.sliderContainer}>
                      <Text style={styles.sliderLabel}>B ({b})</Text>
                      <Slider style={{ flex: 1 }} minimumValue={0} maximumValue={255} step={1} value={b} minimumTrackTintColor="#0000FF" onValueChange={(val) => { setB(val); updateHexFromRgb(r, g, val); }} />
                    </View>

                    <View style={styles.hexRow}>
                      <Text style={styles.modalLabelDark}>Hex #</Text>
                      <TextInput style={styles.hexInput} value={editTempColor} onChangeText={(val) => { setEditTempColor(val); updateRgbFromHex(val); }} autoCapitalize="characters" maxLength={7} />
                    </View>

                    <View style={styles.topDividerColorModal} />
                    <Text style={[styles.modalLabelDark, { marginTop: 10, marginBottom: 10 }]}>Default Brand Colors</Text>

                    <View style={styles.presetContainer}>
                      {defaultColors.map((c, index) => (
                        <TouchableOpacity key={index} style={[styles.presetCircle, { backgroundColor: c, borderColor: editTempColor === c ? '#FFF' : '#444', borderWidth: editTempColor === c ? 2 : 1 }]} onPress={() => { setEditTempColor(c); updateRgbFromHex(c); }} />
                      ))}
                    </View>

                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity style={styles.modalCancelBtnColor} onPress={() => setEditPopup(null)}>
                        <Text style={styles.modalBtnTextColor}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.modalSaveBtnColor} onPress={() => { setEditColor(editTempColor); setEditPopup(null); }}>
                        <Text style={styles.modalSaveTextColor}>Apply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            )}

          </View>
        )}

      </Modal>
      
      {/* DatePicker (Android Native - เอาไว้นอกสุด) */}
      {editPopup === 'date-android' && Platform.OS === 'android' && (
        <DateTimePicker
          value={editDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setEditPopup(null);
            if (selectedDate) setEditDate(selectedDate);
          }}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  logoContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  logo: { width: width * 0.4, height: 60, resizeMode: 'contain' },
  topDivider: { height: 1.25, backgroundColor: '#E0E0E0', width: width },
  background: { flex: 1, width: '100%' },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 30 }, // 🟢 แก้จาก 25 เป็น 20
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#000000', marginBottom: 15 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B',
    borderRadius: 25, paddingHorizontal: 15, height: 45, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, height: '100%' },

  emptyStateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
  emptyStateText: { fontSize: 18, color: '#999999', textAlign: 'center', fontWeight: 'bold', lineHeight: 26, marginBottom: -55 },
  grayCharacter: { width: 370, height: 240, resizeMode: 'contain' },

  fab: { position: 'absolute', bottom: 25, right: 25, width: 65, height: 65, backgroundColor: '#C62828', borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#C62828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 16, marginVertical: 8, 
    marginHorizontal: 8.5, // 🟢 เติมบรรทัดนี้ เพื่อเผื่อที่ว่างด้านซ้าย-ขวาให้เงาแสดงผล
    paddingVertical: 8, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4
  },
  logoWrapper: { padding: 8 },
  appLogo: { width: 45, height: 45, borderRadius: 10, resizeMode: 'cover' },
  fallbackLogo: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  fallbackLogoText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  cardInfo: { flex: 1, paddingVertical: 10, justifyContent: 'center', marginLeft: 8 },
  appName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  appPrice: { fontSize: 14, color: '#888', fontWeight: '600' },
  cardRight: { paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  viewModalBox: { width: '85%', backgroundColor: '#FFF3CD', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  closeIconTopRight: { position: 'absolute', top: 12, right: 12, padding: 5, zIndex: 10 },
  viewHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  viewLogoWrapper: { marginRight: 15 },
  viewLogo: { width: 50, height: 50, borderRadius: 12 },
  viewFallbackLogo: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  viewFallbackLogoText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  viewTitleWrapper: { flex: 1 },
  viewTitle: { fontSize: 22, fontWeight: '900', color: '#000' },
  viewHex: { fontSize: 12, color: '#666', marginTop: 2 },
  viewPriceBig: { fontSize: 22, fontWeight: 'bold', color: '#D32F2F' },
  viewDashedLine: { height: 1, width: '100%', borderColor: '#D3A550', borderWidth: 1, borderStyle: 'dashed', marginVertical: 12 },
  viewDataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  viewLabelSmall: { fontSize: 12, color: '#888', marginBottom: 4 },
  viewValueRed: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  viewDataCol: { marginTop: 5 },
  viewLinkText: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F', textDecorationLine: 'underline' },
  viewLinkTextNone: { fontSize: 15, color: '#999', fontStyle: 'italic' },
  viewSolidLine: { height: 1.5, width: '100%', backgroundColor: '#D3A550', marginVertical: 15 },
  viewBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  viewDeleteBtn: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingVertical: 10, alignItems: 'center', marginRight: 10 },
  viewDeleteText: { color: '#000', fontSize: 16, fontWeight: '600' },
  viewEditBtn: { flex: 1, backgroundColor: '#FF6B6B', borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingVertical: 10, alignItems: 'center', marginLeft: 10 },
  viewEditText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  editModalBox: { width: '92%', maxHeight: '90%', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 20, paddingTop: 25, paddingBottom: 25, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  editPageTitle: { fontSize: 26, fontWeight: '900', color: '#000', marginBottom: 15 },
  editCardContainer: { backgroundColor: '#FFF3CD', borderRadius: 20, padding: 20 },

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
  okButton: { backgroundColor: '#5C0A0A', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 25, elevation: 3 },
  okButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#FFF', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 12, elevation: 3 },
  cancelButtonText: { color: '#999', fontSize: 18, fontWeight: 'bold' },

  listModalBox: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 16, color: '#000', marginBottom: 10 },
  listItem: { width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', alignItems: 'center' },
  listItemText: { fontSize: 16, color: '#000', fontWeight: 'bold' },
  activeListItemText: { color: '#E50914', fontWeight: 'bold' },
  customItem: { width: '100%', paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 10, marginTop: 10 },
  customItemText: { fontSize: 16, color: '#5C0A0A', fontWeight: 'bold' },
  modalCloseBtn: { backgroundColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 16, marginBottom: 15, marginTop: 15 },
  modalCloseBtnText: { color: '#333', fontWeight: 'bold' },

  modalOverlayColor: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
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