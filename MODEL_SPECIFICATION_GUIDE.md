# Model Specification Guide

## 1. Purpose of This Document

This document defines what each backend model should contain for the medical history application. It focuses on structure, data ownership, relationships, and security-sensitive fields so that model design stays consistent with patient-controlled access, consent-based authorization, emergency scope limitations, append-only records, auditability, and local file storage metadata strategy.

This guide covers the following collections:

- `Users`
- `Patients`
- `Doctors`
- `MedicalRecords`
- `Consents`
- `EmergencyContacts`
- `AuditLogs`

## 2. `Users` Model

### 2.1 Role in the System

`Users` is the identity anchor model. It represents authentication-level entities and holds role identity used by RBAC and downstream domain models.

### 2.2 Core Data It Should Contain

- unique user identifier
- role (`patient`, `doctor`, `emergency_contact`, `admin`)
- login identity fields (based on chosen auth channel)
- account status flags (active/blocked/suspended if used)
- authentication lifecycle metadata (last login, token/session-related status markers)
- created and updated timestamps

### 2.3 Security-Sensitive Data Considerations

- store only required identity data
- avoid storing complete high-risk identity identifiers unnecessarily
- if password artifacts exist, store only hashed values
- never store OTP values in plaintext long-term

### 2.4 Relationships

- one user may map to one patient profile
- one user may map to one doctor profile
- one user may map to one emergency contact role identity
- admin users may not require patient/doctor profile mapping

## 3. `Patients` Model

### 3.1 Role in the System

`Patients` contains patient domain profile data required for medical timeline ownership, consent governance, emergency data exposure, and report storage partitioning.

### 3.2 Core Data It Should Contain

- patient identifier
- reference to owning `Users` identity
- profile attributes required by the app’s medical context
- emergency-critical fields used in emergency mode responses:
  - blood group
  - allergies
  - chronic diseases
  - current medications
- optional contact metadata needed by patient-facing workflows
- created and updated timestamps

### 3.3 Access and Control Rules

- patient is primary controller of consent grants
- patient-linked records and consents are keyed by patient id
- emergency responses should expose only approved emergency-safe fields

### 3.4 Relationships

- one patient has many medical records
- one patient has many consent entries
- one patient has many emergency contact mappings
- one patient has many audit log references as target

## 4. `Doctors` Model

### 4.1 Role in the System

`Doctors` stores doctor domain profile details used for consultation attribution and consent-linked access control.

### 4.2 Core Data It Should Contain

- doctor identifier
- reference to owning `Users` identity
- professional profile attributes required by the product scope
- status fields if doctor account lifecycle gating is needed
- created and updated timestamps

### 4.3 Access Rule Reminder

Doctor authentication confirms identity only. Authorization to view a patient’s records requires a separate active consent entry.

### 4.4 Relationships

- one doctor can appear in many consent records
- one doctor can author or be associated with many medical record entries
- one doctor can appear as actor in many audit log events

## 5. `MedicalRecords` Model

### 5.1 Role in the System

`MedicalRecords` is the clinical timeline collection. It stores append-only patient history events including consultations, prescriptions, and report metadata references.

### 5.2 Core Data It Should Contain

- record identifier
- patient reference (required)
- creator/author reference (patient or doctor actor context)
- record type/classification (consultation, prescription, report attachment, etc. based on project scope)
- structured medical content fields for timeline events
- file metadata block for uploaded reports when applicable:
  - stored filename (server-generated)
  - original filename (optional display usage)
  - MIME type
  - file size
  - local relative storage path
- append-only lifecycle markers (for correction chaining if used)
- event timestamp (clinical event time)
- created and updated timestamps

### 5.3 Append-Only Behavior

- records should not be destructively rewritten
- corrections should be represented as additive follow-up entries
- historical entries remain preserved for traceability

### 5.4 Relationships

- many records belong to one patient
- records may reference doctor actor when doctor-created
- records may be accessed under consent or emergency rules depending on endpoint scope

## 6. `Consents` Model

### 6.1 Role in the System

