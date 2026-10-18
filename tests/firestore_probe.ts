import { initializeFirebaseAdmin, verifyFirestoreProbe, getFirebaseAdminApp } from '../src/server/auth/firebaseAdmin.ts';
import { initializeRepositories, isLiveFirestoreActive } from '../src/repositories/index.ts';

async function runProbe() {
  console.log('=====================================================');
  console.log(' ScholarSense SPIS - Cloud Firestore Probe Utility');
  console.log('=====================================================');

  // 1. Initialize
  initializeFirebaseAdmin();
  const repoInit = await initializeRepositories();

  const adminApp = getFirebaseAdminApp();
  console.log(`[Status] Firebase Admin Initialized: ${Boolean(adminApp)}`);
  console.log(`[Status] Live Firestore Active: ${isLiveFirestoreActive()}`);
  console.log(`[Status] Repository Message: ${repoInit.message}`);

  // 2. Run harmless probe
  console.log('\n[Probe] Executing harmless Write -> Read -> Delete probe...');
  const result = await verifyFirestoreProbe();

  console.log(`[Probe Result] Success: ${result.success}`);
  console.log(`[Probe Result] Stage: ${result.stage}`);
  console.log(`[Probe Result] Latency: ${result.latencyMs}ms`);
  console.log(`[Probe Result] Message: ${result.message}`);

  if (result.details) {
    console.log('[Probe Details]', JSON.stringify(result.details, null, 2));
  }
  console.log('=====================================================');
}

runProbe().catch((err) => {
  console.error('[Probe Uncaught Error]:', err.message);
  process.exit(1);
});
