import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebase';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ExamSchedule, EXAM_CATEGORY_LABELS } from '../../src/types/exam';
import { getDaysUntilExam, getDaysLabel } from '../../src/utils/examHelpers';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<ExamSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const snap = await getDoc(doc(db, 'examSchedules', id));
      if (snap.exists()) {
        setExam({ id: snap.id, ...snap.data() } as ExamSchedule);
      }
      setIsLoading(false);
    })();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>試験データが見つかりません</Text>
      </View>
    );
  }

  const daysUntil = getDaysUntilExam(exam.examDate);
  const daysLabel = getDaysLabel(daysUntil);

  const formatTs = (ts: { toDate: () => Date }) =>
    format(ts.toDate(), 'yyyy年M月d日(E)', { locale: ja });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.category}>
          {EXAM_CATEGORY_LABELS[exam.category]}
        </Text>
        <Text style={styles.title}>{exam.name}</Text>

        <View style={styles.countdownBadge}>
          <Text style={[
            styles.countdownText,
            daysUntil <= 7 && daysUntil >= 0 && styles.countdownUrgent,
          ]}>
            {daysLabel}
          </Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>日程</Text>
        <InfoRow label="試験日" value={formatTs(exam.examDate)} />
        <InfoRow label="申込開始" value={formatTs(exam.applicationStart)} />
        <InfoRow label="申込締切" value={formatTs(exam.applicationDeadline)} />
        {exam.resultDate && (
          <InfoRow label="結果発表" value={formatTs(exam.resultDate)} />
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>詳細</Text>
        <InfoRow label="受験料" value={exam.fee} />
        {exam.notes && <InfoRow label="備考" value={exam.notes} />}
      </Card>

      {exam.officialUrl && (
        <Card>
          <Button
            title="公式サイトを開く"
            onPress={() => Linking.openURL(exam.officialUrl)}
          />
        </Card>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  category: {
    fontSize: 13,
    color: '#8e44ad',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  countdownBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  countdownUrgent: {
    color: '#e74c3c',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
});
