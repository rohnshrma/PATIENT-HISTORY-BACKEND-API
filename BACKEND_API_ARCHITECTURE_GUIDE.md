# Backend API Architecture Guide (Beginner-Friendly)

## 1. What This Backend Is Trying to Solve

This backend is built for a medical history app where the **patient stays in control** of their data.

Main goals:

- keep medical data private and secure
- allow doctors to access records only with patient consent
- allow emergency contacts to see only critical health details
- track every important access in audit logs
- store medical files locally on the server (not on cloud storage)

This means login alone is never enough to view all patient data.

## 2. Core Backend Stack

- **Runtime/API:** Node.js + Express
- **Database:** MongoDB (with Mongoose)
- **Authentication:** OTP + JWT
- **Authorization:** RBAC + consent checks + emergency scope checks
- **File storage:** local server filesystem (`uploads/`)

## 3. High-Level Backend Modules

The backend has multiple modules that work together:

- Auth Module
- Consent Module
- Medical Records Module
- Emergency Access Module
- Audit Log Module
- Upload/File Access Module

Together, these modules decide:

- who you are (authentication)
- what your role can do (RBAC)
- whether this specific patient allowed access (consent)
- whether emergency-only limited access applies
- what gets logged for accountability

## 4. Suggested Folder Structure and Purpose

- `routes/`: API endpoint definitions
- `controllers/`: request/response handlers
- `services/`: business logic and rules
- `models/`: MongoDB schemas
- `middleware/`: auth, RBAC, consent, security checks
- `validators/`: request data validation
- `utils/`: shared helper functions (tokens, encryption helpers, etc.)
- `uploads/`: local file storage and upload handling

Why this separation matters:

- easier to maintain
- easier to test
- security logic stays consistent
- less chance of mixing critical rules inside random files

## 5. Complete Request Lifecycle

A typical protected request follows this flow:

1. Request hits a route.
2. Middleware checks security headers/rate limits.
3. JWT authentication middleware verifies identity.
4. RBAC middleware checks user role.
5. Consent/emergency middleware checks patient-level permissions.
6. Validator checks request format.
7. Controller calls service layer.
8. Service reads/writes MongoDB and local files (if needed).
9. Audit log is recorded.
10. Response is returned.

This layered flow prevents unsafe direct access.

## 6. Authentication: OTP + JWT Flow

### Step-by-step

1. User starts login.
2. OTP is generated and sent.
3. User submits OTP.
4. Backend verifies OTP and validity window.
5. On success, backend issues JWT access token (and refresh strategy if used).
6. Client sends JWT in future requests.
7. Middleware verifies JWT for protected routes.

Why this is useful:

- stronger than simple password-only patterns
- short-lived access tokens reduce risk
- easier to secure sessions

## 7. RBAC (Role-Based Access Control)

Roles:

- Patient
- Doctor
- Emergency Contact
- Admin

RBAC sets high-level permissions by role. But RBAC alone is not enough.

Important principle:

- **Doctor login does not automatically give access to all patient records.**

A doctor must also pass consent checks for a specific patient.

## 8. Consent System Flow

Consent is the patient’s permission contract.

Flow:

1. Patient grants consent to a doctor.
2. Consent includes scope + expiry time.
3. Doctor requests patient records.
4. Backend checks if consent exists and is still active.
5. Access is allowed or denied.
6. Patient can revoke consent early.
7. Expired consent is automatically invalid.

Why consent expiry matters:

- prevents old permissions from lasting forever
- keeps control with the patient
- reduces long-term exposure risk

## 9. Emergency Access Flow

Emergency contacts only see limited critical info:

- blood group
- allergies
- chronic diseases
- current medications

They must not see:

- private consultations
- sensitive medical history not needed for emergency care

Flow:

1. Emergency contact authenticates.
2. Backend confirms role and emergency relationship.
3. Backend returns only allowed emergency fields.
4. Access attempt is logged.
5. Patient is notified.

## 10. Audit Logging System

Audit log records should include:

- who performed the action
- what resource was accessed
- action type
- timestamp
- IP address
- result/status

Audit everything important:

- record views
- consent grant/revoke
- emergency access attempts
- file access
- sensitive auth events

Why audit logging is critical:

- accountability
- patient transparency
- security investigation support

## 11. Local File Storage Architecture (Mandatory)

Files are stored **locally on the server**, not in cloud storage.

Design rule:

- MongoDB stores file metadata
- actual file binary stays on local disk

Example local structure style:

- `uploads/patients/<patient-id>/reports/`

Optional scaling-friendly structure:

- `uploads/patients/<patient-id>/reports/<year>/<month>/`

Why patient-based folders are useful:

- easier file ownership mapping
- cleaner organization
- better incident isolation

## 12. Upload Validation Flow

When a file is uploaded:

