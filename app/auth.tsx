import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { signInAnonymous, sendEmailLink } from '../src/services/auth';

type AuthMode = 'welcome' | 'email' | 'emailSent';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await sendEmailLink(email.trim());
      setMode('emailSent');
    } catch {
      Alert.alert('エラー', 'メールの送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAnonymous();
    } catch {
      Alert.alert('エラー', 'ログインに失敗しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  };

  if (mode === 'emailSent') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>メールを確認</Text>
          <Text style={styles.description}>
            {email} にログインリンクを送信しました。{'\n'}
            メール内のリンクをタップしてログインしてください。
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('email')}
          >
            <Text style={styles.secondaryButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (mode === 'email') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>メールでログイン</Text>
          <Text style={styles.description}>
            パスワード不要！メールアドレスに届くリンクでログインできます。
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryButton, (!email.trim() || isSubmitting) && styles.buttonDisabled]}
            onPress={handleEmailSignIn}
            disabled={!email.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>ログインリンクを送信</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setMode('welcome')}
          >
            <Text style={styles.secondaryButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>TimeKernel</Text>
        <Text style={styles.tagline}>大学生のためのスケジュール管理</Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={() => setMode('email')}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>メールで登録 / ログイン</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guestButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleGuestSignIn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#3498db" />
            ) : (
              <Text style={styles.guestButtonText}>ゲストとして試す</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.guestNote}>
          ゲストモードではデータがこの端末にのみ保存されます
        </Text>
      </View>
    </View>
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
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  guestButton: {
    borderWidth: 1.5,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#3498db',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  guestNote: {
    fontSize: 13,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 16,
  },
});
