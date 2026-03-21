import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = 'university_portal_links';

interface PortalLink {
  id: string;
  name: string;
  url: string;
}

const PRESET_PORTALS = [
  { name: 'manaba', urlHint: 'https://manaba.xxx-u.ac.jp' },
  { name: 'Google Classroom', urlHint: 'https://classroom.google.com' },
  { name: 'Microsoft Teams', urlHint: 'https://teams.microsoft.com' },
  { name: 'Moodle', urlHint: 'https://moodle.xxx-u.ac.jp' },
  { name: 'Universal Passport', urlHint: 'https://unipa.xxx-u.ac.jp' },
];

export default function PortalSettingsScreen() {
  const [links, setLinks] = useState<PortalLink[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setLinks(JSON.parse(val));
    });
  }, []);

  const save = async (updated: PortalLink[]) => {
    setLinks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) {
      Alert.alert('入力エラー', '名前とURLを入力してください');
      return;
    }
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http')) {
      finalUrl = 'https://' + finalUrl;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    save([...links, { id: Date.now().toString(), name: name.trim(), url: finalUrl }]);
    setName('');
    setUrl('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const link = links.find((l) => l.id === id);
    Alert.alert('リンクを削除', `「${link?.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => save(links.filter((l) => l.id !== id)) },
    ]);
  };

  const handleOpen = (link: PortalLink) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(link.url);
  };

  const handlePreset = (preset: { name: string; urlHint: string }) => {
    setName(preset.name);
    setUrl(preset.urlHint);
    setShowAdd(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={18} color="#8e44ad" />
            <Text style={styles.sectionTitle}>登録済みリンク</Text>
          </View>

          {links.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="link-outline" size={32} color="#d5d8dc" />
              <Text style={styles.emptyText}>リンクが登録されていません</Text>
            </View>
          ) : (
            links.map((link) => (
              <View key={link.id} style={styles.linkRow}>
                <TouchableOpacity style={styles.linkInfo} onPress={() => handleOpen(link)} activeOpacity={0.7}>
                  <View style={styles.linkIcon}>
                    <Ionicons name="open-outline" size={18} color="#8e44ad" />
                  </View>
                  <View style={styles.linkText}>
                    <Text style={styles.linkName}>{link.name}</Text>
                    <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(link.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </Animated.View>

      {/* 追加フォーム */}
      <Animated.View entering={FadeInDown.delay(60).duration(300).springify()}>
        <Card>
          <TouchableOpacity
            style={styles.addToggle}
            onPress={() => setShowAdd(!showAdd)}
            activeOpacity={0.7}
          >
            <Ionicons name={showAdd ? 'chevron-up' : 'add-circle-outline'} size={20} color="#3498db" />
            <Text style={styles.addToggleText}>リンクを追加</Text>
          </TouchableOpacity>

          {showAdd && (
            <View style={styles.addForm}>
              <Text style={styles.label}>名前</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="例: manaba"
                placeholderTextColor="#b0b8c8"
              />
              <Text style={styles.label}>URL</Text>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://manaba.xxx-u.ac.jp"
                placeholderTextColor="#b0b8c8"
                autoCapitalize="none"
                keyboardType="url"
              />
              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={14} color="#e67e22" />
                <Text style={styles.disclaimerText}>
                  外部ブラウザで開きます。URLの安全性はご自身でご確認ください。
                </Text>
              </View>
              <Button title="追加" onPress={handleAdd} style={{ marginTop: 8 }} />
            </View>
          )}
        </Card>
      </Animated.View>

      {/* プリセット */}
      <Animated.View entering={FadeInDown.delay(120).duration(300).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={18} color="#f39c12" />
            <Text style={styles.sectionTitle}>よくあるポータル</Text>
          </View>
          <Text style={styles.presetDesc}>タップしてURLを編集してから追加してください</Text>
          <View style={styles.presetGrid}>
            {PRESET_PORTALS.map((p) => (
              <TouchableOpacity
                key={p.name}
                style={styles.presetChip}
                onPress={() => handlePreset(p)}
                activeOpacity={0.7}
              >
                <Text style={styles.presetName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#95a5a6',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#8e44ad12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    flex: 1,
  },
  linkName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  linkUrl: {
    fontSize: 11,
    color: '#95a5a6',
    marginTop: 2,
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
  },
  addForm: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#2c3e50',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#e67e22',
    flex: 1,
    lineHeight: 16,
  },
  presetDesc: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
