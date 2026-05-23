# Feature-by-Feature Backend Build Flow

## 1. Build Sequence Philosophy

This document defines the exact backend execution sequence to build the medical history app **feature by feature**, with each feature completed end-to-end before moving to the next. The order is intentionally designed to keep security controls ahead of data exposure and to ensure that no feature bypasses patient-controlled access rules.

Guiding rules for all phases:

- patient control is the primary access model
- authentication never implies unrestricted authorization
- all sensitive operations generate audit logs
- medical files are stored only on local server directories
- medical records follow append-only behavior

---

## 2. Feature 1: Project Foundation and Secure Skeleton

### Goal

Create the backend skeleton with the required architecture boundaries before adding business features.

### Deliverables

- modular folder structure (`routes`, `controllers`, `services`, `models`, `middleware`, `validators`, `utils`, `uploads`)
- global security middleware baseline (helmet, cors policy, rate limiting)
- centralized error handling pattern
- environment variable contract
- request logging baseline

### Exact Flow

1. Create folder structure and module separation.
2. Initialize Express app and mount versioned API base path.
3. Register baseline middleware stack in secure order:
   - JSON parser
   - security headers
   - cors policy
   - rate limiter
   - request context helpers (if used)
4. Add centralized error middleware to standardize error responses.
5. Define environment variable keys and startup validation strategy.
6. Ensure `uploads/` root is created locally and not publicly exposed.

### Why this must come first

Without this skeleton, later feature logic tends to become scattered and security checks become inconsistent across routes.

---

## 3. Feature 2: Identity, OTP Authentication, and JWT Session Layer

### Goal

Implement secure user identity flow with OTP verification and JWT-based protected sessions.

### Deliverables

- user identity model foundations
- OTP issuance/verification flow
- JWT access control for protected routes
- refresh token policy (if included in your auth design)
- auth middleware attaching actor context to requests

### Exact Flow

1. Define user identity schema with role anchor.
2. Implement OTP request endpoint:
   - validate input
   - generate OTP with expiry window
   - enforce retry/attempt controls
3. Implement OTP verify endpoint:
   - validate OTP correctness and expiry
   - reject invalid attempts with consistent error behavior
4. On successful verification, issue JWT token set.
5. Add auth middleware for token extraction and validation.
6. Apply auth middleware to protected route groups.
7. Log auth-critical events to audit/security logs.

### Security intent

This phase guarantees all subsequent features run on verified identity and token-validated requests.

---

## 4. Feature 3: Role Model and RBAC Enforcement

### Goal

Enable role-aware access boundaries for Patient, Doctor, Emergency Contact, and Admin.

### Deliverables

- role definition and role guard middleware
- route-level RBAC policy matrix
- denied-access handling and logging

### Exact Flow

1. Define role constants centrally.
2. Build RBAC middleware that checks actor role against route policy.
3. Attach RBAC guards to every protected endpoint group.
4. Separate role capabilities by API domain:
   - patient self actions
   - doctor constrained actions
   - emergency limited actions
   - admin governance actions
5. Record authorization denials in logs where appropriate.

### Critical principle

Doctor authentication confirms doctor identity only. It does not grant patient record access without consent checks (implemented in later feature).

---

## 5. Feature 4: Domain Models and Data Collections

### Goal

Define core MongoDB collections and relationships needed for all higher-level workflows.

### Deliverables

- `Users`
- `Patients`
- `Doctors`
- `MedicalRecords`
- `Consents`
- `EmergencyContacts`
- `AuditLogs`

### Exact Flow

1. Design schema boundaries per collection (avoid one giant patient document).
2. Add reference fields to connect user-role profiles and patient-linked entities.
3. Define timestamp strategy and lifecycle fields (especially for consent expiry).
4. Add indexes for frequent queries:
   - consent lookups by patient+doctor+active window
   - audit logs by patient and time
   - medical records by patient timeline order
5. Validate relation integrity through service-layer checks.

### Why this phase is separate

Stable data boundaries reduce rework when consent, emergency, and file modules are added.

---

## 6. Feature 5: Patient Medical Timeline and Append-Only Medical Records

### Goal

Implement medical record creation and retrieval with append-only principles.

### Deliverables

- patient timeline retrieval APIs
- record creation APIs for authorized actors
- append-only record mutation policy

### Exact Flow

