# Backend API Architecture Guide

## 1. System Intent and Architectural Direction

This backend is designed as a security-first, patient-controlled medical history platform where access to health data is not implied by account existence, professional role, or successful login. The core architectural intent is to make the patient the authority over who can view what data, for how long, and under what context, while preserving a complete accountability trail for every sensitive operation.

The backend exists to orchestrate the following capabilities as one cohesive system:

- identity verification and session security
- role-aware authorization boundaries
- consent-governed doctor access
- constrained emergency visibility
- immutable-style medical record progression
- auditable access and activity history
- secure local file storage and retrieval

The system is built around a modular Node.js + Express API layer, MongoDB data persistence via Mongoose models, and a locally managed server filesystem for medical report files. Metadata and relational context live in MongoDB; binary report artifacts remain on disk under protected server directories and are never exposed as directly public assets.

## 2. Backend Architectural Principles

### 2.1 Patient-Controlled Access Philosophy

Patient-controlled access is the governing philosophy of this backend. Authentication proves identity, but authorization requires contextual permission checks tied to patient consent, emergency policy, and role-specific constraints.

This principle directly enforces that:

- doctor authentication does not equal authorization to any patient record
- emergency contact authentication does not equal full patient record access
- admin authority is operational and governance-oriented, not unrestricted clinical viewing by default
- all access pathways are inspectable through audit logs

### 2.2 Separation of Concerns

The architecture separates transport concerns, business logic, security decisions, data modeling, and file handling responsibilities across distinct backend folders and modules. This lowers coupling, improves testability, and reduces security drift where authorization logic can otherwise fragment across routes.

### 2.3 Append-Only Record Discipline

Medical records are treated as append-only events rather than mutable historical facts. Instead of rewriting old data, new entries should represent updates, corrections, or follow-up events. This preserves timeline integrity, simplifies medico-legal traceability, and aligns with auditability goals.

### 2.4 Explicit Consent Lifecycles

Consent is time-bound, revocable, and scoped. Access is evaluated at request time rather than inferred once and cached indefinitely. Consent expiration exists to prevent stale permissions from silently becoming permanent access.

### 2.5 Comprehensive Auditability

Every meaningful access action should produce an audit event carrying actor, target, action, context, time, and source IP. Audit is not a support feature; it is a core control mechanism enabling patient trust, incident response, and compliance-ready accountability.

## 3. High-Level Backend Topology

The architecture follows a modular MERN backend pattern with the API server as policy enforcement point.

- API Layer: Express routes/controllers receive requests and enforce HTTP-level boundaries.
- Security Layer: authentication middleware, RBAC checks, consent checks, emergency scope checks, rate limiting, helmet/cors hardening.
- Domain Services Layer: medical records, consent, emergency access decisions, audit event generation, OTP/JWT lifecycle orchestration.
- Data Layer: MongoDB collections for users, patient/doctor profiles, records, consents, emergency contacts, audit logs.
- File Layer (Local): filesystem directories for report artifacts with strict non-public access and controlled streaming.

All sensitive business decisions are expected to be resolved server-side. The frontend is a client of this policy engine and does not define access truth.

## 4. Recommended Backend Folder Organization and Responsibilities

### 4.1 `routes/`

Defines HTTP resource endpoints and route-to-controller mapping. Route files represent API surface boundaries and should remain thin. They should not contain policy-heavy domain logic beyond attaching appropriate middleware chains.

### 4.2 `controllers/`

Controllers translate validated HTTP input into service calls and shape HTTP responses. They coordinate request context, actor identity, and service outcomes. Controllers should avoid embedding persistent domain decisions that belong in services.

### 4.3 `services/`

The core business logic layer. Services implement consent evaluation rules, emergency-access filtering logic, record append behavior, audit event construction, and file metadata + storage coordination. This is where architectural rules are centralized for consistency.

### 4.4 `models/`

Mongoose schema definitions for each domain collection. Models define structural constraints, indexes, and entity relationships used by services.

### 4.5 `middleware/`

Cross-cutting guards and request preprocessing components:

- authentication validation
- role checks (RBAC)
- consent gate checks
- emergency mode constraints
- request rate limiting
- request security headers and cross-origin policy compatibility

### 4.6 `validators/`

Input contract enforcement for payload shape, required fields, role-dependent constraints, record format controls, upload metadata checks, and consent payload integrity. Validators prevent malformed input from reaching services.

### 4.7 `utils/`

Reusable technical helpers for token operations, hashing, encryption utilities, standardized error objects, date/time helpers, and secure filename generation mechanisms.

