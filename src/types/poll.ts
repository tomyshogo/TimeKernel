import { Timestamp } from 'firebase/firestore';

export type VoteAnswer = 'ok' | 'maybe' | 'ng';
export type PollStatus = 'open' | 'closed';

export interface PollCandidate {
  date: string;
  startTime: string;
  endTime: string;
}

export interface VoteResponse {
  candidateIndex: number;
  answer: VoteAnswer;
}

export interface PollVote {
  uid: string;
  responses: VoteResponse[];
}

export interface Poll {
  id: string;
  title: string;
  createdBy: string;
  createdAt: Timestamp;
  deadline: Timestamp;
  status: PollStatus;
  confirmedSlot: PollCandidate | null;
  candidates: PollCandidate[];
  calendarId: string;
}

export type PollInput = Omit<Poll, 'id' | 'createdAt' | 'calendarId'>;

export const VOTE_LABELS: Record<VoteAnswer, string> = {
  ok: '○',
  maybe: '△',
  ng: '×',
};

export const VOTE_COLORS: Record<VoteAnswer, string> = {
  ok: '#2ecc71',
  maybe: '#f39c12',
  ng: '#e74c3c',
};
