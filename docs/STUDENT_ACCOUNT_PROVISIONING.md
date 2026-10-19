# One-time student account provisioning

The `provision:student` command creates one `STUDENT` `UserAccount` and its linked `StudentProfile` in the existing Firebase Authentication and Cloud Firestore architecture. It does not create Firebase Authentication users, handle passwords, or create `ADMIN` or `TEACHER` accounts.

Use it only after the institution has approved the student's identity and academic details, and only from an authorized operator workstation with the project's Firebase Admin configuration available through the existing environment setup.

Run the default dry-run:

```powershell
npm run provision:student
```

The command interactively prompts for the verified Firebase Authentication email, account display name, student name, enrollment number, roll number, existing course ID, current semester, and existing admission-session ID. Dry-run performs reads and validation only.

After reviewing the dry-run results and confirming institutional authorization and all details, run:

```powershell
npm run provision:student -- --apply
```

The apply mode repeats the Firebase Auth checks and all Firestore validation inside a transaction, then requires the operator to type `PROVISION STUDENT`. The transaction reads every relevant document before writing, then uses create-only writes for the linked account, student profile, and normalized-identifier reservation documents. These writes commit atomically; a conflict or pre-existing document stops the operation without overwriting data.

Validation checks that the Firebase Auth account already exists, is enabled, and has a verified matching email; no academic account has the same normalized email; no student has the same normalized enrollment number or roll number; the course exists and is active; the semester is within the course's configured range; and the admission session exists. Existing `users` and `students` are scanned to catch records created before this script's reservations. In the same transaction, the script creates documents in `studentProvisioningKeys` whose IDs are SHA-256 hashes of the normalized email, enrollment number, and roll number. The reservation writes serialize concurrent provisioning attempts that use any of those identifiers, while keeping the raw identifiers out of reservation document IDs and contents. Do not manually remove reservation documents; they enforce uniqueness for the lifetime of the corresponding academic identifiers.

The admission session is validated for existence and document-ID consistency only. The current repository model and student-admission flows do not define a rule requiring an admission session to be active or within its date range; `isActive` is used to select an active session for other workflows. This script therefore does not add an active/current-session restriction.

The transactional reservations protect concurrent runs of this provisioning script. Any future account/student creation path that must guarantee the same uniqueness invariants needs to use the same reservation scheme; legacy writers that do not reserve keys are not serialized by it. The script never prints submitted values, secrets, credentials, or tokens.

The script does not call repository initialization/seed routines and does not change existing accounts, roles, or Firebase Authentication records.