1. Create validators for medical record payload shapes.
2. Implement service logic for record creation as new timeline entries.
3. Prevent direct destructive edits to historical records.
4. Allow corrections through additive follow-up entries instead of in-place overwrite.
5. Build timeline query APIs sorted chronologically.
6. Attach RBAC + ownership/consent checks to all retrieval and write endpoints.
7. Add audit entries for record create/read actions.

### Why append-only matters

Medical history must remain traceable over time. Rewriting historical entries reduces trust and forensic clarity.

---

## 7. Feature 6: Local File Upload Architecture for Medical Reports

### Goal

Enable secure medical report upload and local storage, with metadata in MongoDB and file binaries on disk.

### Deliverables

- upload endpoint(s) protected by auth + authorization checks
- strict upload validation (MIME, size, metadata)
- local patient-scoped directory structure
- MongoDB metadata persistence for each file

### Exact Flow

1. Define local upload root in environment configuration.
2. Create patient-based storage structure:
   - `uploads/patients/<patient-id>/reports/`
   - optional date buckets for scale
3. Validate uploader permissions before file write.
4. Validate request body + file metadata alignment.
5. Apply MIME allowlist and file size controls.
6. Generate unique server-side filename.
7. Write file to local disk path.
8. Store file metadata in `MedicalRecords` or linked file metadata fields (per design).
9. Generate audit log for upload event.

### Why this architecture is mandatory

Metadata belongs in MongoDB for queryability; actual files remain local for controlled secure access and storage determinism in this project scope.

---

## 8. Feature 7: Secure Local File Access and Streaming

### Goal

Serve report files only through authorization-gated backend endpoints.

### Deliverables

- secure file retrieval/stream endpoint
- permission verification chain before stream
- audit coverage of file access attempts

### Exact Flow

1. Client requests report via protected API route (not static public path).
2. Auth middleware validates JWT.
3. RBAC middleware validates role capability.
4. Consent/emergency/ownership check validates patient-level authorization.
5. Service fetches file metadata from MongoDB.
6. Service resolves expected local path from trusted metadata.
7. Backend streams file only if all checks pass.
8. Log successful and denied access attempts.

### Security reason

Public file URLs bypass policy checks and remove accountability; secure streaming preserves control and auditability.

---

## 9. Feature 8: Consent System (Patient-Approved Doctor Access)

### Goal

Allow doctors to access specific patient data only under active, patient-granted consent windows.

### Deliverables

- consent creation endpoint (patient action)
- consent revoke endpoint
- consent expiry-aware authorization checks
- consent-aware doctor access middleware/service checks

### Exact Flow

1. Patient submits consent grant with doctor target and scope.
2. Validator enforces scope and expiry constraints.
3. Service stores consent record with active window.
4. Doctor access requests trigger consent lookup by patient+doctor+active status.
5. Access allowed only if consent exists, is active, and scope matches request.
6. Patient can revoke consent before expiry.
7. Expired consent automatically blocks further access.
8. Log grant/revoke/access decisions to audit logs.

### Why expiration is critical

Without expiry, old access grants become long-term silent exposure.

---

## 10. Feature 9: Emergency Access with Strict Data Scope

### Goal

Allow emergency contacts to retrieve only life-critical information, never full records.

### Deliverables

- emergency contact relationship model usage
- emergency-only endpoint(s)
- field-level response filtering
- patient notification hook and audit capture

### Exact Flow

1. Emergency contact authenticates through normal auth flow.
2. RBAC confirms emergency contact role.
3. Service verifies contact relationship with target patient.
4. Service returns only allowed emergency fields:
   - blood group
   - allergies
   - chronic diseases
   - current medications
5. Block private consultations and sensitive non-emergency history.
6. Log every emergency access attempt.
7. Trigger patient notification event.

### Risk control reason

Emergency access is safety-oriented, not a broad clinical browsing permission.

---

## 11. Feature 10: Audit Logging System (Full Activity Accountability)

### Goal

Create complete, queryable records of sensitive actions across all modules.

### Deliverables

- audit log schema and service
- mandatory audit instrumentation points
- patient-visible audit retrieval endpoint

### Exact Flow

1. Define audit event format:
   - actor
   - target resource/patient
   - action type
   - timestamp
   - IP
   - outcome
