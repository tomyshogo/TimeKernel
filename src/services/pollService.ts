import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Poll, PollInput, PollVote, PollCandidate } from '../types';

function pollsCol(calendarId: string) {
  return collection(db, 'calendars', calendarId, 'polls');
}

function votesCol(calendarId: string, pollId: string) {
  return collection(db, 'calendars', calendarId, 'polls', pollId, 'votes');
}

export async function createPoll(
  calendarId: string,
  input: PollInput
): Promise<string> {
  const docRef = await addDoc(pollsCol(calendarId), {
    ...input,
    createdAt: Timestamp.now(),
    calendarId,
  });
  return docRef.id;
}

export async function getPoll(
  calendarId: string,
  pollId: string
): Promise<Poll | null> {
  const snap = await getDoc(doc(pollsCol(calendarId), pollId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Poll;
}

export function subscribeToPolls(
  calendarId: string,
  callback: (polls: Poll[]) => void
): Unsubscribe {
  return onSnapshot(
    query(pollsCol(calendarId), orderBy('createdAt', 'desc')),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Poll)));
    },
    (error) => {
      console.warn('[subscribeToPolls]', error.code, error.message);
      callback([]);
    }
  );
}

export async function submitVote(
  calendarId: string,
  pollId: string,
  vote: PollVote
): Promise<void> {
  await setDoc(doc(votesCol(calendarId, pollId), vote.uid), vote);
}

export async function getVotes(
  calendarId: string,
  pollId: string
): Promise<PollVote[]> {
  const snap = await getDocs(votesCol(calendarId, pollId));
  return snap.docs.map((d) => d.data() as PollVote);
}

export function subscribeToVotes(
  calendarId: string,
  pollId: string,
  callback: (votes: PollVote[]) => void
): Unsubscribe {
  return onSnapshot(votesCol(calendarId, pollId), (snap) => {
    callback(snap.docs.map((d) => d.data() as PollVote));
  }, (error) => {
    console.warn('[subscribeToVotes]', error.code, error.message);
    callback([]);
  });
}

export async function confirmPoll(
  calendarId: string,
  pollId: string,
  slot: PollCandidate
): Promise<void> {
  await updateDoc(doc(pollsCol(calendarId), pollId), {
    status: 'closed',
    confirmedSlot: slot,
  });
}

export async function closePoll(
  calendarId: string,
  pollId: string
): Promise<void> {
  await updateDoc(doc(pollsCol(calendarId), pollId), {
    status: 'closed',
  });
}
