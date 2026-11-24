---
name: external_tools_integration
description: DOCAI, IVNEOS, IVSIGN integration with Therefore™ — functions, capabilities, use cases
metadata:
  type: reference
---

# External Tools: DOCAI, IVNEOS, IVSIGN

Three external solutions that integrate with Therefore™ for document management:

---

## 1. DOCAI — Document Classification & Data Extraction

### What It Does
**Universal solution for any project requiring automated document processing:**
- **Traditional ML** for document classification
- **Generative AI** for semantic data extraction  
- **Multi-format support** (PDF, images, scans)
- **Language-agnostic**: Works with any document type, any sector

**Key Insight**: DOCAI is relevant to ANY Therefore project with document volumes that need:
- Automatic type identification
- Field extraction (dates, amounts, names, references)
- Metadata generation
- Intelligent routing based on content

### Architecture
```
Ingestion → Preprocessing → ML Classification → Generative AI Extraction → Integration
```

### Key Components
- **Ingestion Module**: Normalization, error handling, logging
- **Classification Engine**: ML-based document type identification, accuracy metrics
- **Extraction Module**: Generative AI (semantic + contextual processing), field mapping, personalization
- **Integration Layer**: OAuth2/JWT auth, HTTP/message queues, error handling, circuit breakers

### Capabilities (for Therefore integration)
- Automatic document classification before entering Therefore
- Field extraction → map to Therefore index fields
- Metadata generation → populate Therefore document properties
- Parallel processing for high-volume scenarios
- API access for custom integration
- Compliance: GDPR, HIPAA support

### Performance & Security
- Load testing methodologies built-in
- Horizontal/vertical scaling strategies
- Data encryption at rest & in transit
- Audit logging of all operations

### Use Case: NNEE (Notificaciones Electrónicas)
Integration between IVNEOS (notification download) → DOCAI (classification/extraction) → Therefore (storage/workflow)
- Identifies notification type (tax, legal, administrative)
- Extracts key data (dates, amounts, actions required)
- Routes to appropriate Therefore category based on type

---

## 2. IVNEOS — Electronic Notification Management

### What It Does
Centralized management of electronic notifications from Spanish Public Administration (AAPP).
Required by Law 39/2015 (LPAC) — all Spanish organizations must communicate with admin electronically.

### Architecture
Synchronizes with multiple notification platforms (different government agencies) → unified inbox

### Key Capabilities

**Notification Management**
- Monitor notifications from AAPP across multiple locations
- Automated download from government buzones
- Centralized inbox for all agency notifications
- Metadata extraction from notifications
- Multi-enterprise support (handle multiple company CIFs)

**Distribution & Automation**
- User profiles with different permission levels (synchronizer, downloader, manager)
- Automatic routing rules based on:
  - Origin/agency
  - Notification type
  - CIF/company
  - Event triggers (sync, download, deadline)
  - Custom criteria
- Automated actions: status change, download, assign manager, email alert, custom handlers

**Key Features**
- Unified access to: Tax Agency (AEAT), Social Security, TEU-BOE (edictal bulletin), Local/Regional agencies
- Certificate management: configure multiple digital certificates per CIF
- Audit trail of all notifications (read, downloaded, resolved)
- Desktop notification tracking (pending, read-not-downloaded, downloaded)
- Optional: Electronic submission to Government (REC module)

**Security**
- Centralized certificate management
- Secure verification of notification availability
- User permission controls (read-only, manager, admin roles)
- Audit logging of all operations

**Integration Capabilities**
- API for external application consumption
- Document management system integration (save to expedient system)
- Custom integration with additional government platforms
- Automatic routing to Therefore workflows

### Use Case: Therefore Integration
1. IVNEOS downloads notification from government
2. Extracts: notification type, sender, date, deadline, subject
3. Passes metadata + document to Therefore via API
4. Therefore categorizes and assigns to workflow based on IVNEOS metadata

---

## 3. IVSIGN — Centralized Digital Certificate Management

### What It Does
Centralized storage and management of digital certificates for electronic signatures.
- No hardware/tokens required at user workstations
- Certificates accessible from any device
- Control signature usage and auditing

### Architecture
Cloud-based key storage system for certificates (P12/PFX format)
- Admin console (web-based)
- User interface for signature operations
- Integration drivers for applications

### Key Components

**Admin Console** (administrators & super-administrators)
- Organization management (data, users, certificate inventory)
- User management: add/remove, enable/disable, certificate assignment
- Certificate management: import, status, permissions, rotation, deletion
- Rules engine: define usage policies
- Device authorization control
- Reporting: usage by user/certificate/app/hour/weekday/operation type
- Full audit trail: date, operator, user, operation, certificate serial, hash, app, result, IP, URL, module

**User Panel**
- Sign documents from web applications or government platforms
- No local certificate installation needed
- Multi-device access with same certificate
- Authenticated access to personal certificates