2. Integrate audit writes into:
   - authentication events
   - consent grant/revoke
   - medical record reads/writes
   - file uploads/downloads
   - emergency attempts
3. Expose patient-facing endpoint to view relevant logs.
4. Protect logs from mutation/tampering by application users.

### Why this is non-negotiable

In medical systems, trust depends on being able to answer: who accessed what, when, and why.

---

## 12. Feature 11: Validation Layer Completion

### Goal

Harden all endpoints with consistent validation contracts.

### Deliverables

- dedicated validators per feature domain
- standard validation error response structure
- prevention of malformed payload penetration into service logic

### Exact Flow

1. Add validators for each route class (auth, records, consent, emergency, upload).
2. Enforce required fields and allowed enums.
3. Enforce format constraints for identifiers, timestamps, and scope fields.
4. Reject payloads early with predictable error outputs.

### Why now

By this phase all feature surfaces exist; validation can be completed comprehensively and uniformly.

---

## 13. Feature 12: Security Hardening Pass

### Goal

Apply final security controls across the completed backend.

### Deliverables

- rate limit tuning by endpoint sensitivity
- strict cors configuration
- helmet policy review
- token lifetime and refresh policy review
- sensitive-field encryption usage review
- upload boundary and directory permission review

### Exact Flow

1. Classify endpoints by abuse risk (auth, upload, record read, audit view).
2. Apply or tune rate limits accordingly.
3. Tighten cors origin policy.
4. Verify helmet protections are active.
5. Recheck file upload constraints and path traversal resistance.
6. Recheck that uploads are never served as public static directories.
7. Recheck local directory permissions and operational safeguards.

### Key reminder

Local storage is secure only when access is strictly API-mediated and directory exposure is blocked.

---

## 14. Feature 13: Error Handling and Logging Strategy Finalization

### Goal

Standardize runtime behavior for errors and operational observability.

### Deliverables

- centralized typed error responses
- separation of application logs and audit logs
- incident-friendly log context

### Exact Flow

1. Normalize error class handling and HTTP mapping.
2. Ensure no internal stack leaks in client responses.
3. Keep audit events separate from general runtime logs.
4. Include enough context in app logs for diagnostics without exposing secrets.

### Why this matters

Consistent errors reduce client-side confusion and improve maintainability under growth.

---

## 15. Feature 14: API Versioning and Evolution Guardrails

### Goal

Protect client compatibility while allowing future backend evolution.

### Deliverables

- versioned API route strategy
- policy for introducing breaking changes

### Exact Flow

1. Group routes under version namespace.
2. Define upgrade policy for future schema/contract changes.
3. Keep security and consent semantics stable across versions.

### Why this matters

Versioning prevents uncontrolled contract drift as features expand.

---

## 16. Feature 15: Background Jobs for Asynchronous Work

### Goal

Move non-blocking work out of synchronous request path.

### Deliverables

- emergency notification asynchronous processing
- consent expiry housekeeping jobs
- optional audit archival job strategy

### Exact Flow

1. Identify tasks that should not delay API response.
2. Execute them asynchronously through background processing pattern.
3. Ensure job outcomes are monitored/logged.
4. Keep security-relevant job actions auditable.

### Why this improves system behavior

API remains responsive while still performing critical side tasks reliably.

---

## 17. End-to-End Integrated Flow (How Features Work Together)

This is the final production interaction chain:

1. User authenticates with OTP.
2. Backend issues JWT session context.
3. Protected request arrives.
4. Middleware enforces rate limit, auth, and RBAC.
5. Consent or emergency scope check runs depending on route context.
6. Service performs medical record or file action.
7. If file needed, metadata resolves to local disk path and secure stream occurs.
8. Audit event is written for access/action.
9. Patient can review access logs for transparency.

This chain ensures identity, authorization, data minimization, and accountability remain enforced in every sensitive path.

---

## 18. Practical Build Checklist (Execution Order)

Use this exact implementation order:

1. secure project skeleton and middleware baseline
2. OTP + JWT authentication
3. RBAC enforcement
4. core MongoDB models
5. append-only medical record timeline
6. local upload pipeline
7. secure file streaming
8. consent workflow
9. emergency limited-access workflow
10. full audit logging coverage
11. complete validator coverage
12. security hardening pass
13. error/logging finalization
14. API versioning structure
15. background job support

Do not skip forward. Each step depends on controls introduced in prior steps.
