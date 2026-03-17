import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskInput, TaskStatus } from '../types';

function tasksCol(uid: string) {
  return collection(db, 'tasks', uid, 'items');
}

export async function addTask(uid: string, input: TaskInput): Promise<string> {
  const docRef = await addDoc(tasksCol(uid), {
    ...input,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getAllTasks(uid: string): Promise<Task[]> {
  const snap = await getDocs(
    query(tasksCol(uid), orderBy('deadline', 'asc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function getTasksBySlot(
  uid: string,
  slotKey: string,
  timetableId: string
): Promise<Task[]> {
  const snap = await getDocs(
    query(
      tasksCol(uid),
      where('slotKey', '==', slotKey),
      where('timetableId', '==', timetableId),
      orderBy('deadline', 'asc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
}

export async function updateTaskStatus(
  uid: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  await updateDoc(doc(tasksCol(uid), taskId), { status });
}

export async function updateTask(
  uid: string,
  taskId: string,
  data: Partial<TaskInput>
): Promise<void> {
  await updateDoc(doc(tasksCol(uid), taskId), data);
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(doc(tasksCol(uid), taskId));
}

export function subscribeToTasks(
  uid: string,
  callback: (tasks: Task[]) => void
): Unsubscribe {
  return onSnapshot(
    query(tasksCol(uid), orderBy('deadline', 'asc')),
    (snapshot) => {
      const tasks = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Task)
      );
      callback(tasks);
    },
    (error) => {
      console.warn('[subscribeToTasks]', error.code, error.message);
      callback([]);
    }
  );
}
