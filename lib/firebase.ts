import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: any;
let db: any;
let auth: any;

/**
 * In-memory cache for course progress to avoid redundant Firestore requests.
 * Scoped by user ID to prevent data leakage between sessions.
 * Format: { userId: { courseId: [completedLessonId1, completedLessonId2, ...] } }
 */
const userCourseProgressCache: Record<string, Record<string, number[]>> = {};

/**
 * Helper to get or initialize the cache for a specific user and course.
 */
function getCache(userId: string, courseId: string): number[] | undefined {
  return userCourseProgressCache[userId]?.[courseId];
}

/**
 * Helper to set or update the cache for a specific user and course.
 */
function setCache(userId: string, courseId: string, completedIds: number[]) {
  if (!userCourseProgressCache[userId]) {
    userCourseProgressCache[userId] = {};
  }
  userCourseProgressCache[userId][courseId] = completedIds;
}

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
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };

  // Log detailed error only in development or to secure server-side logs
  if (process.env.NODE_ENV === 'development') {
    console.error('Firestore Error [Internal]:', JSON.stringify(errInfo));
  }

  // Security: Don't leak internal paths or user PII (email, etc.) to the client
  // Fail securely with a generic message and operation context
  throw new Error(`Database operation failed (${operationType}). Please try again later.`);
}

export async function saveProgress(courseId: string, lessonId: number) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `userProgress/${userId}/courses/${courseId}/lessons/${lessonId.toString()}`;
  const progressRef = doc(db, path);
  try {
    await setDoc(progressRef, { completed: true, timestamp: new Date() });

    // Update user-scoped cache
    const currentCache = getCache(userId, courseId);
    if (currentCache) {
      if (!currentCache.includes(lessonId)) {
        currentCache.push(lessonId);
      }
    } else {
      setCache(userId, courseId, [lessonId]);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProgress(courseId: string, lessonId: number) {
  const auth = getAuthService();
  if (!auth.currentUser) return false;
  const userId = auth.currentUser.uid;

  // Check user-scoped cache first
  if (getCache(userId, courseId)?.includes(lessonId)) {
    return true;
  }

  const db = getDbService();
  const path = `userProgress/${userId}/courses/${courseId}/lessons/${lessonId.toString()}`;
  const progressRef = doc(db, path);
  try {
    const docSnap = await getDoc(progressRef);
    const exists = docSnap.exists();

    // If it exists, update user-scoped cache
    if (exists) {
      const currentCache = getCache(userId, courseId);
      if (currentCache) {
        if (!currentCache.includes(lessonId)) {
          currentCache.push(lessonId);
        }
      } else {
        setCache(userId, courseId, [lessonId]);
      }
    }

    return exists;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

/**
 * Fetches all completed lesson IDs for a specific course in a single query.
 * Optimized with user-scoped in-memory caching to avoid redundant Firestore requests.
 */
export async function getCompletedLessonsForCourse(courseId: string): Promise<number[]> {
  const auth = getAuthService();
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;

  // Return from user-scoped cache if available
  const cached = getCache(userId, courseId);
  if (cached) {
    return cached;
  }

  const db = getDbService();
  const path = `userProgress/${userId}/courses/${courseId}/lessons`;
  try {
    const lessonsRef = collection(db, path);
    const snapshot = await getDocs(lessonsRef);
    const completedIds = snapshot.docs.map(doc => parseInt(doc.id));

    // Populate user-scoped cache
    setCache(userId, courseId, completedIds);

    return completedIds;
  } catch (error) {
    console.error('Error fetching completed lessons for course', courseId, error);
    return [];
  }
}

/**
 * Calculates total completed lessons across all courses.
 * Optimized to use the caching layer.
 */
export async function getAllCompletedLessons(coursesList: { id: string }[]) {
  const results = await Promise.all(
    coursesList.map((course) => getCompletedLessonsForCourse(course.id))
  );

  return results.reduce((acc, current) => acc + current.length, 0);
}