`Consents` defines patient-approved doctor access contracts and is central to authorization beyond RBAC.

### 6.2 Core Data It Should Contain

- consent identifier
- patient reference
- doctor reference
- scope definition (what data/actions are allowed)
- grant timestamp
- expiry timestamp
- active/revoked status markers
- revoke metadata (revoked at/by, if tracked)
- created and updated timestamps

### 6.3 Authorization Use

Every doctor access request for patient-specific protected resources should be checked against `Consents` for:

- matching patient
- matching doctor
- active status
- non-expired validity window
- scope compatibility with requested action

### 6.4 Why Expiry Fields Are Mandatory

Expiry enforces time-bounded access and prevents old permissions from turning into silent indefinite authorization.

## 7. `EmergencyContacts` Model

### 7.1 Role in the System

`EmergencyContacts` maps approved emergency actors to patients and supports emergency-mode authorization.

### 7.2 Core Data It Should Contain

- emergency contact mapping identifier
- patient reference
- emergency contact user reference
- relationship metadata (if captured)
- status flag (active/inactive)
- created and updated timestamps

### 7.3 Access Scope Responsibility

This model does not grant full history access. It only enables entry into emergency-limited endpoints where output is field-filtered to critical health information.

### 7.4 Relationships

- one patient can have multiple emergency contacts
- one emergency contact may be linked to multiple patients where policy allows

## 8. `AuditLogs` Model

### 8.1 Role in the System

`AuditLogs` is the accountability ledger for sensitive backend actions and access attempts.

### 8.2 Core Data It Should Contain

- audit event identifier
- actor reference (who performed action)
- actor role at action time
- target patient/resource reference
- action type
- action context/details summary
- result status (success/denied/failure)
- source IP address
- request timestamp
- optional route/module context

### 8.3 Events That Should Be Logged

- authentication-sensitive actions
- consent grant/revoke events
- medical record read/write actions
- emergency access attempts
- file upload and file access streaming events
- denied authorization attempts for protected resources

### 8.4 Integrity Expectations

Audit records should be treated as append-oriented operational evidence. Application users should not be able to modify historical audit entries.

## 9. Cross-Model Relationship Map

High-level relationship directions:

- `Users` -> `Patients` (one-to-one where role is patient)
- `Users` -> `Doctors` (one-to-one where role is doctor)
- `Patients` -> `MedicalRecords` (one-to-many)
- `Patients` -> `Consents` (one-to-many)
- `Doctors` -> `Consents` (one-to-many)
- `Patients` -> `EmergencyContacts` (one-to-many mappings)
- `Users`/`Patients`/`Doctors` -> `AuditLogs` (actor/target references across many events)

## 10. Local File Storage Metadata Rules in Models

Physical report files are stored locally on server disk. Models store only metadata and path references.

Metadata fields should support:

- identifying the owning patient
- locating the file in local storage safely
- validating content-type and size at retrieval/policy checks
- linking upload events to timeline entries and audits

The actual binary file must never be stored as a public URL dependency in this architecture.

## 11. Indexing Priorities (Model-Level Performance)

To keep authorization and timeline queries efficient, prioritize indexes for:

- patient + event timestamp on `MedicalRecords`
- patient + doctor + active + expiry on `Consents`
- patient + timestamp on `AuditLogs`
- patient references on `EmergencyContacts`

These indexes directly support frequent request-time checks and patient dashboard views.

## 12. Data Governance Notes by Model

- `Users`: minimal identity surface, strong auth hygiene
- `Patients`: controlled exposure; emergency fields separated conceptually from full history
- `Doctors`: identity and attribution, not blanket patient data rights
- `MedicalRecords`: append-only timeline integrity
- `Consents`: explicit, scoped, expiring access contracts
- `EmergencyContacts`: relationship-based limited emergency pathway
- `AuditLogs`: immutable accountability trail

## 13. Final Model Design Principle

Every model should be evaluated by one question: does this field or relation strengthen secure, patient-controlled, auditable access?

If a field does not serve clinical timeline integrity, authorization accuracy, emergency safety, or accountability, it should not be added by default.
