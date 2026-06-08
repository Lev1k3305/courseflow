import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: any;
let db: any;
let auth: any;

function initFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
    auth = getAuth(app);
  }
}

export function getAuthService() {
  initFirebase();
  return auth;
}

export function getDbService() {
  initFirebase();
  return db;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getAuthService();
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function saveProgress(courseId: string, lessonId: number) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return;
  const path = `userProgress/${auth.currentUser.uid}/courses/${courseId}/lessons/${lessonId.toString()}`;
  const progressRef = doc(db, path);
  try {
    await setDoc(progressRef, { completed: true, timestamp: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProgress(courseId: string, lessonId: number) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return false;
  const path = `userProgress/${auth.currentUser.uid}/courses/${courseId}/lessons/${lessonId.toString()}`;
  const progressRef = doc(db, path);
  try {
    const docSnap = await getDoc(progressRef);
    return docSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

/**
 * Fetches all completed lesson IDs for a specific course in a single query.
 * Optimized to avoid N+1 queries.
 */
export async function getCompletedLessonsForCourse(courseId: string): Promise<number[]> {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return [];
  const path = `userProgress/${auth.currentUser.uid}/courses/${courseId}/lessons`;
  try {
    const lessonsRef = collection(db, path);
    const snapshot = await getDocs(lessonsRef);
    return snapshot.docs.map(doc => parseInt(doc.id));
  } catch (error) {
    console.error('Error fetching completed lessons for course', courseId, error);
    return [];
  }
}

export async function getAllCompletedLessons(coursesList: { id: string }[]) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return 0;

  const results = await Promise.all(
    coursesList.map(async (course) => {
      const path = `userProgress/${auth.currentUser!.uid}/courses/${course.id}/lessons`;
      try {
        const lessonsRef = collection(db, path);
        const snapshot = await getDocs(lessonsRef);
        return snapshot.size;
      } catch (error) {
        console.error('Error fetching progress for course', course.id, error);
        return 0;
      }
    })
  );

  return results.reduce((acc, current) => acc + current, 0);
}
