import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../../src/components/ui/Card';
import { LINE_MASTERS } from '../../src/types/train';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = 'train_subscribed_lines';

export default function TrainSettingsScreen() {
  const [subscribedLines, setSubscribedLines] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(new Set());

  const toggleOperator = (op: string) => {
    setExpandedOperators((prev) => {
      const next = new Set(prev);
      if (next.has(op)) { next.delete(op); } else { next.add(op); }
      return next;
    });
  };

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setSubscribedLines(JSON.parse(val));
    });
  }, []);

  const save = async (lines: string[]) => {
    setSubscribedLines(lines);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  };

  const toggle = (lineId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (subscribedLines.includes(lineId)) {
      save(subscribedLines.filter((id) => id !== lineId));
    } else {
      save([...subscribedLines, lineId]);
    }
  };

  // 会社ごとにグループ化（登録済みの会社を上に）
  const operators = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? LINE_MASTERS.filter((l) => l.name.toLowerCase().includes(q) || l.operator.toLowerCase().includes(q))
      : LINE_MASTERS;

    const map = new Map<string, typeof filtered>();
    for (const line of filtered) {
      const list = map.get(line.operator) || [];
      list.push(line);
      map.set(line.operator, list);
    }
    const entries = Array.from(map.entries());

    // 登録済み路線がある会社を上に
    return entries.sort((a, b) => {
      const aHas = a[1].some((l) => subscribedLines.includes(l.id)) ? 0 : 1;
      const bHas = b[1].some((l) => subscribedLines.includes(l.id)) ? 0 : 1;
      return aHas - bHas;
    });
  }, [search, subscribedLines]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.desc}>
          よく使う路線を登録すると、遅延発生時にカレンダー上部に表示されます
        </Text>
        {subscribedLines.length > 0 && (
          <View style={styles.countBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
            <Text style={styles.countText}>{subscribedLines.length}路線を登録中</Text>
          </View>
        )}
      </Card>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#95a5a6" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="路線名・会社名で検索..."
          placeholderTextColor="#b0b8c8"
          clearButtonMode="while-editing"
        />
      </View>

      {operators.map(([operator, lines], opIndex) => {
        const isExpanded = expandedOperators.has(operator);
        const subscribedInOp = lines.filter((l) => subscribedLines.includes(l.id)).length;
        return (
          <View key={operator}>
          <Card>
            <TouchableOpacity style={styles.operatorHeader} onPress={() => toggleOperator(operator)} activeOpacity={0.7}>
              <Text style={styles.operatorTitle}>{operator}</Text>
              <View style={styles.operatorRight}>
                {subscribedInOp > 0 && (
                  <Text style={styles.subscribedBadge}>{subscribedInOp}件ON</Text>
                )}
                <Text style={styles.operatorCount}>{lines.length}路線</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#b0b8c8" />
              </View>
            </TouchableOpacity>
            {isExpanded && lines.map((line, i) => {
              const isSubscribed = subscribedLines.includes(line.id);
              const isLast = i === lines.length - 1;
              return (
                <TouchableOpacity
                  key={line.id}
                  style={[styles.lineItem, !isLast && styles.lineItemBorder]}
                  onPress={() => toggle(line.id)}
                >
                  <View style={[styles.lineColor, { backgroundColor: line.color }]} />
                  <Text style={styles.lineName}>{line.name}</Text>
                  <Ionicons
                    name={isSubscribed ? 'checkmark-circle' : 'add-circle-outline'}
                    size={22}
                    color={isSubscribed ? '#2ecc71' : '#b0b8c8'}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  desc: { fontSize: 13, color: '#7f8c8d', lineHeight: 18 },
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
  countText: { fontSize: 13, fontWeight: '600', color: '#27ae60' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
    paddingVertical: 0,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  operatorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  operatorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  operatorCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#95a5a6',
  },
  subscribedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2ecc71',
  },
  lineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  lineItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f2f5',
  },
  lineColor: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  lineName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
});
