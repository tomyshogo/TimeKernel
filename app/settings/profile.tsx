import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { updateUserName } from '../../src/services/userService';
import { sendEmailLink } from '../../src/services/auth';
import { toast } from '../../src/components/ui/Toast';

export default function ProfileSettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState('');

  const handleSaveName = async () => {
    if (!uid || !name.trim()) return;
    try {
      await updateUserName(uid, name.trim());
      setProfile({ ...profile!, name: name.trim() });
      toast.success('名前を保存しました');
    } catch {
      toast.error('名前の保存に失敗しました');
    }
  };

  const handleSendEmailLink = async () => {
    if (!email.trim()) return;
    try {
      await sendEmailLink(email.trim());
      toast.success('認証メールを送信しました');
    } catch {
      toast.error('メール送信に失敗しました');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="名前を入力"
        />
        <Button title="保存" onPress={handleSaveName} style={{ marginTop: 12 }} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>メールリンク認証</Text>
        <Text style={styles.description}>
          メールアドレスを登録すると、端末変更時にデータを引き継げます
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          title="認証メールを送信"
          onPress={handleSendEmailLink}
          variant="secondary"
          style={{ marginTop: 12 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 12 },
  description: { fontSize: 13, color: '#7f8c8d', marginBottom: 12 },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
