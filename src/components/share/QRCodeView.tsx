import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateShareLink } from '../../services/shareService';
import { Button } from '../ui/Button';
import { copyShareLink } from '../../services/shareService';

interface Props {
  calendarId: string;
  calendarName: string;
}

export function QRCodeView({ calendarId, calendarName }: Props) {
  const link = generateShareLink(calendarId);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{calendarName}</Text>
      <Text style={styles.subtitle}>QRコードで共有</Text>
      <View style={styles.qrContainer}>
        <QRCode value={link} size={200} />
      </View>
      <Text style={styles.link}>{link}</Text>
      <Button
        title="リンクをコピー"
        onPress={() => copyShareLink(calendarId)}
        variant="secondary"
      />
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
  link: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 16,
    marginBottom: 16,
  },
});
