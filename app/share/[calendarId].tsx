import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { QRCodeView } from '../../src/components/share/QRCodeView';
import { getCalendar } from '../../src/services/calendarService';

export default function ShareScreen() {
  const { calendarId } = useLocalSearchParams<{ calendarId: string }>();
  const [calendarName, setCalendarName] = useState('');

  useEffect(() => {
    if (calendarId) {
      getCalendar(calendarId).then((cal) => {
        if (cal) setCalendarName(cal.name);
      });
    }
  }, [calendarId]);

  if (!calendarId) return null;

  return (
    <View style={styles.container}>
      <QRCodeView calendarId={calendarId} calendarName={calendarName} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
});