### 4.8 `uploads/`

Local file handling support components, including upload middleware configuration, MIME and size validation orchestration, and helper functions for disk-path composition and safe file retrieval.

## 5. Complete Request Lifecycle

A secure request lifecycle should follow a deterministic path:

1. Request enters Express route.
2. Security middlewares execute in order: rate limiting, header hardening context, authentication extraction, role checks, and domain-specific access gates.
3. Validators enforce payload contract and reject malformed content early.
4. Controller reads sanitized request context and forwards to service.
5. Service executes domain logic with DB queries and, if applicable, local file subsystem interactions.
6. Service records audit event for attempted and/or successful sensitive actions.
7. Controller returns normalized response or mapped error.
8. Error handling middleware standardizes failure responses and avoids leaking internals.

This lifecycle ensures that every critical action passes through authentication, authorization, validation, domain policy, and auditing before completion.

## 6. Authentication Architecture (OTP + JWT)

### 6.1 Authentication Goals

Authentication verifies user identity while minimizing sensitive identifier retention and reducing attack surface from credential reuse.

### 6.2 OTP Verification Stage

OTP-based login flow establishes proof of possession for the registered communication channel. OTP verification should be bounded by expiration windows, retry limits, and anti-bruteforce controls.

### 6.3 JWT Session Stage

After OTP verification, JWT access tokens represent authenticated session context. Refresh-token strategy supports controlled session continuation while enabling token rotation and revocation-oriented session hygiene.

### 6.4 Combined OTP + JWT Flow

- user initiates login
- OTP challenge generated and delivered
- OTP validated
- tokens issued upon successful verification
- authenticated requests include JWT
- middleware verifies token validity and attaches actor context
- refresh flow renews access under controlled policy

This separation prevents static password-only dependency and provides stronger, event-based authentication assurance.

## 7. RBAC Architecture

### 7.1 Role Definitions

Roles include:

- patient
- doctor
- emergency contact
- admin

### 7.2 RBAC Enforcement Philosophy

RBAC defines maximum possible capabilities per role. It does not alone grant data-level access to patient records. Data access remains additionally constrained by consent and emergency policy checks.

### 7.3 Why Doctor Authentication Is Not Authorization

A doctor account confirms doctor identity, not patient relationship. Without explicit patient-approved consent, a doctor should have no right to traverse patient-specific history. This prevents broad horizontal exposure risk where authenticated practitioners might otherwise enumerate records.

## 8. Consent System Flow

### 8.1 Consent as Access Contract

Consent entities represent patient-issued, scoped, and time-limited access contracts for specific doctors.

### 8.2 Consent Lifecycle

- consent created by patient
- consent bound to doctor and defined scope
- consent includes validity window
- doctor access evaluated against active, unexpired consent
- patient may revoke before expiration
- access automatically denied after expiration

### 8.3 Why Consent Expiration Matters

Consent expiration prevents silent perpetual access and enforces periodic re-authorization. This reduces long-tail risk from forgotten permissions and keeps control active with the patient rather than static at time of first grant.

## 9. Emergency Access Flow

### 9.1 Emergency Scope Model

Emergency contacts receive tightly constrained read visibility of critical medical essentials only:

- blood group
- allergies
- chronic diseases
- current medications

Sensitive/private consultation history remains blocked.

### 9.2 Emergency Access Lifecycle

- emergency contact authenticates
- emergency route applies emergency role + scope middleware
- service resolves only allowed fields
- audit event generated with high-priority tagging
- patient notification event should be triggered

### 9.3 Logging and Notification Requirement

Every emergency access attempt must be logged and associated with actor identity, target patient, timestamp, and source metadata. Patient notification closes the transparency loop and discourages misuse.

## 10. Audit Logging System

### 10.1 Core Audit Requirements

Audit logs capture:

- actor identity
- target resource or patient
- action type
- timestamp
- source IP
- result status/context

### 10.2 Audit Coverage Areas

- record view attempts
- record creation events
- consent grant/revoke actions
- emergency access attempts
- file download/stream requests
- authentication and token lifecycle security events

### 10.3 Why Audit Logging Is Critical

Audit logging provides forensic traceability, patient transparency, and operational governance. In systems handling medical history, inability to reconstruct who accessed what and when becomes a structural trust failure.

## 11. Local File Upload and Storage Architecture

### 11.1 Local Storage Mandate

Medical reports are stored locally on server-managed directories, not cloud object stores. Database stores metadata references; physical files remain on disk.

