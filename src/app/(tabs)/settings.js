import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  Modal,
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

export default function ProfileScreen() {
  const router = useRouter();

  // 🟢 State ข้อมูลผู้ใช้จริง
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('Loading...');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [subCount, setSubCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isEmailProvider, setIsEmailProvider] = useState(false); 

  // 🟢 State ควบคุม UI
  const [accountOpen, setAccountOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(true);
  
  const [isEditProfileModal, setIsEditProfileModal] = useState(false);
  const [isChangePasswordModal, setIsChangePasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  // 🟢 State สำหรับฟอร์มเปลี่ยนรหัสผ่าน
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 🟢 โหลดข้อมูลตอนเข้าหน้าจอ
  useEffect(() => {
    loadUserData();
    checkNotificationStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email);

        const provider = user.app_metadata?.provider;
        setIsEmailProvider(provider === 'email');

        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setUsername(profileData.username || 'User');
          setNewUsername(profileData.username || '');
          setAvatarUrl(profileData.avatar_url);
        }

        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setSubCount(count || 0);
      }
    } catch (error) {
      console.log('Error loading user data:', error.message);
    }
  };

  const checkNotificationStatus = async () => {
    setNotificationsEnabled(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newUsername.trim()) return Alert.alert('Error', 'Username cannot be empty');
    
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername, avatar_url: avatarUrl })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsername(newUsername);
      setIsEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  // 🟢 ฟังก์ชันเปลี่ยนรหัสผ่านแบบ 3 ขั้นตอน
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all password fields');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters');
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword
    });

    if (verifyError) {
      return Alert.alert('Error', 'Incorrect current password');
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      Alert.alert('Error', updateError.message);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangePasswordModal(false);
      Alert.alert('Success', 'Password has been changed!');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.pageTitle}>Settings</Text>

        <ImageBackground 
          source={require('../../../assets/images/account_bg.png')} 
          style={styles.profileSection}
          resizeMode="cover"
        >
          <TouchableOpacity onPress={() => setIsEditProfileModal(true)}>
            <View style={styles.profileFrame}>
              <Image 
                // 🟢 เปลี่ยนมาใช้เงื่อนไขเช็กรูป
                source={avatarUrl ? { uri: avatarUrl } : require('../../../assets/images/pfp.png')} 
                style={styles.profileImage} 
              />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.usernameRow} onPress={() => setIsEditProfileModal(true)}>
              <Text style={styles.usernameText}>{username}</Text>
              <Feather name="edit" size={16} color="#B22222" style={styles.editIcon} />
            </TouchableOpacity>
            <Text style={styles.subscriptionText}>{subCount} subscription platforms added.</Text>
          </View>
        </ImageBackground>

        {/* 🟢 1. ส่วน Account */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setAccountOpen(!accountOpen)} 
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={accountOpen ? "chevron-down" : "chevron-forward"} size={22} color="#52A595" />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
          </TouchableOpacity>
          
          {accountOpen && (
            <View style={styles.sectionContent}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{email}</Text>
              </View>
              
              {isEmailProvider && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Password</Text>
                    <Text style={styles.rowValueMasked}>********</Text>
                    <TouchableOpacity style={styles.changeBtn} onPress={() => setIsChangePasswordModal(true)}>
                      <Text style={styles.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* 🟢 2. ส่วน Notifications */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => setNotificationsOpen(!notificationsOpen)} 
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name={notificationsOpen ? "chevron-down" : "chevron-forward"} size={22} color="#52A595" />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: "#D9D9D9", true: "#FF8A8A" }}
              thumbColor={notificationsEnabled ? "#ffffff" : "#f4f3f4"}
              ios_backgroundColor="#D9D9D9"
              value={notificationsEnabled}
              disabled={true} 
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </TouchableOpacity>
          
          {notificationsOpen && (
            <View style={[styles.sectionContent, { paddingHorizontal: 40 }]}>
              <Text style={styles.notificationDesc}>
                Get notifications from WOLL{'\n'}by turning them on in your device settings!
              </Text>
            </View>
          )}
        </View>

        {/* ปุ่ม Log Out */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ================= MODALS ================= */}

      {/* Modal แก้ไขโปรไฟล์ */}
      <Modal visible={isEditProfileModal} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                
                <TouchableOpacity onPress={pickImage} style={styles.modalImageContainer}>
                  <View style={styles.modalFrame}>
                    <Image 
                      // 🟢 เปลี่ยนมาใช้เงื่อนไขเช็กรูปเหมือนกัน
                      source={avatarUrl ? { uri: avatarUrl } : require('../../../assets/images/pfp.png')} 
                      style={styles.modalImage} 
                    />
                  </View>
                  <View style={styles.modalImageEditOverlay}>
                    <Feather name="camera" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>

                <TextInput
                  style={styles.modalInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Username"
                  placeholderTextColor="#999999" // 🟢 เพิ่มสี placeholder
                  color="#000" // 🟢 เพิ่มสีข้อความ
                />
                
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsEditProfileModal(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleUpdateProfile}>
                    <Text style={styles.modalSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🟢 Modal เปลี่ยนรหัสผ่านแบบฟอร์ม 3 ช่อง */}
      <Modal visible={isChangePasswordModal} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Change Password</Text>
                
                <TextInput
                  style={styles.modalInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current Password"
                  placeholderTextColor="#999999" // 🟢 เพิ่มสี placeholder
                  color="#000" // 🟢 เพิ่มสีข้อความ
                  secureTextEntry
                />
                
                <TextInput
                  style={styles.modalInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New Password (min 6 chars)"
                  placeholderTextColor="#999999" // 🟢 เพิ่มสี placeholder
                  color="#000" // 🟢 เพิ่มสีข้อความ
                  secureTextEntry
                />

                <TextInput
                  style={[styles.modalInput, { marginBottom: 30 }]} 
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#999999" // 🟢 เพิ่มสี placeholder
                  color="#000" // 🟢 เพิ่มสีข้อความ
                  secureTextEntry
                />

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => {
                    setIsChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalSaveBtn} onPress={handleChangePassword}>
                    <Text style={styles.modalSaveText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#000000', 
    marginHorizontal: 25, 
    marginTop: 20, 
    marginBottom: 20 
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20, 
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  profileFrame: {
    width: 70,              
    height: 70,              
    borderRadius: 35,        
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    overflow: 'hidden',      
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',    
  },
  profileImage: {
    position: 'absolute',    
    width: 100,               
    height: 100,              
    resizeMode: 'cover',
  },
  profileInfo: { 
    marginLeft: 15, 
    justifyContent: 'center' 
  },
  usernameRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  usernameText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  editIcon: { 
    marginLeft: 8, 
    marginTop: 2 
  },
  subscriptionText: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4 
  },
  sectionContainer: { 
    marginTop: 10 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    paddingHorizontal: 25 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#52A595', 
    marginLeft: 10 
  },
  sectionContent: { 
    paddingHorizontal: 55, 
    paddingVertical: 5 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12 
  },
  rowLabel: { 
    fontSize: 16, 
    color: '#000' 
  },
  rowValue: { 
    fontSize: 14, 
    color: '#666' 
  },
  rowValueMasked: { 
    fontSize: 16, 
    color: '#000', 
    letterSpacing: 2, 
    flex: 1, 
    textAlign: 'center', 
    marginLeft: 10 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#E0E0E0', 
    width: '100%' 
  },
  changeBtn: { 
    backgroundColor: '#FF5C5C', 
    paddingVertical: 5, 
    paddingHorizontal: 12, 
    borderRadius: 12 
  },
  changeBtnText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  notificationDesc: { 
    fontSize: 14, 
    color: '#888', 
    lineHeight: 20, 
    marginTop: -5 
  },
  logoutButton: { 
    backgroundColor: '#7A0000', 
    borderRadius: 25, 
    paddingVertical: 15, 
    marginHorizontal: 50, 
    alignItems: 'center', 
    marginTop: 40, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 4, 
    elevation: 3 
  },
  logoutText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalBox: { 
    width: '80%', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 5 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#5C0A0A', 
    marginBottom: 20 
  },
  modalImageContainer: { 
    position: 'relative', 
    marginBottom: 20 
  },
  modalFrame: {
    width: 100,              
    height: 100,             
    borderRadius: 50,        
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#FFF',
    overflow: 'hidden',      
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    position: 'absolute',    
    width: 143,              
    height: 143,             
    resizeMode: 'cover',
  },
  modalImageEditOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#5C0A0A', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF' 
  },
  modalInput: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 16, 
    marginBottom: 15, 
    backgroundColor: '#F9F9F9' 
  },
  modalButtonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginRight: 10, 
    borderRadius: 12, 
    backgroundColor: '#E0E0E0' 
  },
  modalCancelText: { 
    color: '#333', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  modalSaveBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    marginLeft: 10, 
    borderRadius: 12, 
    backgroundColor: '#4A0404' 
  },
  modalSaveText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});