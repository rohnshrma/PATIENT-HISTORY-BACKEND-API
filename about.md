# About This Project

## Project Goal

This project is a backend API for a patient history system where the patient remains in control of medical data access.

The core goal is to build a secure, auditable, and practical foundation for:
- patient-owned medical history timelines
- consent-based doctor access (not blanket role access)
- emergency access with strict scope limits
- append-only clinical records for traceability
- local report storage with patient-based organization

In short, authentication proves identity, but authorization is enforced at the patient level.

## Reason Behind It

Traditional healthcare systems often give broad access once a user has a clinical role. That model can weaken patient privacy and reduce transparency.

This backend is designed to solve that by making patient consent central to access decisions. A doctor can be verified as a doctor, but still cannot access a specific patient’s records without active consent from that patient.

The project also addresses real-world safety and trust needs:
- emergency contacts can access only critical, limited data during emergencies
- every sensitive action can be tracked through audit logs
- historical medical entries remain immutable to preserve record integrity

The reason behind this architecture is simple: improve care collaboration without sacrificing privacy, control, or accountability.
