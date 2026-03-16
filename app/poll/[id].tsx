import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import {
  getPoll,
  subscribeToVotes,
  submitVote,
  confirmPoll,
} from '../../src/services/pollService';
import { addEvent } from '../../src/services/eventService';
import {
  Poll,
  PollVote,
  VoteAnswer,
  VoteResponse,
  VOTE_LABELS,
  VOTE_COLORS,
} from '../../src/types';

export default function PollDetailScreen() {
  const router = useRouter();
  const { id, calendarId } = useLocalSearchParams<{ id: string; calendarId: string }>();
  const uid = useAuthStore((s) => s.uid);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [myResponses, setMyResponses] = useState<VoteResponse[]>([]);

  useEffect(() => {
    if (!id || !calendarId) return;
    getPoll(calendarId, id).then((p) => {
      setPoll(p);
      if (p) {
        setMyResponses(p.candidates.map((_, i) => ({ candidateIndex: i, answer: 'ok' as VoteAnswer })));
      }
      setLoading(false);
    });
  }, [id, calendarId]);

  useEffect(() => {
    if (!id || !calendarId) return;
    return subscribeToVotes(calendarId, id, setVotes);
  }, [id, calendarId]);

  // 既存の自分の投票を反映
  useEffect(() => {
    if (!uid) return;
    const myVote = votes.find((v) => v.uid === uid);
    if (myVote) {
      setMyResponses(myVote.responses);
    }
  }, [votes, uid]);

  const handleVoteChange = (candidateIndex: number, answer: VoteAnswer) => {
    setMyResponses((prev) =>
      prev.map((r) => (r.candidateIndex === candidateIndex ? { ...r, answer } : r))
    );
  };

  const handleSubmitVote = async () => {
    if (!uid || !calendarId || !id) return;
    await submitVote(calendarId, id, { uid, responses: myResponses });
    Alert.alert('投票しました');
  };

  const handleConfirm = async (candidateIndex: number) => {
    if (!uid || !calendarId || !id || !poll) return;
    const slot = poll.candidates[candidateIndex];
    await confirmPoll(calendarId, id, slot);
    // カレンダーに予定を自動追加
    await addEvent(calendarId, {
      title: poll.title,
      type: 'event',
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      color: '#9b59b6',
      createdBy: uid,
    });
    Alert.alert('確定しました', 'カレンダーに予定を追加しました');
    router.back();
  };

  // 各候補の集計
  const tally = useMemo(() => {
    if (!poll) return [];
    return poll.candidates.map((_, ci) => {
      const ok = votes.filter((v) => v.responses.find((r) => r.candidateIndex === ci && r.answer === 'ok')).length;
      const maybe = votes.filter((v) => v.responses.find((r) => r.candidateIndex === ci && r.answer === 'maybe')).length;
      const ng = votes.filter((v) => v.responses.find((r) => r.candidateIndex === ci && r.answer === 'ng')).length;
      return { ok, maybe, ng, score: ok * 2 + maybe };
    });
  }, [poll, votes]);

  const bestIndex = useMemo(() => {
    if (tally.length === 0) return -1;
    return tally.reduce((best, t, i) => (t.score > tally[best].score ? i : best), 0);
  }, [tally]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.center}>
        <Text>投票が見つかりません</Text>
      </View>
    );
  }

  const isCreator = uid === poll.createdBy;
  const isClosed = poll.status === 'closed';
  const answers: VoteAnswer[] = ['ok', 'maybe', 'ng'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>{poll.title}</Text>
        <Text style={styles.meta}>
          {isClosed ? '確定済み' : `回答: ${votes.length}人`}
        </Text>
      </Card>

      {/* 候補一覧 + 投票 */}
      {poll.candidates.map((candidate, ci) => {
        const myAnswer = myResponses.find((r) => r.candidateIndex === ci)?.answer || 'ok';
        const t = tally[ci] || { ok: 0, maybe: 0, ng: 0 };
        const isBest = ci === bestIndex && !isClosed;
        const isConfirmed = isClosed && poll.confirmedSlot?.date === candidate.date &&
          poll.confirmedSlot?.startTime === candidate.startTime;

        return (
          <Card key={ci}>
            <View style={[styles.candidateHeader, isBest && styles.bestCandidate, isConfirmed && styles.confirmedCandidate]}>
              <Text style={styles.candidateDate}>
                {candidate.date} {candidate.startTime}〜{candidate.endTime}
              </Text>
              {isBest && <Text style={styles.bestLabel}>最適</Text>}
              {isConfirmed && <Text style={styles.confirmedLabel}>確定</Text>}
            </View>

            {/* 集計 */}
            <View style={styles.tallyRow}>
              <Text style={[styles.tallyItem, { color: VOTE_COLORS.ok }]}>○ {t.ok}</Text>
              <Text style={[styles.tallyItem, { color: VOTE_COLORS.maybe }]}>△ {t.maybe}</Text>
              <Text style={[styles.tallyItem, { color: VOTE_COLORS.ng }]}>× {t.ng}</Text>
            </View>

            {/* 投票ボタン */}
            {!isClosed && (
              <View style={styles.voteRow}>
                {answers.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.voteButton,
                      { borderColor: VOTE_COLORS[a] },
                      myAnswer === a && { backgroundColor: VOTE_COLORS[a] },
                    ]}
                    onPress={() => handleVoteChange(ci, a)}
                  >
                    <Text
                      style={[
                        styles.voteText,
                        { color: myAnswer === a ? '#fff' : VOTE_COLORS[a] },
                      ]}
                    >
                      {VOTE_LABELS[a]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 確定ボタン（作成者のみ） */}
            {isCreator && !isClosed && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleConfirm(ci)}
              >
                <Text style={styles.confirmText}>この日で確定</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      })}

      {!isClosed && (
        <View style={styles.submitArea}>
          <Button title="投票する" onPress={handleSubmitVote} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingVertical: 8, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#2c3e50' },
  meta: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestCandidate: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 8,
    padding: 4,
    margin: -4,
  },
  confirmedCandidate: {
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
    borderRadius: 8,
    padding: 4,
    margin: -4,
  },
  candidateDate: { fontSize: 15, fontWeight: '600', color: '#2c3e50' },
  bestLabel: { fontSize: 12, fontWeight: '700', color: '#27ae60' },
  confirmedLabel: { fontSize: 12, fontWeight: '700', color: '#9b59b6' },
  tallyRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  tallyItem: { fontSize: 14, fontWeight: '700' },
  voteRow: { flexDirection: 'row', gap: 8 },
  voteButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  voteText: { fontSize: 18, fontWeight: '700' },
  confirmButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#9b59b6',
  },
  confirmText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  submitArea: { paddingHorizontal: 16, marginTop: 8 },
});