### Signature Capabilities
- **Individual signatures**: Employee signs with personal certificate
- **Organizational signatures**: Legal entity certificates with strict access control
- **Multi-credential authentication**: For qualified signatures
- **eIDAS compliant**: Signaturit is Qualified Trust Service Provider (QTSP) per eIDAS

### Integration Features
- **Active Directory / LDAP / SAML / ADFS** federation support
- **PKI**: Direct certificate issuance into centralized storage
- **API**: Integration with document workflows
- **Driver (KeyController)**: Instant key activation in applications

### Use Case: Therefore + Electronic Workflows
1. Workflow reaches signature stage in Therefore
2. System calls IvSign API with document hash
3. User authenticates and approves signature
4. Signature applied with audit trail
5. Signed document returned to Therefore
6. Certificate usage logged in IvSign audit

---

## Integration Pattern: IVNEOS → DOCAI → Therefore

```
Government AAPP
    ↓
[IVNEOS] ← Monitors & downloads notifications
    ↓
    └─ Extracts: sender, type, dates, deadline
    ↓
[DOCAI] ← Classifies notification type (tax/legal/admin)
    ↓
    └─ Extracts key data fields → structured JSON
    ↓
[Therefore] ← Receives structured data
    ↓
    └─ Creates document in appropriate category
    └─ Populates index fields (dates, amounts, type)
    └─ Routes to workflow based on notification type
    └─ May trigger IvSign for signature if response needed
```

### Real-World Example: Tax Notification
1. AEAT sends tax audit notification to company
2. IVNEOS detects & downloads from government platform
3. DOCAI classifies: "Tax Audit Notice", extracts "deadline: 2026-06-15", "amount: €15,000"
4. Therefore creates document in "Auditorías" category with index fields populated
5. Workflow auto-assigns to finance manager based on extracted data
6. Manager reviews → routes to legal team for response preparation
7. Response drafted, signed via IvSign (with full audit trail)
8. Signed response submitted back to AEAT through IVNEOS

---

## Data Exchange Formats

### IVNEOS → DOCAI
- Document file (PDF/image) + metadata: sender agency, receipt date, reference number
- Optional: original notification message structure

### DOCAI → Therefore
- JSON structured data (extracted fields)
- Classification result (document type)
- Confidence scores
- Document binary (if needed in Therefore)

### Therefore → IvSign
- Document hash (SHA256)
- Signature request metadata: user identifier, operation type
- Return: signature block in CMS format

### Internal Therefore Integration
- Index fields mapped from extracted data
- Document routing rules based on classification
- Workflow triggers based on extracted dates/deadlines

---

## When to Mention in Project Documents

### In Analysis/EFDT:

**DOCAI** — Consider for ANY project involving:
- High-volume document ingestion (100+ documents/month)
- Multiple document types needing automatic routing
- Complex data extraction from unstructured documents
- Scanning + OCR + classification workflow
- Compliance/audit document management
- Any project wanting to reduce manual data entry

**IVNEOS** — Mention when:
- Notifications from Spanish government (AAPP) are involved
- Law 39/2015 (LPAC) compliance needed
- Tax/legal/administrative processes

**IvSign** — Suggest when:
- Electronic signatures required in workflow
- Qualified signatures (eIDAS) needed
- Multi-user certificate management
- Audit trail of signature operations required

### In Estimation:
- **DOCAI integration**: ~3-10 days depending on:
  - Complexity of document types (3-5 types = 3 days, 10+ types = 8-10 days)
  - Field extraction complexity (simple = 3 days, complex = 7+ days)
  - Testing & model tuning (2-3 days minimum)
  - **Consider this for ANY project with high-volume document ingestion**
- **IVNEOS integration**: ~2-5 days (API setup, workflow rules, testing)
- **IvSign integration**: ~2-4 days (signature workflow, audit setup)

### In Presupuesto:
- Licensing/services for each tool (typically per-user or per-document-processed)
- Integration effort as separate line items
- Training for end-users on new tools

### In Requirement Docs:
- External tool dependencies and SLAs
- User authentication requirements (certificates, AD federation)
- Data security/encryption in transit to external services
- Audit/compliance requirements

---

## Key Differentiators

### IVNEOS
- **Gov-specific**: Only for Spanish AAPP notifications
- **Compliance-driven**: Required by law
- **Multi-platform**: Connects to Tax Agency, SS, Regional orgs

### DOCAI
- **AI-powered**: Generative AI for context-aware extraction
- **Universal**: Any document type, not gov-specific
- **Flexible**: Custom field mapping to any system (Therefore or others)

### IvSign
- **Signature-specific**: Not for authentication alone
- **eIDAS compliant**: Meets EU qualified signature standards
- **Centralized**: No local token/smartcard required

---

## Signaturit Contact
All three tools are Signaturit products/partnerships:
- **Website**: www.signaturit.com
- **Email**: info@signaturit.com
- **Offices**: Paris, Barcelona, Valencia
- **Phone**: +34 96 003 12 03

Single vendor = smoother integration across all three tools.
