import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { EXAM_CATEGORY_LABELS, ExamCategory } from '../../src/types/exam';
import { EXAM_SCHEDULES } from '../../src/data/examData';
import { getDaysUntilExam, getDaysLabel } from '../../src/utils/examHelpers';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // exam_XXXX_date / exam_XXXX_deadline からIDを抽出
  const examId = id?.replace(/^exam_/, '').replace(/_(date|deadline|appstart)$/, '') ?? '';
  const exam = EXAM_SCHEDULES.find((e) => e.id === examId);

  if (!exam) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#d5d8dc" />
        <Text style={styles.errorText}>試験データが見つかりません</Text>
      </View>
    );
  }

  const daysUntil = getDaysUntilExam(exam.examDate);
  const daysLabel = getDaysLabel(daysUntil);
  const isUrgent = daysUntil <= 7 && daysUntil >= 0;
  const isOver = daysUntil < 0;

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), 'yyyy年M月d日(E)', { locale: ja });

  const countdownColor = isOver ? '#95a5a6' : isUrgent ? '#e74c3c' : '#3498db';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero section */}
      <Animated.View entering={FadeInDown.duration(400).springify()}>
        <Card>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {EXAM_CATEGORY_LABELS[exam.category as ExamCategory]}
            </Text>
          </View>
          <Text style={styles.title}>{exam.name}</Text>

          <View style={styles.countdownSection}>
            <View style={[styles.countdownCircle, { borderColor: countdownColor }]}>
              <Text style={[styles.countdownNumber, { color: countdownColor }]}>
                {isOver ? '—' : Math.abs(daysUntil)}
              </Text>
              <Text style={[styles.countdownUnit, { color: countdownColor }]}>
                {daysLabel}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Schedule */}
      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color="#3498db" />
            <Text style={styles.sectionTitle}>日程</Text>
          </View>
          <InfoRow icon="flag-outline" label="試験日" value={formatDate(exam.examDate)} highlight />
          <InfoRow icon="play-outline" label="申込開始" value={formatDate(exam.applicationStart)} />
          <InfoRow icon="alert-circle-outline" label="申込締切" value={formatDate(exam.applicationDeadline)} danger />
          {exam.resultDate && (
            <InfoRow icon="ribbon-outline" label="結果発表" value={formatDate(exam.resultDate)} />
          )}
        </Card>
      </Animated.View>

      {/* Details */}
      <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
        <Card>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#e67e22" />
            <Text style={styles.sectionTitle}>詳細</Text>
          </View>
          <InfoRow icon="card-outline" label="受験料" value={exam.fee} />
          {exam.notes && (
            <InfoRow icon="reader-outline" label="備考" value={exam.notes} />
          )}
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
  danger,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.labelSection}>
        <Ionicons
          name={icon as any}
          size={16}
          color={danger ? '#e74c3c' : highlight ? '#3498db' : '#95a5a6'}
        />
        <Text style={infoStyles.label}>{label}</Text>
      </View>
      <Text
        style={[
          infoStyles.value,
          highlight && infoStyles.highlightValue,
          danger && infoStyles.dangerValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  labelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  highlightValue: {
    color: '#3498db',
    fontWeight: '700',
  },
  dangerValue: {
    color: '#e74c3c',
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  categoryBadge: {
    backgroundColor: '#8e44ad15',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#8e44ad',
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  countdownSection: {
    alignItems: 'center',
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  countdownUnit: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
  },
});
