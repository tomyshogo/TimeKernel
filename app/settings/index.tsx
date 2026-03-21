import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';

interface SettingsItem {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: string;
}

const SETTINGS_SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: 'アカウント',
    items: [
      {
        icon: 'person-outline',
        label: 'プロフィール',
        description: '名前・メール認証',
        route: '/settings/profile',
        color: '#3498db',
      },
      {
        icon: 'shield-outline',
        label: 'プライバシー',
        description: '公開範囲・データ管理',
        route: '/privacy-settings',
        color: '#9b59b6',
      },
    ],
  },
  {
    title: 'カレンダー',
    items: [
      {
        icon: 'calendar-outline',
        label: 'カレンダー管理',
        description: 'カレンダーの作成・編集',
        route: '/calendar',
        color: '#e74c3c',
      },
      {
        icon: 'globe-outline',
        label: '外部カレンダー連携',
        description: 'Google / Apple Calendar',
        route: '/external-calendars',
        color: '#2ecc71',
      },
      {
        icon: 'school-outline',
        label: '資格試験カレンダー',
        description: '試験日程の購読',
        route: '/exam',
        color: '#1abc9c',
      },
    ],
  },
  {
    title: '学校・バイト',
    items: [
      {
        icon: 'time-outline',
        label: '時限設定',
        description: '授業の時間帯を設定',
        route: '/settings/periods',
        color: '#f39c12',
      },
      {
        icon: 'moon-outline',
        label: '深夜割増設定',
        description: 'バイトの割増時間・倍率',
        route: '/settings/night-shift',
        color: '#34495e',
      },
    ],
  },
  {
    title: '通知・生活情報',
    items: [
      {
        icon: 'notifications-outline',
        label: '通知・リマインダー',
        description: '予定のリマインダー設定',
        route: '/notification-settings',
        color: '#e67e22',
      },
      {
        icon: 'cloudy-outline',
        label: '天気・服装提案',
        description: '天気表示と服装の提案',
        route: '/settings/weather',
        color: '#4facfe',
      },
      {
        icon: 'train-outline',
        label: '通勤・通学路線',
        description: '遅延情報を表示する路線',
        route: '/settings/train',
        color: '#00a7db',
      },
      {
        icon: 'school-outline',
        label: '大学ポータル',
        description: 'ポータルサイトへのリンク設定',
        route: '/settings/portal',
        color: '#8e44ad',
      },
      {
        icon: 'mic-outline',
        label: 'Alexa連携',
        description: '音声で予定の確認・追加',
        route: '/settings/alexa',
        color: '#00caff',
      },
    ],
  },
];

const AVATAR_STORAGE_KEY = 'user_avatar_uri';

export default function SettingsHubScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_STORAGE_KEY).then((uri) => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  const handlePickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, uri);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* プロフィールヘッダー */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.profileHeader}>
        <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={10} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <View>
          <Text style={styles.profileName}>{profile?.name || '未設定'}</Text>
          <Text style={styles.profileSub}>設定を管理</Text>
        </View>
      </Animated.View>

      {SETTINGS_SECTIONS.map((section, secIndex) => (
        <Animated.View key={section.title} entering={FadeInDown.delay((secIndex + 1) * 60).duration(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.items.map((item, idx) => (
              <Pressable
                key={item.route}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  idx < section.items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#c0c8d4" />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7f8c8d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  profileSub: {
    fontSize: 13,
    color: '#95a5a6',
    marginTop: 2,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#95a5a6',
    marginLeft: 20,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: '#f5f7fa',
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  menuDescription: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
});
