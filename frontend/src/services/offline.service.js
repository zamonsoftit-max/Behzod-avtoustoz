// Offline test functionality using IndexedDB
import { openDB } from 'idb';

const DB_NAME = 'BehzodAvtoustoz';
const DB_VERSION = 1;
const STORES = {
  QUESTIONS: 'offline_questions',
  TEST_RESULTS: 'offline_test_results',
  CACHED_DATA: 'cached_data'
};

// Initialize IndexedDB
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for offline questions
      if (!db.objectStoreNames.contains(STORES.QUESTIONS)) {
        const questionsStore = db.createObjectStore(STORES.QUESTIONS, { keyPath: '_id' });
        questionsStore.createIndex('topic', 'topic');
        questionsStore.createIndex('testType', 'testType');
      }

      // Store for offline test results
      if (!db.objectStoreNames.contains(STORES.TEST_RESULTS)) {
        const resultsStore = db.createObjectStore(STORES.TEST_RESULTS, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        resultsStore.createIndex('synced', 'synced');
        resultsStore.createIndex('userId', 'userId');
      }

      // Store for cached data (topics, tickets)
      if (!db.objectStoreNames.contains(STORES.CACHED_DATA)) {
        db.createObjectStore(STORES.CACHED_DATA, { keyPath: 'key' });
      }
    }
  });
};

// Check if offline mode is available
export const isOfflineModeAvailable = async () => {
  try {
    const db = await initDB();
    const count = await db.count(STORES.QUESTIONS);
    return count > 0;
  } catch (error) {
    console.error('Error checking offline mode:', error);
    return false;
  }
};

// Save questions for offline use
export const saveQuestionsForOffline = async (questions, testType, metadata = {}) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.QUESTIONS, 'readwrite');
    
    for (const question of questions) {
      await tx.objectStore(STORES.QUESTIONS).put({
        ...question,
        testType,
        savedAt: new Date().toISOString(),
        metadata
      });
    }
    
    await tx.complete;
    return true;
  } catch (error) {
    console.error('Error saving questions for offline:', error);
    return false;
  }
};

// Get offline questions
export const getOfflineQuestions = async (testType, limit = 20) => {
  try {
    const db = await initDB();
    let questions = [];
    
    if (testType === 'random') {
      // Get all questions and shuffle
      const allQuestions = await db.getAll(STORES.QUESTIONS);
      questions = shuffleArray(allQuestions).slice(0, limit);
    } else {
      // Get questions by test type
      const index = db.transaction(STORES.QUESTIONS).objectStore(STORES.QUESTIONS).index('testType');
      questions = await index.getAll(testType);
      questions = shuffleArray(questions).slice(0, limit);
    }
    
    return questions;
  } catch (error) {
    console.error('Error getting offline questions:', error);
    return [];
  }
};

// Save test result offline
export const saveOfflineTestResult = async (result, userId) => {
  try {
    const db = await initDB();
    
    const offlineResult = {
      ...result,
      userId,
      synced: false,
      createdAt: new Date().toISOString(),
      isOffline: true
    };
    
    const id = await db.add(STORES.TEST_RESULTS, offlineResult);
    return { ...offlineResult, id };
  } catch (error) {
    console.error('Error saving offline test result:', error);
    return null;
  }
};

// Get unsynced test results
export const getUnsyncedTestResults = async (userId) => {
  try {
    const db = await initDB();
    const index = db.transaction(STORES.TEST_RESULTS).objectStore(STORES.TEST_RESULTS).index('synced');
    const results = await index.getAll(false);
    
    // Filter by userId
    return results.filter(r => r.userId === userId);
  } catch (error) {
    console.error('Error getting unsynced results:', error);
    return [];
  }
};

// Mark test result as synced
export const markTestResultAsSynced = async (id) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.TEST_RESULTS, 'readwrite');
    const result = await tx.objectStore(STORES.TEST_RESULTS).get(id);
    
    if (result) {
      result.synced = true;
      result.syncedAt = new Date().toISOString();
      await tx.objectStore(STORES.TEST_RESULTS).put(result);
    }
    
    await tx.complete;
    return true;
  } catch (error) {
    console.error('Error marking result as synced:', error);
    return false;
  }
};

// Cache data for offline use
export const cacheData = async (key, data) => {
  try {
    const db = await initDB();
    await db.put(STORES.CACHED_DATA, {
      key,
      data,
      cachedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
};

// Get cached data
export const getCachedData = async (key) => {
  try {
    const db = await initDB();
    const cached = await db.get(STORES.CACHED_DATA, key);
    return cached?.data || null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

// Clear old offline data
export const clearOldOfflineData = async (daysToKeep = 7) => {
  try {
    const db = await initDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Clear old questions
    const questionsTx = db.transaction(STORES.QUESTIONS, 'readwrite');
    const questions = await questionsTx.objectStore(STORES.QUESTIONS).getAll();
    
    for (const question of questions) {
      if (new Date(question.savedAt) < cutoffDate) {
        await questionsTx.objectStore(STORES.QUESTIONS).delete(question._id);
      }
    }
    
    // Clear synced test results older than cutoff
    const resultsTx = db.transaction(STORES.TEST_RESULTS, 'readwrite');
    const results = await resultsTx.objectStore(STORES.TEST_RESULTS).getAll();
    
    for (const result of results) {
      if (result.synced && new Date(result.createdAt) < cutoffDate) {
        await resultsTx.objectStore(STORES.TEST_RESULTS).delete(result.id);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing old offline data:', error);
    return false;
  }
};

// Utility function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const offlineService = {
  isOfflineModeAvailable,
  saveQuestionsForOffline,
  getOfflineQuestions,
  saveOfflineTestResult,
  getUnsyncedTestResults,
  markTestResultAsSynced,
  cacheData,
  getCachedData,
  clearOldOfflineData
};

export default offlineService;