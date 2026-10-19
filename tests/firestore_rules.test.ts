import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

describe('Firestore security rules account and profile mapping', () => {
  it('keeps unmatched Firestore paths denied by default', () => {
    assert.match(rules, /match \/\{document=\*\*\}[\s\S]*?allow read, write: if false;/);
  });

  it('resolves role checks from the provisioning script account document ID', () => {
    assert.match(rules, /return 'usr_' \+ request\.auth\.uid;/);
    assert.match(rules, /users\/\$\(academicUserId\(\)\)/);
    assert.match(rules, /get\(userPath\)\.data\.role == role/);
    for (const role of ['ADMIN', 'TEACHER', 'STUDENT']) {
      assert.match(rules, new RegExp(`return hasRole\\('${role}'\\);`));
    }
  });

  it('permits signed-in users to get only their mapped account unless they are admin', () => {
    assert.match(
      rules,
      /allow get: if isSignedIn\(\) && \(academicUserId\(\) == userId \|\| isAdmin\(\)\);/
    );
    assert.match(rules, /allow list: if isAdmin\(\);/);
    assert.match(rules, /allow create, update, delete: if isAdmin\(\);/);
  });

  it('isolates student profile reads through the academic account ID in userId', () => {
    assert.match(rules, /isStudent\(\) && resource\.data\.userId == academicUserId\(\)/);
    assert.match(rules, /allow list: if isAdmin\(\) \|\| isTeacher\(\);/);
    assert.match(rules, /allow write: if isAdmin\(\);/);
  });

  it('checks assessment ownership through the referenced student profile and hides drafts', () => {
    assert.match(rules, /students\/\$\(studentId\)/);
    assert.match(rules, /get\(studentPath\)\.data\.userId == academicUserId\(\)/);
    assert.match(
      rules,
      /ownsStudentProfile\(resource\.data\.studentId\) &&\s*resource\.data\.submissionStatus == 'FINAL_SUBMITTED'/
    );
    assert.match(rules, /allow create, update: if isSignedIn\(\) && \(isAdmin\(\) \|\| isTeacher\(\)\);/);
    assert.match(rules, /allow delete: if isAdmin\(\);/);
  });

  it('does not grant student or teacher privileges to a different role', () => {
    assert.match(rules, /function isAdmin\(\) \{\s*return hasRole\('ADMIN'\);/);
    assert.match(rules, /function isTeacher\(\) \{\s*return hasRole\('TEACHER'\);/);
    assert.match(rules, /function isStudent\(\) \{\s*return hasRole\('STUDENT'\);/);
  });
});
