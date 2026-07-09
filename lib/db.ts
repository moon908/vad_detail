import fs from 'fs';
import path from 'path';

// Define DB path: project-root/data/db.json
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL 
  ? '/tmp/data' 
  : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface Analysis {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  formattedSize: string;
  format: string;
  duration: number;
  speechPercentage: number;
  silencePercentage: number;
  totalSpeech: number;
  totalSilence: number;
  speechSegmentsCount: number;
  silenceSegmentsCount: number;
  longestSpeech: number;
  shortestSpeech: number;
  avgSpeech: number;
  avgSilence: number;
  estimatedWords: number;
  estimatedSpeakingSpeedWpm: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  reportUrls: {
    pdf: string;
    docx: string;
    csv: string;
    json: string;
    zip: string;
    speech_only: string;
    silence_only: string;
    segments: string[];
  };
  aiInsights: string[];
  segments: {
    id: number;
    start: number;
    end: number;
    duration: number;
  }[];
}

interface DatabaseSchema {
  users: User[];
  analyses: Analysis[];
}

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_USER = {
  id: 'default-user-id',
  email: 'user@example.com',
  passwordHash: '',
  name: 'Platform User',
  createdAt: '2026-07-10T00:00:00.000Z'
};

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_PATH)) {
  const initialData: DatabaseSchema = { users: [DEFAULT_USER], analyses: [] };
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
} else {
  // Ensure the default user is present
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data) as DatabaseSchema;
    if (!parsed.users.some(u => u.id === DEFAULT_USER.id)) {
      parsed.users.push(DEFAULT_USER);
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Failed to seed default user:', e);
  }
}

/**
 * Reads the database from the local JSON file.
 */
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { users: [], analyses: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error('Error reading JSON DB, returning empty schema:', error);
    return { users: [], analyses: [] };
  }
}

/**
 * Writes the database back to the local JSON file.
 */
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON DB:', error);
    throw new Error('Database write error');
  }
}

// ==========================================
// USER DATABASE METHODS
// ==========================================

export function getUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find((u) => u.id === id);
}

export function createUser(user: Omit<User, 'id' | 'createdAt'>): User {
  const db = readDb();
  
  // Check if user already exists
  if (db.users.some((u) => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('User already exists');
  }

  const newUser: User = {
    ...user,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): User {
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('User not found');
  }

  const updatedUser = {
    ...db.users[index],
    ...updates
  };

  db.users[index] = updatedUser;
  writeDb(db);
  return updatedUser;
}

export function deleteUser(id: string): void {
  const db = readDb();
  db.users = db.users.filter((u) => u.id !== id);
  // Also cascade delete their analyses
  db.analyses = db.analyses.filter((a) => a.userId !== id);
  writeDb(db);
}

// ==========================================
// ANALYSIS DATABASE METHODS
// ==========================================

export function getAnalysesByUserId(userId: string): Analysis[] {
  const db = readDb();
  return db.analyses
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAnalysisById(id: string): Analysis | undefined {
  const db = readDb();
  return db.analyses.find((a) => a.id === id);
}

export function createAnalysis(analysis: Omit<Analysis, 'createdAt'>): Analysis {
  const db = readDb();
  const newAnalysis: Analysis = {
    ...analysis,
    createdAt: new Date().toISOString()
  };

  db.analyses.push(newAnalysis);
  writeDb(db);
  return newAnalysis;
}

export function deleteAnalysis(id: string, userId: string): boolean {
  const db = readDb();
  const initialLength = db.analyses.length;
  
  // Find report folder first to clean it up
  const reportsDir = path.join(process.cwd(), 'data', 'reports', id);
  
  db.analyses = db.analyses.filter((a) => !(a.id === id && a.userId === userId));
  const deleted = db.analyses.length < initialLength;
  
  if (deleted) {
    writeDb(db);
    // Cleanup generated files on disk
    try {
      if (fs.existsSync(reportsDir)) {
        fs.rmSync(reportsDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Failed to delete folder for analysis ${id}:`, err);
    }
  }
  
  return deleted;
}