### 11.2 Why Direct Public Upload Access Is Dangerous

Publicly exposed upload directories create unauthorized discovery risk, bypass authorization pathways, and weaken audit guarantees. Report access must always be mediated through authenticated API routes that enforce consent and role policies.

### 11.3 Upload Handling Flow

- client submits multipart upload to protected API route
- middleware validates authentication and authorization context
- validators enforce file constraints and request metadata validity
- upload handler performs MIME/type and size verification
- service computes secure patient-scoped storage path
- unique server filename assigned
- file written to local disk
- metadata persisted in MongoDB
- audit event recorded

## 12. Local Filesystem Structure

A patient-based directory structure should be used to keep files organized, partition risk, and simplify retention and access checks.

Recommended structure concept:

- `uploads/`
- `uploads/patients/<patient-id>/`
- `uploads/patients/<patient-id>/reports/`
- optional period bucketing such as year/month for scale and filesystem hygiene

### 12.1 Why Patient-Based Paths Matter

Patient-scoped directory boundaries simplify authorization correlation and incident containment. It becomes easier to reason about ownership, audit mismatches, and cleanup operations.

### 12.2 Why Unique Filenames Are Important

Unique filenames prevent collisions, overwrite attacks, and path inference through predictable naming. File names should be generated by backend utilities and decoupled from user-provided names.

## 13. Upload Validation and Security Controls

Validation must include:

- MIME/type allowlist verification
- file size constraints
- extension sanity checks aligned to MIME
- filename sanitization
- request ownership and target-patient checks

### 13.1 Why MIME Validation Matters

Extension-only validation is weak because extensions are user-controlled and easily spoofed. MIME-aware checks reduce risk of malicious content masquerading as medical reports.

## 14. Secure File Access and Streaming

### 14.1 Access Model

File retrieval must be through secured endpoints only. The backend should:

- authenticate requester
- evaluate RBAC role
- evaluate patient ownership/consent/emergency scope
- locate file metadata in MongoDB
- map metadata path to local filesystem object
- stream file response after authorization pass
- record audit event

### 14.2 Why Files Must Not Be Publicly Exposed

Public serving bypasses consent checks, emergency restrictions, and actor attribution. Secure streaming preserves policy enforcement and event accountability for every read.

## 15. MongoDB Collection Design and Intent

### 15.1 `Users`

Stores identity and authentication-level user information, role assignment anchors, and account lifecycle fields.

### 15.2 `Patients`

Patient profile and patient-specific medical context anchors used across records, consent, and emergency mapping.

### 15.3 `Doctors`

Doctor profile details and role-specific references required for consent relationships and consultation attribution.

### 15.4 `MedicalRecords`

Append-oriented clinical history entries, including consultation notes, prescription data, timeline events, and file metadata references.

### 15.5 `Consents`

Patient-to-doctor authorization contracts with scope and expiry windows used in request-time access decisions.

### 15.6 `EmergencyContacts`

Mappings between patients and approved emergency contacts with role-bound emergency retrieval constraints.

### 15.7 `AuditLogs`

Immutable activity trail records with actor, action, target, time, IP, and context metadata.

## 16. Middleware Architecture and Ordering

A practical middleware chain should preserve defense-in-depth:

1. security headers and CORS controls
2. rate limiting
3. authentication parsing and token verification
4. RBAC role checks
5. consent or emergency scope checks (where applicable)
6. payload/file validators
7. controller execution
8. centralized error handling

Ordering matters because early rejection reduces attack surface and resource usage.

## 17. Services Layer Architecture

Services should own:

- business decisions for consent eligibility
- emergency data shaping rules
- append-only record mutation policy
- audit event creation orchestration
- file metadata to path coherence checks
- token lifecycle support logic

This prevents policy drift caused by duplicating sensitive rules in route-level code.

## 18. Validators Architecture

Validators establish input integrity contracts before domain logic execution. They should be explicit per endpoint class:

- auth validators for OTP and token flow payloads
- consent validators for scope/time windows
- record validators for structured medical entries
- upload validators for file + metadata alignment

Strong validation narrows attack vectors and improves predictability in error handling.

## 19. Security Architecture

### 19.1 Credential and Token Security

- password hashing with bcrypt where password artifacts exist
- JWT access tokens with refresh token strategy
- token verification at every protected boundary

### 19.2 Data Protection Controls

- AES-256 encryption for sensitive fields where required by policy
- strict handling of sensitive identifiers; avoid storing complete high-risk identity artifacts

### 19.3 API Surface Hardening

