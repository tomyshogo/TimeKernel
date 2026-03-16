import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { useSubscribedExams } from '../../src/hooks/useExamSchedules';
import {
  ExamCategory,
  EXAM_CATEGORY_LABELS,
  EXAM_MASTERS,
} from '../../src/types/exam';
import {
  addExamSubscription,
  removeExamSubscription,
} from '../../src/services/examService';
import * as Haptics from 'expo-haptics';

const CATEGORIES: ExamCategory[] = ['language', 'it', 'business', 'law', 'civil_service'];

const CATEGORY_ICONS: Record<ExamCategory, string> = {
  language: 'language-outline',
  it: 'code-slash-outline',
  business: 'briefcase-outline',
  law: 'document-text-outline',
  civil_service: 'people-outline',
};

const CATEGORY_COLORS: Record<ExamCategory, string> = {
  language: '#3498db',
  it: '#9b59b6',
  business: '#e67e22',
  law: '#e74c3c',
  civil_service: '#1abc9c',
};

export default function ExamListScreen() {
  const uid = useAuthStore((s) => s.uid);
  const subs = useSubscribedExams();

  const handleToggle = async (examKey: string, category: ExamCategory, isSubscribed: boolean) => {
    if (!uid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSubscribed) {
      await removeExamSubscription(uid, examKey);
    } else {
      await addExamSubscription(uid, examKey, category);
    }
  };

  const subscribedCount = subs.exams.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.header}>資格試験カレンダー</Text>
        <Text style={styles.description}>
          興味のある資格をONにすると、試験日・申込締切がカレンダーに表示されます
        </Text>
        {subscribedCount > 0 && (
          <View style={styles.countBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
            <Text style={styles.countText}>{subscribedCount}件の資格を購読中</Text>
          </View>
        )}
      </View>

      {CATEGORIES.map((category, catIndex) => {
        const exams = EXAM_MASTERS.filter((e) => e.category === category);
        const color = CATEGORY_COLORS[category];
        const iconName = CATEGORY_ICONS[category];

        return (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(catIndex * 80).duration(400).springify()}
          >
            <Card>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: color + '15' }]}>
                  <Ionicons name={iconName as any} size={18} color={color} />
                </View>
                <Text style={styles.categoryTitle}>
                  {EXAM_CATEGORY_LABELS[category]}
                </Text>
                <Text style={styles.categoryCount}>{exams.length}件</Text>
              </View>
              {exams.map((exam, examIndex) => {
                const isSubscribed = subs.exams.includes(exam.key);
                const isLast = examIndex === exams.length - 1;
                return (
                  <View
                    key={exam.key}
                    style={[styles.examRow, isLast && styles.examRowLast]}
                  >
                    <View style={styles.examInfo}>
                      <Text style={styles.examName}>{exam.name}</Text>
                      {isSubscribed && (
                        <Ionicons name="notifications" size={12} color="#3498db" />
                      )}
                    </View>
                    <Switch
                      value={isSubscribed}
                      onValueChange={() =>
                        handleToggle(exam.key, exam.category, isSubscribed)
                      }
                      trackColor={{ false: '#e8ecf0', true: color + '50' }}
                      thumbColor={isSubscribed ? color : '#fff'}
                    />
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    paddingVertical: 12,
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    lineHeight: 20,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#2ecc7115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27ae60',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a2e',
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
  },
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  examRowLast: {
    borderBottomWidth: 0,
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  examName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2c3e50',
  },
});
