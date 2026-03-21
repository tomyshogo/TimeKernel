import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { generateShareLink, copyShareLink } from '../../services/shareService';
import { Button } from '../ui/Button';
import * as Haptics from 'expo-haptics';

interface Props {
  calendarId: string;
  calendarName: string;
}

export function QRCodeView({ calendarId, calendarName }: Props) {
  const link = generateShareLink(calendarId);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyShareLink(calendarId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{calendarName}</Text>
      <Text style={styles.subtitle}>QRコードで共有</Text>
      <View style={styles.qrContainer}>
        <QRCode value={link} size={200} />
      </View>
      <View style={{ marginTop: 16 }} />
      {copied ? (
        <View style={styles.copiedBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
          <Text style={styles.copiedText}>コピーしました</Text>
        </View>
      ) : (
        <Button
          title="リンクをコピー"
          onPress={handleCopy}
          variant="secondary"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eafaf1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  copiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
  },
});
