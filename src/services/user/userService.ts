/**
 * User service for Firestore operations
 */
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { 
  UserData, 
  UserProgress, 
  UserAchievement, 
  ChallengeResult 
} from '@/types/user';

const USERS_COLLECTION = 'users';
const RESULTS_COLLECTION = 'challengeResults';

/**
 * Creates a new user document in Firestore or updates an existing one
 */
export async function createOrUpdateUser(user: User): Promise<UserData> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);
  
  const now = new Date().toISOString();
  
  if (!userDoc.exists()) {
    // Create new user data
    const userData: UserData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      progress: {
        totalScore: 0,
        level: 1,
        nextLevelPoints: 100,
        xpEarned: 0,
        streakDays: 0,
        lastActiveDate: now,
        challengesCompleted: 0,
        completedChallenges: {
          conversation: 0,
          makeSentence: 0,
          multipleChoice: 0
        },
        joinDate: now
      },
      achievements: [],
      recentChallenges: [],
      preferences: {
        emailNotifications: false,
        dailyReminder: true
      },
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(userRef, userData);
    return userData;
  } else {
    // Update existing user data
    const existingData = userDoc.data() as UserData;
    
    // Only update these fields for existing users
    const updateData = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      updatedAt: now
    };
    
    await updateDoc(userRef, updateData);
    
    // Return the updated data (merge local changes with existing data)
    return {
      ...existingData,
      ...updateData
    };
  }
}

/**
 * Retrieves user data from Firestore
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

/**
 * Updates user progress data
 */
export async function updateUserProgress(
  userId: string, 
  progressUpdate: Partial<UserProgress>
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = new Date().toISOString();
    
    // Create an object with prefixed paths for each field to update
    const updates: Record<string, any> = {};
    
    // Add progress updates with proper path prefixes
    Object.entries(progressUpdate).forEach(([key, value]) => {
      updates[`progress.${key}`] = value;
    });
    
    // Always update the lastActiveDate and updatedAt
    updates['progress.lastActiveDate'] = now;
    updates['updatedAt'] = now;
    
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

/**
 * Adds a new achievement to user's achievements array
 */
export async function addUserAchievement(
  userId: string, 
  achievement: UserAchievement
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = new Date().toISOString();
    
    await updateDoc(userRef, {
      achievements: arrayUnion(achievement),
      updatedAt: now
    });
  } catch (error) {
    console.error('Error adding user achievement:', error);
    throw error;
  }
}

/**
 * Adds a challenge result and updates relevant user progress
 */
export async function addChallengeResult(
  userId: string, 
  result: ChallengeResult
): Promise<void> {
  try {
    // Get current user data first
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as UserData;
    const now = new Date().toISOString();
    
    // Calculate new progress values
    const updatedProgress = {
      totalScore: userData.progress.totalScore + result.score,
      xpEarned: userData.progress.xpEarned + result.score,
      challengesCompleted: userData.progress.challengesCompleted + 1,
      completedChallenges: {
        ...userData.progress.completedChallenges,
        [result.challengeType]: userData.progress.completedChallenges[result.challengeType as keyof typeof userData.progress.completedChallenges] + 1
      }
    };
    
    // Check if level up is needed
    let { level, nextLevelPoints } = userData.progress;
    
    if (updatedProgress.totalScore >= userData.progress.nextLevelPoints) {
      level += 1;
      nextLevelPoints = calculateNextLevelPoints(level);
    }
    
    // Check streaks
    const lastActive = new Date(userData.progress.lastActiveDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If last active was yesterday, increment streak
    // If last active was today already, keep streak
    // Otherwise (gap more than a day), reset streak to 1
    let streakDays = userData.progress.streakDays;
    
    if (isSameDay(lastActive, yesterday)) {
      streakDays += 1;
    } else if (!isSameDay(lastActive, today)) {
      streakDays = 1;
    }
    
    // Store the challenge result
    const resultRef = doc(collection(db, USERS_COLLECTION, userId, RESULTS_COLLECTION));
    await setDoc(resultRef, {
      ...result,
      userId,
      completedAt: now
    });
    
    // Update user progress
    await updateDoc(userRef, {
      'progress.totalScore': updatedProgress.totalScore,
      'progress.xpEarned': updatedProgress.xpEarned,
      'progress.level': level,
      'progress.nextLevelPoints': nextLevelPoints,
      'progress.streakDays': streakDays,
      'progress.lastActiveDate': now,
      'progress.challengesCompleted': updatedProgress.challengesCompleted,
      [`progress.completedChallenges.${result.challengeType}`]: updatedProgress.completedChallenges[result.challengeType as keyof typeof updatedProgress.completedChallenges],
      recentChallenges: arrayUnion(result),
      updatedAt: now
    });
  } catch (error) {
    console.error('Error adding challenge result:', error);
    throw error;
  }
}

/**
 * Updates user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserData['preferences']>
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const now = new Date().toISOString();
    
    // Create an object with prefixed paths for preferences
    const updates: Record<string, any> = {};
    
    Object.entries(preferences).forEach(([key, value]) => {
      updates[`preferences.${key}`] = value;
    });
    
    updates['updatedAt'] = now;
    
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

/**
 * Gets user challenge results with pagination
 */
export async function getUserChallengeResults(
  userId: string,
  challengeType?: string,
  resultLimit = 10,
  startAfter?: Date
): Promise<ChallengeResult[]> {
  try {
    const resultsRef = collection(db, USERS_COLLECTION, userId, RESULTS_COLLECTION);
    
    let resultsQuery = query(
      resultsRef,
      orderBy('completedAt', 'desc'),
      limit(resultLimit)
    );
    
    // Add optional filters
    if (challengeType) {
      resultsQuery = query(resultsQuery, where('challengeType', '==', challengeType));
    }
    
    if (startAfter) {
      resultsQuery = query(resultsQuery, where('completedAt', '<', startAfter.toISOString()));
    }
    
    const snapshot = await getDocs(resultsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        challengeType: data.challengeType,
        score: data.score,
        maxScore: data.maxScore,
        completedAt: data.completedAt,
        duration: data.duration
      } as ChallengeResult;
    });
  } catch (error) {
    console.error('Error getting user results:', error);
    throw error;
  }
}

// Helper functions

/**
 * Calculate points needed for next level
 * This uses a simple algorithm: 100 * level^1.5
 */
function calculateNextLevelPoints(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
