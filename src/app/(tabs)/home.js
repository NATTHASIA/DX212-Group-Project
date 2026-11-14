import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  PanResponder, // 🟢 เพิ่ม PanResponder สำหรับจับการลากนิ้ว
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  const [showHooray, setShowHooray] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]); 
  const [totalCost, setTotalCost] = useState(0);
  
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current; 

  // 🟢 สร้างตัวจับการลาก (PanResponder) สำหรับ Modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // ให้ทำงานเฉพาะตอนที่ผู้ใช้เริ่ม "ลากลง" เท่านั้น
        return gestureState.dy > 0 && gestureState.vy > 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // อัปเดตค่าอนิเมชั่นให้กรอบขาวเลื่อนลงตามนิ้ว
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // ถ้าลากลงมาเกิน 120px หรือปัดลงแรงๆ ให้ทำการ "ปิด"
        if (gestureState.dy > 120 || gestureState.vy > 1.5) {
          closeCostBreakdown();
        } else {
          // ถ้าลากนิดเดียวแล้วปล่อย ให้เด้งกลับไปที่เดิม
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;

  useFocusEffect(
    useCallback(() => {
      if (params.showHooray === 'true') {
        setShowHooray(true);
        router.setParams({ showHooray: '' });
      }
      checkAndExecuteRolloverAndFetchData();
    }, [params.showHooray])
  );

  const checkAndExecuteRolloverAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`*, service_catalog ( id, name, logo_url, brand_color )`)
        .eq('user_id', user.id);

      if (subsError) throw subsError;
      const subs = subsData || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      for (let sub of subs) {
        if (!sub.next_billing_date) continue;
        const bParts = sub.next_billing_date.split('-');
        const billingDate = new Date(bParts[0], bParts[1] - 1, bParts[2]);
        billingDate.setHours(0, 0, 0, 0);

        if (today >= billingDate) {
          await supabase.from('payment_history').insert([{
            user_id: user.id,
            subscription_id: sub.id,
            amount: sub.price,
            paid_at: sub.next_billing_date
          }]);

          let nextDate = new Date(billingDate);
          const cycle = sub.billing_cycle || 'Monthly';
          if (cycle === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (cycle === 'Every 2 weeks') nextDate.setDate(nextDate.getDate() + 14);
          else if (cycle === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (cycle === 'Every 2 months') nextDate.setMonth(nextDate.getMonth() + 2);
          else if (cycle === 'Every 3 months') nextDate.setMonth(nextDate.getMonth() + 3);
          else if (cycle === 'Every 6 months') nextDate.setMonth(nextDate.getMonth() + 6);
          else if (cycle === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else nextDate.setMonth(nextDate.getMonth() + 1); 

          const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

          await supabase.from('subscriptions').update({ next_billing_date: nextDateStr }).eq('id', sub.id);
          sub.next_billing_date = nextDateStr; 
        }
      }

      setSubscriptions(subs);
      const total = subs.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      setTotalCost(total);

      const currentYear = today.getFullYear();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${currentYear}-${currentMonth}-01`;
      
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select(`*, subscriptions ( id, name, hex_color, service_catalog ( name, logo_url ) )`)
        .eq('user_id', user.id)
        .gte('paid_at', startOfMonth)
        .lte('paid_at', todayStr)
        .order('paid_at', { ascending: false }); 

      if (historyError) throw historyError;
      setRecentPayments(historyData || []);

    } catch (error) {
      console.log('Error in Rollover/Fetch:', error.message);
    }
  };

  const getDisplayName = (subItem) => {
    return subItem?.name || subItem?.service_catalog?.name || 'Unknown';
  };
  
  const breakdownData = subscriptions
    .filter(sub => sub.price > 0)
    .sort((a, b) => b.price - a.price)
    .map(sub => {
      const percentage = totalCost > 0 ? (sub.price / totalCost) * 100 : 0;
      return {
        id: sub.id,
        name: getDisplayName(sub),
        price: sub.price,
        color: sub.hex_color || '#CCC',
        percentage: percentage
      };
    });

  const openCostBreakdown = () => {
    if (breakdownData.length > 0) {
      setShowCostBreakdown(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Alert.alert('Hold on!', "You haven't added any subscriptions yet. Let's add some first!");
    }
  };

  const closeCostBreakdown = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCostBreakdown(false); 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../../assets/images/logo.png')} style={styles.logo} />
      </View>
      <View style={styles.topDivider} />

      <ImageBackground 
        source={require('../../../assets/images/inside_bg.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.contentContainer}>
          <Text style={styles.pageTitle}>Total Subscription</Text>

          <View style={styles.summaryCard}>
            <View style={styles.amountRow}>
              <Text style={styles.amountText}>
                {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.currencyText}> ฿/month</Text>
            </View>
            
            <View style={styles.multiProgressBarContainer}>
              {breakdownData.length > 0 ? (
                breakdownData.map((item, index) => (
                  <View 
                    key={item.id} 
                    style={[
                      styles.progressSegment, 
                      { 
                        backgroundColor: item.color, 
                        width: `${item.percentage}%`,
                        borderTopLeftRadius: index === 0 ? 10 : 0,
                        borderBottomLeftRadius: index === 0 ? 10 : 0,
                        borderTopRightRadius: index === breakdownData.length - 1 ? 10 : 0,
                        borderBottomRightRadius: index === breakdownData.length - 1 ? 10 : 0,
                      }
                    ]} 
                  />
                ))
              ) : (
                <View style={styles.emptyProgressBar} />
              )}
            </View>

            <TouchableOpacity onPress={openCostBreakdown}>
              <Text style={[styles.linkText, breakdownData.length === 0 && { color: '#CCC' }]}>
                See what costs you?
              </Text>
            </TouchableOpacity>
          </View>

          {recentPayments.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Image source={require('../../../assets/images/gray.png')} style={styles.grayCharacter} />
              <Text style={styles.emptyStateText}>
                You haven't made any{'\n'}recent payments.
              </Text>
            </View>
          ) : (
             <View style={styles.recentListContainer}>
                <Text style={styles.recentTitle}>Recently Paid</Text>
                <FlatList
                   data={recentPayments}
                   keyExtractor={item => item.id.toString()}
                   showsVerticalScrollIndicator={false}
                   contentContainerStyle={{ paddingBottom: 20 }} 
                   renderItem={({ item }) => {
                     const sub = item.subscriptions;
                     const logoUrl = sub?.service_catalog?.logo_url;
                     const dName = getDisplayName(sub);
                     const color = sub?.hex_color || '#CCC';

                     return (
                        <View style={styles.recentCard}>
                           <View style={styles.recentLogoWrapper}>
                             {logoUrl ? (
                               <Image source={{ uri: logoUrl }} style={styles.recentLogo} />
                             ) : (
                               <View style={[styles.recentFallbackLogo, { backgroundColor: color }]}>
                                 <Text style={styles.recentFallbackLogoText}>{dName.charAt(0).toUpperCase()}</Text>
                               </View>
                             )}
                           </View>
                           <View style={styles.recentInfo}>
                             <Text style={styles.recentName} numberOfLines={1}>{dName}</Text>
                             <Text style={styles.recentDate}>
                               {item.paid_at ? new Date(item.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'}
                             </Text>
                           </View>
                           <Text style={styles.recentPrice}>{Number(item.amount).toFixed(2)}</Text>
                        </View>
                     )
                   }}
                />
             </View>
          )}
        </View>
      </ImageBackground>

      <Modal 
        visible={showCostBreakdown} 
        transparent 
        animationType="fade" 
        onRequestClose={closeCostBreakdown}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={closeCostBreakdown} 
          />
          
          <Animated.View 
            style={[
              styles.bottomSheetContainer, 
              { transform: [{ translateY: slideAnim }] } 
            ]}
          >
            {/* 🟢 ห่อพื้นที่ส่วนหัวและขีดด้วย panHandlers เพื่อให้จับลากนิ้วได้ */}
            <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
              <View style={styles.dragIndicator} />
              <Text style={styles.bottomSheetTitle}>Cost Breakdown</Text>
            </View>
            
            <View style={{ width: '100%', height: 240 }}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
                {breakdownData.map((item) => (
                  <View key={item.id} style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.breakdownName}>{item.name}</Text>
                    </View>
                    <View style={styles.breakdownRight}>
                      <Text style={styles.breakdownPercentage}>{item.percentage.toFixed(1)}%</Text>
                      <Text style={styles.breakdownPrice}>{item.price.toFixed(2)} ฿</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity style={styles.closeSheetBtn} onPress={closeCostBreakdown}>
              <Text style={styles.closeSheetBtnText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showHooray} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowHooray(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Image source={require('../../../assets/images/Hooray.png')} style={styles.hoorayImg} />
                <Text style={styles.hoorayTitle}>Hooray!</Text>
                <Text style={styles.hooraySub}>Glad you are here</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  background: { flex: 1, width: '100%' },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 0 }, 
  
  logoContainer: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  logo: { width: width * 0.4, height: 60, resizeMode: 'contain' },
  topDivider: { width: width, height: 1.25, backgroundColor: '#E0E0E0' },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#000000', marginBottom: 20, marginHorizontal: 5 },
  
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 25, marginBottom: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#FFEBEB', shadowColor: '#FFCACA', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  amountText: { fontSize: 40, fontWeight: 'bold', color: '#000000', letterSpacing: -1 },
  currencyText: { fontSize: 16, fontWeight: 'bold', color: '#666666', marginLeft: 5 },
  multiProgressBarContainer: { flexDirection: 'row', height: 18, borderRadius: 10, marginBottom: 15, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  progressSegment: { height: '100%' },
  emptyProgressBar: { flex: 1, height: 18, backgroundColor: '#BCC6D0', borderRadius: 10 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#555555', textDecorationLine: 'underline' },
  
  recentListContainer: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0, 
    borderBottomRightRadius: 0,
    paddingTop: 20,
    paddingHorizontal: 20, 
    marginHorizontal: 5, 
    borderWidth: 1, 
    borderColor: '#FFEBEB', 
    borderBottomWidth: 0, 
    shadowColor: '#FFCACA', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 8, 
    elevation: 3 
  },
  recentTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 15 },
  recentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  recentLogoWrapper: { marginRight: 15 },
  recentLogo: { width: 45, height: 45, borderRadius: 10 },
  recentFallbackLogo: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recentFallbackLogoText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  recentDate: { fontSize: 12, color: '#888', marginTop: 2 },
  recentPrice: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  grayCharacter: { width: 220, height: 170, resizeMode: 'contain', marginLeft: -22, marginBottom: 20 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', color: '#999999', textAlign: 'center', lineHeight: 26 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(230, 230, 230, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '85%', backgroundColor: '#ffffff', borderRadius: 45, paddingVertical: 50, paddingHorizontal: 60, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  hoorayImg: { width: 140, height: 140, resizeMode: 'contain', marginBottom: 20 },
  hoorayTitle: { fontSize: 32, fontWeight: '900', color: '#8B1A1A', marginBottom: 8 },
  hooraySub: { fontSize: 16, fontWeight: '600', color: '#888' },
  
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContainer: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 25, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 25, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // 🟢 สไตล์ใหม่สำหรับพื้นที่ลาก
  dragHandleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 15,
    backgroundColor: 'transparent',
  },
  dragIndicator: { width: 50, height: 5, backgroundColor: '#E0E0E0', borderRadius: 5, marginBottom: 20 },
  bottomSheetTitle: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 20, alignSelf: 'flex-start' },
  
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  breakdownName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  breakdownRight: { alignItems: 'flex-end' },
  breakdownPercentage: { fontSize: 12, color: '#888', marginBottom: 2 },
  breakdownPrice: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  closeSheetBtn: { width: '100%', backgroundColor: '#5C0A0A', borderRadius: 25, paddingVertical: 15, alignItems: 'center', marginTop: 25 },
  closeSheetBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});