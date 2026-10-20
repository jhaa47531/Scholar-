import { getFirestoreDb } from '../server/auth/firebaseAdmin.ts';
import { IAcademicRepository } from './interfaces/IAcademicRepository.ts';
import { IAssessmentRepository } from './interfaces/IAssessmentRepository.ts';
import { IAuditRepository } from './interfaces/IAuditRepository.ts';
import { AcademicRepository as InMemoryAcademicRepository } from './firestore/AcademicRepository.ts';
import { AssessmentRepository as InMemoryAssessmentRepository } from './firestore/AssessmentRepository.ts';
import { AuditRepository as InMemoryAuditRepository } from './firestore/AuditRepository.ts';
import { CloudFirestoreAcademicRepository } from './firestore/CloudFirestoreAcademicRepository.ts';
import { CloudFirestoreAssessmentRepository } from './firestore/CloudFirestoreAssessmentRepository.ts';
import { CloudFirestoreAuditRepository } from './firestore/CloudFirestoreAuditRepository.ts';

// 1. Preserved In-Memory Repositories (Always Available for Offline/Testing)
export const inMemoryAcademicRepo = new InMemoryAcademicRepository();
export const inMemoryAuditRepo = new InMemoryAuditRepository();
export const inMemoryAssessmentRepo = new InMemoryAssessmentRepository(inMemoryAuditRepo);

// 2. Real Cloud Firestore Repositories (Active when Firebase credentials are configured)
let cloudAcademicRepo: CloudFirestoreAcademicRepository | null = null;
let cloudAssessmentRepo: CloudFirestoreAssessmentRepository | null = null;
let cloudAuditRepo: CloudFirestoreAuditRepository | null = null;
let liveFirestoreVerified = false;

export async function initializeRepositories(): Promise<{ isLiveFirestore: boolean; message: string }> {
  const db = getFirestoreDb();
  if (db) {
    try {
      cloudAcademicRepo = new CloudFirestoreAcademicRepository(db);
      cloudAssessmentRepo = new CloudFirestoreAssessmentRepository(db);
      cloudAuditRepo = new CloudFirestoreAuditRepository(db);

      // Verify live connection and safely seed initial schema if empty
      await cloudAcademicRepo.ensureInitialized();
      await cloudAssessmentRepo.ensureInitialized();
      await cloudAuditRepo.ensureInitialized();

      liveFirestoreVerified = true;
      console.log('[SPIS Repositories] Live Cloud Firestore repository adapter ACTIVE and initialized.');
      return {
        isLiveFirestore: true,
        message: 'Live Cloud Firestore persistence active for project scholarsense-f29bb',
      };
    } catch (err: any) {
      console.warn('[SPIS Repositories] Cloud Firestore connection fallback to in-memory:', err.message);
      liveFirestoreVerified = false;
      return {
        isLiveFirestore: false,
        message: `Firestore unavailable (${err.message}). Using In-Memory adapter.`,
      };
    }
  }

  return {
    isLiveFirestore: false,
    message: 'No Firebase service account configured. Using In-Memory adapter.',
  };
}

export function isLiveFirestoreActive(): boolean {
  return liveFirestoreVerified;
}

// 3. Dynamic Repositories: Delegate to Live Cloud Firestore if active, else fallback to In-Memory
export const activeAcademicRepo: IAcademicRepository = new Proxy({} as IAcademicRepository, {
  get(_, prop: keyof IAcademicRepository) {
    const target = liveFirestoreVerified && cloudAcademicRepo ? cloudAcademicRepo : inMemoryAcademicRepo;
    const value = (target as any)[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  },
  set(_, prop, value) {
    const target = liveFirestoreVerified && cloudAcademicRepo ? cloudAcademicRepo : inMemoryAcademicRepo;
    (target as any)[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    const target = liveFirestoreVerified && cloudAcademicRepo ? cloudAcademicRepo : inMemoryAcademicRepo;
    delete (target as any)[prop];
    return true;
  },
  has(_, prop) {
    const target = liveFirestoreVerified && cloudAcademicRepo ? cloudAcademicRepo : inMemoryAcademicRepo;
    return prop in target;
  },
});

export const activeAssessmentRepo: IAssessmentRepository = new Proxy({} as IAssessmentRepository, {
  get(_, prop: keyof IAssessmentRepository) {
    const target = liveFirestoreVerified && cloudAssessmentRepo ? cloudAssessmentRepo : inMemoryAssessmentRepo;
    const value = (target as any)[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  },
  set(_, prop, value) {
    const target = liveFirestoreVerified && cloudAssessmentRepo ? cloudAssessmentRepo : inMemoryAssessmentRepo;
    (target as any)[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    const target = liveFirestoreVerified && cloudAssessmentRepo ? cloudAssessmentRepo : inMemoryAssessmentRepo;
    delete (target as any)[prop];
    return true;
  },
  has(_, prop) {
    const target = liveFirestoreVerified && cloudAssessmentRepo ? cloudAssessmentRepo : inMemoryAssessmentRepo;
    return prop in target;
  },
});

export const activeAuditRepo: IAuditRepository = new Proxy({} as IAuditRepository, {
  get(_, prop: keyof IAuditRepository) {
    const target = liveFirestoreVerified && cloudAuditRepo ? cloudAuditRepo : inMemoryAuditRepo;
    const value = (target as any)[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  },
  set(_, prop, value) {
    const target = liveFirestoreVerified && cloudAuditRepo ? cloudAuditRepo : inMemoryAuditRepo;
    (target as any)[prop] = value;
    return true;
  },
  deleteProperty(_, prop) {
    const target = liveFirestoreVerified && cloudAuditRepo ? cloudAuditRepo : inMemoryAuditRepo;
    delete (target as any)[prop];
    return true;
  },
  has(_, prop) {
    const target = liveFirestoreVerified && cloudAuditRepo ? cloudAuditRepo : inMemoryAuditRepo;
    return prop in target;
  },
});
