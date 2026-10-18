# Student Performance Intelligence System (SPIS) - Requirement Checklist

| Requirement ID | Module / Requirement Description | Target Increment | Status | Verification Evidence / Notes |
|---|---|---|---|---|
| **REQ-01** | **Workspace & Environment Inspection** (Node 22+, npm, TS, Express, Vite, Directory structure) | Inc 1 | Verified | Node v22.23.3, npm 10.9.9, tsx full-stack setup with server.ts |
| **REQ-02** | **Full-Stack Application Foundation** (Express server, Vite middleware dev integration, Health check endpoint) | Inc 1 | Verified | `/api/health` returning system status, uptime, database driver mode |
| **REQ-03** | **Clean Repository Abstraction Layer** (Interfaces decoupled from Firestore SDK, DTOs, Oracle migration readiness) | Inc 1 | Verified | `src/repositories/interfaces/` defined for all domain entities; dual adapter architecture |
| **REQ-04** | **Firebase Safe Configuration & Blueprint** (Blueprint schema, environment isolation, zero-trust rules architecture) | Inc 1 | Verified | `firebase-blueprint.json` & client init; deny-all client access confirmed |
| **REQ-05** | **Three Distinct Application Roles** (Admin, Teacher, Student capabilities and boundary checks) | Inc 2 | Verified | Role models, RBAC middleware, and token claims mapping structure |
| **REQ-06** | **Server-Verified Authentication & RBAC** (Firebase ID token verification, session protection, record-level isolation) | Inc 2 | Verified | 11 Supertest integration tests passing for 401, 403, 200, 400 |
| **REQ-07** | **Configurable Course Structures & Academic Administration** (BCA, BBA, B.Com, B.A., B.Tech, MCA, MBA; Sessions, Semesters, Curriculum) | Inc 3 | Implemented | Master schema seeded and live in Cloud Firestore (`scholarsense-f29bb`) |
| **REQ-08** | **Subject Master & Elective Policy** (Subject codes, Required/Elective classification, Elective groups, completion policy) | Inc 3 | Implemented | Elective rules and curriculum versioning |
| **REQ-09** | **Teacher-Subject Assignment Enforcement** (Strict teacher assignment checks preventing unauthorized subject access) | Inc 3 | Verified | Repository assignment lookup and server guard (403 Forbidden verified) |
| **REQ-10** | **Sessional Configuration** (Separate Sessional 1 & 2, configurable max marks [default 25], status lifecycle) | Inc 4 | Implemented | Distinct sessional configuration entity and API |
| **REQ-11** | **Exact Teacher Submission Workflow** (Authorized load, Draft Save, Draft invisibility, Review Confirmation Modal, Final Submit) | Inc 4 | Implemented | 11-step teacher workflow with state locking |
| **REQ-12** | **Zero Marks vs Missing Marks vs Absence** (Genuine zero, missing/pending, exam absent with score 0 marked 'Not Attended') | Inc 4 | Verified | Strict differentiation in schema, calculation, and UI badges |
| **REQ-13** | **Correction Authorization & Audit Logging** (Post-final submission corrections requiring reason, before/after audit log) | Inc 4 | Verified | Immutable audit records with actor, timestamp, diff in Cloud Firestore |
| **REQ-14** | **Student Mark Isolation & Visibility** (Immediate visibility upon final submit, strict cross-student blocking) | Inc 5 | Verified | Row-level authorization & student dashboard (403 on cross-student query) |
| **REQ-15** | **Performance Scoring Engine** (40% Sessional, 20% Attendance, 15% Assignment, 15% Presentation, 10% Interaction; normalization) | Inc 6 | Verified | Formula engine with versioning and validation |
| **REQ-16** | **Overall Sessional Report Preconditions** (Separate S1/S2 reports, required subjects complete, elective completion check) | Inc 6 | Implemented | Validation barrier before overall report generation |
| **REQ-17** | **Report Snapshots & Versioning** (Immutable report version, weight snapshot, source change isolation) | Inc 6 | Implemented | Historical snapshot persistence |
| **REQ-18** | **Future Oracle Migration Architecture** (Table DDL, field mapping, data export, count & score reconciliation plan) | Inc 7 | Implemented | Dedicated migration schema and reconciliation tool |
| **REQ-19** | **Python Analytics Layer & Visualizations** (Pandas/Plotly integration, trends, at-risk detection without data invention) | Inc 7 | Not Started | Scheduled for Increment 7 |
| **REQ-20** | **Automated Testing & Verification Suite** (Unit, service, and endpoint test coverage for all critical rules) | Inc 1-7 | Verified | 22/22 tests passing across HTTP security, live Firestore, and business rules |
