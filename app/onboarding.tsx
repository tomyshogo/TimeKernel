import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { getOrCreateUser, updateUserEmail, updateUserName } from '../src/services/userService';
import { createCalendar } from '../src/services/calendarService';

export default function OnboardingScreen() {
  const { uid, setIsNewUser, setProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!uid || !name.trim()) return;
    setIsSubmitting(true);

    try {
      const { profile: userProfile } = await getOrCreateUser(uid, name.trim());

      // Firestoreに名前を確実に保存
      await updateUserName(uid, name.trim());

      if (email.trim()) {
        await updateUserEmail(uid, email.trim());
      }

      const calendarId = await createCalendar('マイカレンダー', uid);

      setProfile({
        ...userProfile,
        name: name.trim(),
        email: email.trim() || undefined,
        calendars: [calendarId],
      });
      setIsNewUser(false);
    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('エラー', '初期設定に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>準備しています...</Text>
        <Text style={styles.loadingSubtext}>マイカレンダーを作成中</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ようこそ</Text>
        <Text style={styles.subtitle}>はじめに、あなたの情報を教えてください</Text>

        <Text style={styles.label}>名前 *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="名前を入力"
          autoFocus
        />

        <Text style={styles.label}>メールアドレス（任意）</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>はじめる</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 24,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
});
