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
 * In-memory cache for user notes to avoid redundant Firestore requests.
 * Scoped by user ID to prevent data leakage.
 * Format: { userId: Note[] }
 */
interface Note {
  id: string;
  courseId: string;
  lessonId: number;
  content: string;
  updatedAt: any;
}

interface UserNotesCache {
  notes: Note[];
  isComplete: boolean;
}

const userNotesCache: Record<string, UserNotesCache | undefined> = {};

/**
 * Deduplication registry for in-flight Firestore requests.
 * Prevents multiple concurrent requests for the same course data.
 * Format: { userId: { courseId: Promise<number[]> } }
 */
const inFlightRequests: Record<string, Record<string, Promise<number[]> | undefined>> = {};

/**
 * Deduplication registry for in-flight notes requests.
 */
const inFlightNotesRequests: Record<string, Promise<Note[]> | undefined> = {};

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

export interface DetailedProgress {
  courseId: string;
  lessonId: number;
  timestamp: Date;
}

/**
 * Fetches all completed lessons with their timestamps for detailed activity tracking.
 */
export async function getDetailedProgress(coursesList: { id: string }[]): Promise<DetailedProgress[]> {
  const auth = getAuthService();
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;
  const db = getDbService();

  try {
    const allDetailedProgress: DetailedProgress[] = [];

    const fetchPromises = coursesList.map(async (course) => {
      const courseId = course.id;
      const lessonsRef = collection(db, `userProgress/${userId}/courses/${courseId}/lessons`);
      const lessonsSnap = await getDocs(lessonsRef);

      return lessonsSnap.docs.map(lessonDoc => {
        const data = lessonDoc.data();
        return {
          courseId,
          lessonId: parseInt(lessonDoc.id),
          timestamp: data.timestamp?.toDate() || new Date()
        };
      });
    });

    const results = await Promise.all(fetchPromises);
    results.forEach(res => allDetailedProgress.push(...res));

    return allDetailedProgress.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error fetching detailed progress', error);
    return [];
  }
}

/**
 * Calculates the current daily learning streak.
 * Accepts optional pre-fetched progress data to avoid redundant Firestore reads.
 */
export async function getUserStreak(coursesList: { id: string }[], progressData?: DetailedProgress[]): Promise<number> {
  const progress = progressData || await getDetailedProgress(coursesList);
  if (progress.length === 0) return 0;

  // Extract unique dates of activity normalized to start of day
  const activeDates = new Set(
    progress.map(p => {
      const d = p.timestamp;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
  );

  const sortedDates = Array.from(activeDates).sort((a, b) => b - a);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Last activity must be today or yesterday to continue streak
  const lastActivity = sortedDates[0];
  const msInDay = 86400000;

  // Use a small buffer to handle potential DST offsets if comparing raw timestamps,
  // but since we normalized to local midnight, the difference should be 23, 24, or 25 hours.
  // A safer check is to see if the date of sortedDates[0] is >= today - 1 day.
  const oneDayAgo = todayStart - msInDay;

  if (lastActivity < oneDayAgo) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i-1]);
    const currDate = new Date(sortedDates[i]);

    // Calculate expected previous day
    const expectedPrev = new Date(prevDate);
    expectedPrev.setDate(expectedPrev.getDate() - 1);

    if (currDate.getTime() === expectedPrev.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Saves a note for a specific lesson.
 * Optimized with optimistic cache updates.
 */
export async function saveNote(courseId: string, lessonId: number, noteText: string) {
  const db = getDbService();
  const auth = getAuthService();
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const noteId = `${courseId}_${lessonId}`;
  const path = `userNotes/${userId}/notes/${noteId}`;
  const noteRef = doc(db, path);

  // 1. Optimistically update user-scoped cache
  const cache = userNotesCache[userId];
  let previousNote: Note | undefined;

  if (cache) {
    const existingIdx = cache.notes.findIndex(n => n.id === noteId);
    if (existingIdx !== -1) {
      previousNote = { ...cache.notes[existingIdx] };
      cache.notes[existingIdx] = {
        ...cache.notes[existingIdx],
        content: noteText,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) } // Mock Firestore timestamp
      };
    } else {
      cache.notes.push({
        id: noteId,
        courseId,
        lessonId,
        content: noteText,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      });
    }
  }

  try {
    // 2. Perform background write
    await setDoc(noteRef, {
      courseId,
      lessonId,
      content: noteText,
      updatedAt: new Date()
    });
  } catch (error) {
    // 3. Rollback cache on error
    const cache = userNotesCache[userId];
    if (cache) {
      if (previousNote) {
        const idx = cache.notes.findIndex(n => n.id === noteId);
        if (idx !== -1) cache.notes[idx] = previousNote;
      } else {
        cache.notes = cache.notes.filter(n => n.id !== noteId);
      }
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieves a note for a specific lesson.
 * Optimized to check user-scoped cache first.
 */
export async function getNote(courseId: string, lessonId: number) {
  const auth = getAuthService();
  if (!auth.currentUser) return "";
  const userId = auth.currentUser.uid;
  const noteId = `${courseId}_${lessonId}`;

  // 1. Check user-scoped cache first
  const cachedNote = userNotesCache[userId]?.notes.find(n => n.id === noteId);
  if (cachedNote) {
    return cachedNote.content;
  }

  const db = getDbService();
  const path = `userNotes/${userId}/notes/${noteId}`;
  const noteRef = doc(db, path);

  try {
    const docSnap = await getDoc(noteRef);
    if (docSnap.exists()) {
      const noteData = docSnap.data();
      const content = noteData.content || "";

      // Update cache
      if (!userNotesCache[userId]) {
        userNotesCache[userId] = { notes: [], isComplete: false };
      }

      const cache = userNotesCache[userId]!;
      if (!cache.notes.find(n => n.id === noteId)) {
        cache.notes.push({
          id: noteId,
          courseId,
          lessonId,
          content,
          updatedAt: noteData.updatedAt
        });
      }

      return content;
    }
    return "";
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return "";
  }
}

/**
 * Fetches all notes for the current user.
 * Optimized with user-scoped in-memory caching and request deduplication.
 */
export async function getAllNotes() {
  const auth = getAuthService();
  if (!auth.currentUser) return [];
  const userId = auth.currentUser.uid;

  // 1. Return from user-scoped cache if available and complete
  if (userNotesCache[userId]?.isComplete) {
    return userNotesCache[userId].notes;
  }

  // 2. Check for an in-flight request
  if (inFlightNotesRequests[userId]) {
    return inFlightNotesRequests[userId];
  }

  // 3. Initiate new request and register it
  const requestPromise = (async () => {
    const db = getDbService();
    const path = `userNotes/${userId}/notes`;
    try {
      const notesRef = collection(db, path);
      const snapshot = await getDocs(notesRef);
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];

      // Populate user-scoped cache
      userNotesCache[userId] = { notes, isComplete: true };

      return notes;
    } catch (error) {
      console.error('Error fetching all notes', error);
      return [];
    } finally {
      // Clean up in-flight registry
      delete inFlightNotesRequests[userId];
    }
  })();

  inFlightNotesRequests[userId] = requestPromise;

  return requestPromise;
}
