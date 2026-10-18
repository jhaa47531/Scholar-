# SPIS System Architecture Document

## 1. Modular Monolithic Architecture

The Student Performance Intelligence System (SPIS) is structured as a Clean Modular Monolith in TypeScript. The separation of concerns ensures that business logic, security constraints, and scoring formulas remain entirely independent of both presentation components and database drivers.

```
+-----------------------------------------------------------------------+
|                              Client (UI)                              |
|           React 19 + Tailwind CSS + Lucide Icons + Motion             |
|   (Role-Based Views: Admin Dashboard, Teacher Portal, Student Portal) |
+-----------------------------------+-----------------------------------+
                                    | REST / JSON APIs (Bearer Token)
                                    v
+-----------------------------------------------------------------------+
|                   Node.js / Express Application Server                |
|  - Entry Point: server.ts (Mounts Vite in Dev, Express Static in Prod)|
|  - Security & RBAC Middleware: Verify Firebase Auth / Token Claims    |
|  - Request Validation Middleware: Schema boundary checks              |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                           Business Services                           |
|  - AcademicService (Courses, Sessions, Semesters, Electives)          |
|  - AssessmentService (11-Step Teacher Submission Workflow)            |
|  - CalculationService (40% Sessional + 20% Att + 15% Asg + 15% Pre    |
|                         + 10% Int; Normalized, Versioned)             |
|  - ReportService (Sessional 1 & 2 isolation, prerequisite validation)  |
|  - AuditService (Immutable audit logs of changes & corrections)       |
|  - MigrationService (Oracle DDL generation, data export, reconcile)   |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                       Repository Interface Layer                      |
|  - IUserRepository           - IAcademicRepository                   |
|  - IAssessmentRepository     - IReportRepository                     |
|  - IAuditRepository                                                   |
+-------------------+-----------------------------------+---------------+
                    |                                   |
         (Current Implementation)               (Target Future)
                    v                                   v
+---------------------------------------+   +---------------------------+
|      Firestore Repository Adapter     |   | Oracle Repository Adapter |
|  - Uses Firebase Firestore Collections|   | - Official node-oracledb  |
|  - Strict error handling & batching   |   | - Relational DDL & ACID   |
|  - No Firestore types in services     |   |   transactions            |
+---------------------------------------+   +---------------------------+
```

## 2. Non-Negotiable Boundaries

1. **Frontend Isolation**: No service account keys, raw database tokens, or direct privileged writes in frontend code.
2. **Business Rule Isolation**: Scoring formulas, absence vs zero rules, and final submission gates exist strictly inside domain services, never duplicated in frontend components.
3. **Repository Contract**: Business services call only repository interfaces (`IAcademicRepository`, `IAssessmentRepository`, etc.), passing and receiving clean domain DTOs.
4. **Zero-Trust Role Enforcement**: User roles and IDs are always server-verified. Request parameters containing user IDs or subject IDs are strictly cross-checked against the authenticated subject's assignments and enrollments.
5. **Auditability**: Every post-final submission update is permanently journaled with `previousValue`, `newValue`, `reason`, `authorizedBy`, and `timestamp`.