- helmet-based security headers
- CORS policy control
- request rate limiting to mitigate brute force and abuse

### 19.4 File Access Security

- no direct public browsing of uploads
- authorization before every file stream
- deterministic path resolution from trusted metadata

### 19.5 Why Local Storage Needs Strict Protection

Local disk is part of production attack surface. Without strict directory permissions, path controls, and API-mediated access, report artifacts become vulnerable to unauthorized reads, traversal attempts, or accidental exposure.

## 20. Error Handling Architecture

Centralized error handling should normalize response format, preserve client-safe messages, and prevent sensitive stack/internal leakage. Domain services should raise typed errors; controllers/middleware translate them into consistent HTTP semantics.

Audit-relevant failures (such as denied access attempts) should still produce audit entries where policy requires visibility.

## 21. Logging Strategy Beyond Audit Logs

Operational logging should coexist with audit logging but remain distinct in purpose.

- audit logs: security and compliance traceability
- application logs: diagnostics, performance visibility, error triage

Separation avoids mixing forensic records with noisy runtime telemetry while preserving both observability tracks.

## 22. API Versioning Strategy

Versioned route namespaces should isolate future contract changes and enable backward compatibility planning. Versioning avoids disruptive interface drift and allows iterative hardening of consent or emergency policy representations without breaking existing clients.

## 23. Environment Variables and Configuration Boundaries

Sensitive and environment-specific settings should be externalized via environment variables, including:

- JWT secrets and token expiry policy controls
- encryption keys
- database connection settings
- OTP provider settings
- rate limit configuration
- upload directory roots and size limits

This preserves secure configuration management and avoids hardcoded secrets.

## 24. Background Jobs and Deferred Work

Background processing is valuable for non-blocking tasks that should not delay synchronous API responses, such as:

- notification dispatch for emergency access events
- periodic consent-expiry housekeeping
- log archival workflows

Job execution should remain policy-aware and auditable when handling security-relevant events.

## 25. Backend Scaling Considerations

Scaling should preserve security guarantees while improving throughput:

- maintain stateless JWT-protected API nodes
- ensure shared understanding of upload root strategy when scaling across instances
- preserve consistent audit write behavior under load
- index consent and audit collections for request-time authorization and timeline queries

When scaling local file storage, architecture must ensure that all nodes can securely resolve referenced files without bypassing policy checks.

## 26. File Organization Strategy as an Architectural Control

File organization is not only operational hygiene; it is a security and maintainability decision. Structuring local directories by patient and resource type improves:

- authorization reasoning
- data lifecycle operations
- traceability across metadata and disk
- incident response containment

## 27. Why Medical Records Should Not Be Directly Editable

Direct in-place edits of historical medical entries can erase factual chronology and weaken medico-legal reliability. Append-only progression preserves clinical timeline truth, supports transparent correction patterns, and strengthens audit coherence.

## 28. Integrated Flow: How Authentication, RBAC, Consent, Emergency Access, Audit, and File Storage Work Together

The complete backend design is an orchestrated policy chain:

1. actor authenticates through OTP + JWT flow.
2. request enters protected route.
3. RBAC establishes role-level capability boundary.
4. consent or emergency policy determines patient-data eligibility.
5. service executes permitted operation on records and/or local file metadata.
6. if file content is requested, backend maps authorized metadata to local disk and securely streams content.
7. audit event records action details, context, timestamp, and IP.
8. patient-facing transparency is enabled through audit log visibility, and emergency attempts trigger notification workflows.

This integrated path guarantees that identity alone never bypasses consent logic, emergency mode remains tightly scoped, and local file artifacts remain protected by server-side access controls at all times.

## 29. Development Phase Alignment (Architectural Evolution)

The recommended phased progression maps naturally to backend hardening:

- Phase 1: auth, role model, foundational dashboards and protected route scaffolding
- Phase 2: medical record services + local upload pipeline
- Phase 3: consent contracts and request-time consent enforcement
- Phase 4: emergency-limited access pathways and notification hooks
- Phase 5: comprehensive audit log exposure and governance workflows

This sequence prioritizes secure identity and policy enforcement before broadening data interaction surfaces.

## 30. Final Architectural Position

The backend architecture is defined by controlled trust boundaries, patient-governed authorization, immutable-style clinical history, locally secured report storage, and pervasive auditability. The system’s resilience depends on preserving these boundaries consistently across routes, services, middleware, data models, and file subsystem operations. Any future extension should be evaluated against these same principles to avoid eroding the security and consent guarantees that form the foundation of the platform.