1. Authenticate user.
2. Check role and patient permission.
3. Validate metadata and request body.
4. Validate MIME type (allowlist).
5. Validate file size.
6. Generate unique filename.
7. Save file to local directory.
8. Save metadata in MongoDB.
9. Write audit log entry.

Why MIME validation matters:

- file extensions can be faked
- MIME checks reduce disguised malicious upload risk

Why unique filenames matter:

- avoid collisions/overwrites
- reduce predictability
- prevent accidental replacement of old reports

## 13. Secure File Access Flow

Files should never be publicly exposed from a direct URL.

Secure streaming flow:

1. User requests file through API.
2. Backend authenticates JWT.
3. Backend checks RBAC + consent/emergency policy.
4. Backend loads file metadata from MongoDB.
5. Backend resolves local disk path.
6. Backend streams file if authorized.
7. Backend logs access in audit logs.

Why direct public upload access is dangerous:

- bypasses permission checks
- bypasses consent rules
- bypasses emergency limits
- bypasses audit visibility

## 14. MongoDB Collections and Their Purpose

- `Users`: identity, role mapping, auth-linked account data
- `Patients`: patient profile domain data
- `Doctors`: doctor profile domain data
- `MedicalRecords`: timeline entries, prescriptions, report metadata references
- `Consents`: patient-doctor access permissions with expiry
- `EmergencyContacts`: patient-emergency relationship mapping
- `AuditLogs`: immutable access/action tracking

Why separate collections are recommended:

- better query performance
- cleaner model boundaries
- easier scaling and maintenance

## 15. Middleware Responsibilities

Common middleware responsibilities:

- JWT verification
- RBAC checks
- consent checks
- emergency scope checks
- rate limiting
- CORS policy handling
- security headers (helmet)
- centralized error passing

Good middleware ordering is important because early rejection saves resources and reduces attack surface.

## 16. Services Layer Responsibilities

Services should own business rules, such as:

- consent validity checks
- emergency data filtering
- append-only medical record behavior
- file metadata + disk path coherence
- audit log writing orchestration

This prevents scattered logic across controllers.

## 17. Validators Responsibilities

Validators enforce input correctness before business logic runs.

Validate:

- auth payloads (OTP/token inputs)
- consent payloads (doctor, scope, expiry)
- record payloads
- upload payloads and metadata

Strong validation reduces bugs and security issues.

## 18. Append-Only Medical Records Concept

Medical records should be append-only instead of directly editable.

Meaning:

- old entries remain preserved
- updates are added as new entries/events

Why this matters:

- keeps historical timeline trustworthy
- improves legal/clinical traceability
- aligns with audit-first architecture

## 19. Security Architecture Checklist

- bcrypt for password hashing (where passwords are used)
- JWT + refresh token strategy
- AES-256 concept for sensitive field protection
- rate limiting for abuse resistance
- helmet for security headers
- CORS restrictions
- strict upload validation
- secure local file access only via authorized API

## 20. Environment Variables (Configuration)

Keep sensitive configs in environment variables:

- JWT secrets and token expiry values
- encryption keys
- MongoDB connection URI
- OTP provider settings
- upload directory root path
- max upload file size
- rate limit settings

This avoids hardcoded secrets in source code.

## 21. Error Handling Architecture

Use centralized error handling to:

- return consistent error response format
- avoid leaking internal stack traces
- map business errors to proper HTTP status
- keep client behavior predictable

Denied access attempts should still be auditable when required.

## 22. Logging Strategy

Use two logging streams:

- **Audit logs:** security/compliance/accountability events
- **Application logs:** debugging, performance, runtime errors

Keeping them separate makes investigations clearer.

## 23. Background Jobs (Non-Blocking Tasks)

Useful background tasks:

- emergency access notification dispatch
- consent expiration housekeeping
- log archival/maintenance tasks

These should run without delaying critical API responses.

## 24. API Versioning

Version endpoints (for example, versioned route groups) to:

- avoid breaking clients
- support safe feature evolution
- preserve backward compatibility

## 25. Backend Scaling Considerations

As usage grows:

- keep API nodes stateless for easier horizontal scaling
- ensure all nodes can securely access local file storage strategy
- index frequently queried collections (consents, logs, records)
- keep authorization checks request-time accurate

Scaling must never weaken consent or audit guarantees.

## 26. Why These Decisions Matter Together

This backend is designed so that security controls reinforce each other:

- authentication proves identity
- RBAC limits role-level abilities
- consent controls patient-specific access
- emergency mode gives minimal necessary data only
- local file protection prevents bypass paths
- audit logs create complete accountability

Final result:

- patient remains in control
- doctors get controlled access when authorized
- emergency responders get life-critical minimum data
- every sensitive action is traceable
- medical files stay locally protected on server infrastructure
