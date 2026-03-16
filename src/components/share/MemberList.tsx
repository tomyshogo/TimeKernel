import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { getUserProfile } from '../../services/userService';

interface Props {
  memberUids: string[];
  creatorUid: string;
  currentUid: string;
  onRemoveMember?: (uid: string) => void;
}

export function MemberList({
  memberUids,
  creatorUid,
  currentUid,
  onRemoveMember,
}: Props) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchNames = async () => {
      const nameMap: Record<string, string> = {};
      for (const uid of memberUids) {
        try {
          const profile = await getUserProfile(uid);
          nameMap[uid] = profile?.name || '名前なし';
        } catch {
          nameMap[uid] = '取得失敗';
        }
      }
      if (!cancelled) setNames(nameMap);
    };
    fetchNames();
    return () => { cancelled = true; };
  }, [memberUids]);

  const isCreator = currentUid === creatorUid;

  return (
    <FlatList
      data={memberUids}
      keyExtractor={(uid) => uid}
      renderItem={({ item: uid }) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{names[uid] || '...'}</Text>
            {uid === creatorUid && (
              <Text style={styles.badge}>管理者</Text>
            )}
          </View>
          {isCreator && uid !== creatorUid && onRemoveMember && (
            <TouchableOpacity onPress={() => onRemoveMember(uid)}>
              <Text style={styles.remove}>削除</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    color: '#2c3e50',
  },
  badge: {
    fontSize: 11,
    color: '#3498db',
    backgroundColor: '#ebf5fb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  remove: {
    fontSize: 13,
    color: '#e74c3c',
  },
});
