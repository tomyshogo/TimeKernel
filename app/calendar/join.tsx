import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { joinCalendar } from '../../src/services/calendarService';
import { getOrCreateUser } from '../../src/services/userService';
import { extractCalendarIdFromLink } from '../../src/services/shareService';

export default function JoinCalendarScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.uid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleJoin = async (value?: string) => {
    const text = (value || input).trim();
    if (!uid || !text) return;

    const calendarId = extractCalendarIdFromLink(text) || text;
    setLoading(true);
    try {
      const success = await joinCalendar(calendarId, uid);
      if (success) {
        const { profile: updatedProfile } = await getOrCreateUser(uid);
        setProfile(updatedProfile);
        Alert.alert('参加完了', 'カレンダーに参加しました');
        router.back();
      } else {
        Alert.alert('エラー', 'カレンダーが見つかりません');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('カメラの権限', 'QRコードを読み取るにはカメラの権限が必要です');
        return;
      }
    }
    setScanned(false);
    setScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);
    const calendarId = extractCalendarIdFromLink(data);
    if (calendarId) {
      setInput(data);
      handleJoin(data);
    } else {
      setInput(data);
      Alert.alert('QR読み取り完了', '内容を確認して参加ボタンを押してください');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="qr-code-outline" size={18} color="#3498db" />
            <Text style={styles.sectionTitle}>QRコードで参加</Text>
          </View>
          <Text style={styles.description}>
            共有されたQRコードを読み取って参加できます
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={22} color="#fff" />
            <Text style={styles.scanButtonText}>QRコードをスキャン</Text>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={18} color="#e67e22" />
            <Text style={styles.sectionTitle}>リンク・IDで参加</Text>
          </View>
          <Text style={styles.description}>
            共有リンクまたはカレンダーIDを入力してください
          </Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="リンクまたはIDを入力"
            placeholderTextColor="#b0b8c8"
            autoCapitalize="none"
          />
          <Button
            title="参加"
            onPress={() => handleJoin()}
            loading={loading}
            disabled={!input.trim()}
            style={{ marginTop: 12 }}
          />
        </Card>
      </Animated.View>

      {/* QRスキャナーモーダル */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
          </View>
          <View style={styles.scannerHeader}>
            <Pressable onPress={() => setScannerVisible(false)} style={styles.scannerClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.scannerFooter}>
            <Text style={styles.scannerHint}>QRコードを枠内に合わせてください</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  description: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3498db',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Scanner
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 20,
  },
  scannerHeader: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  scannerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFooter: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerHint: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
