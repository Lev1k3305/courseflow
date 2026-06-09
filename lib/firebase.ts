import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: any;
let db: any;
let auth: any;

interface CourseCacheEntry {
  lessonIds: number[];
  isComplete: boolean;
}

/**
 * In-memory cache for course progress to avoid redundant Firestore requests.
 * Scoped by user ID to prevent data leakage between sessions.
 * Format: { userId: { courseId: { lessonIds: number[], isComplete: boolean } } }
 */
const userCourseProgressCache: Record<string, Record<string, CourseCacheEntry>> = {};

/**
 * Deduplication registry for in-flight Firestore requests.
 * Prevents multiple concurrent requests for the same course data.
 * Format: { userId: { courseId: Promise<number[]> } }
 */
const inFlightRequests: Record<string, Record<string, Promise<number[]> | undefined>> = {};

/**
 * Helper to get or initialize the cache for a specific user and course.
 */
function getCache(userId: string, courseId: string): CourseCacheEntry | undefined {
  return userCourseProgressCache[userId]?.[courseId];
}

/**
 * Helper to set or update the cache for a specific user and course.
 */
function setCache(userId: string, courseId: string, lessonIds: number[], isComplete: boolean = false) {
  if (!userCourseProgressCache[userId]) {
    userCourseProgressCache[userId] = {};
  }
  userCourseProgressCache[userId][courseId] = { lessonIds, isComplete };
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

/**
 * Saves user progress for a lesson.
 * Optimized with optimistic cache updates to improve perceived responsiveness.
 */
export async function saveProgress(courseId: string, lessonId: number) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `userProgress/${userId}/courses/${courseId}/lessons/${lessonId.toString()}`;
  const progressRef = doc(db, path);

  // 1. Optimistic update: Update user-scoped cache before network request
  const entry = getCache(userId, courseId);
  if (entry) {
    if (!entry.lessonIds.includes(lessonId)) {
      entry.lessonIds.push(lessonId);
    }
  } else {
    setCache(userId, courseId, [lessonId], false);
  }

  try {
    // 2. Perform background write
    await setDoc(progressRef, { completed: true, timestamp: new Date() });
  } catch (error) {
    // 3. Rollback cache on error
    const entry = getCache(userId, courseId);
    if (entry) {
      entry.lessonIds = entry.lessonIds.filter(id => id !== lessonId);
    }

    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProgress(courseId: string, lessonId: number) {
  const auth = getAuthService();
  if (!auth.currentUser) return false;
  const userId = auth.currentUser.uid;

  // Check user-scoped cache first
  if (getCache(userId, courseId)?.lessonIds.includes(lessonId)) {
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
      const entry = getCache(userId, courseId);
      if (entry) {
        if (!entry.lessonIds.includes(lessonId)) {
          entry.lessonIds.push(lessonId);
        }
      } else {
        setCache(userId, courseId, [lessonId], false);
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
 * Optimized with user-scoped in-memory caching and request deduplication
 * to avoid redundant Firestore requests during concurrent component renders.
 */
export async function getCompletedLessonsForCourse(courseId: string): Promise<number[]> {
  const auth = getAuthService();
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;

  // 1. Return from user-scoped cache if available and complete
  const entry = getCache(userId, courseId);
  if (entry?.isComplete) {
    return entry.lessonIds;
  }

  // 2. Check for an in-flight request for the same resource
  if (inFlightRequests[userId]?.[courseId]) {
    return inFlightRequests[userId][courseId];
  }

  // 3. Initiate new request and register it
  const requestPromise = (async () => {
    const db = getDbService();
    const path = `userProgress/${userId}/courses/${courseId}/lessons`;
    try {
      const lessonsRef = collection(db, path);
      const snapshot = await getDocs(lessonsRef);
      const completedIds = snapshot.docs.map(doc => parseInt(doc.id));

      // Populate user-scoped cache
      setCache(userId, courseId, completedIds, true);

      return completedIds;
    } catch (error) {
      console.error('Error fetching completed lessons for course', courseId, error);
      return [];
    } finally {
      // Clean up in-flight registry
      if (inFlightRequests[userId]) {
        delete inFlightRequests[userId][courseId];
      }
    }
  })();

  if (!inFlightRequests[userId]) {
    inFlightRequests[userId] = {};
  }
  inFlightRequests[userId][courseId] = requestPromise;

  return requestPromise;
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
