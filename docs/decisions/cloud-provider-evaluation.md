# Cloud Provider Evaluation: AWS vs GCP vs Azure

**Date:** January 2026
**Current Stack:** Railway (API) + Vercel (Web/Admin) + Supabase (DB) + Clerk (Auth)
**Goal:** Evaluate migration to a major cloud provider for compliance, private AI, and long-term scalability

---

## Executive Summary

### Critical Requirements (Weighted Heavily)

| Requirement | Current Stack | AWS | GCP | Azure |
|-------------|--------------|-----|-----|-------|
| **🔒 Security Compliance** | ⚠️ Limited | ✅ Best | ✅ Good | ✅ Best |
| **🤖 Private AI (VPC-isolated)** | ❌ None | ✅ Bedrock | ✅ Vertex AI | ✅ Azure OpenAI |
| **📄 Document Processing** | ❌ External APIs | ✅ Textract | ✅ Document AI | ✅ Doc Intelligence |
| **🔐 Data Residency Control** | ⚠️ Limited | ✅ Full | ✅ Full | ✅ Full |

### Full Comparison

| Factor | Current Stack | AWS | GCP | Azure |
|--------|--------------|-----|-----|-------|
| **Compliance Certs** | SOC2 (vendor) | 143+ | 100+ | 100+ |
| **Private AI Models** | ❌ | Claude, Llama, Titan | Gemini, Claude, Llama | GPT-4, Claude |
| **VPC/Private Networking** | ❌ | ✅ PrivateLink | ✅ VPC-SC | ✅ Private Endpoints |
| **Document OCR/Processing** | ❌ | Textract | Document AI | Doc Intelligence |
| **Monthly Cost (Est.)** | ~$150-300 | ~$300-600 | ~$280-500 | ~$320-600 |
| **Migration Effort** | N/A | High (6-8 weeks) | Medium (5-6 weeks) | High (6-8 weeks) |
| **Best For** | MVPs | **Compliance-first** | Developer-friendly | Microsoft shops |

### Updated Recommendation

Given your requirements for **security compliance** and **private AI processing**, migration to a major cloud provider is now justified.

**🏆 Recommended: AWS**

AWS is the best choice when compliance and private AI are top priorities:
1. **Most compliance certifications** (HIPAA, SOC2, FedRAMP, PCI-DSS, ISO 27001)
2. **AWS Bedrock** provides Claude, Llama, and other models entirely within your VPC
3. **Textract** for document processing stays within your network boundary
4. **S3 with SSE-KMS** for encrypted document storage with customer-managed keys
5. **Most enterprises already trust AWS** - easier sales conversations

**Runner-up: Azure** (if you need GPT-4 specifically or have Microsoft enterprise agreements)

---

## Current Infrastructure Analysis

### What You're Running

| Service | Provider | Purpose | Monthly Cost (Est.) |
|---------|----------|---------|---------------------|
| Web App | Vercel Pro | TanStack Start frontend | $20 + usage |
| Admin App | Vercel Pro | Admin dashboard | Included |
| API | Railway | Hono Node.js server | $5-50 |
| Database | Supabase Pro | PostgreSQL + Auth fallback | $25+ |
| Auth | Clerk | User authentication | $25+ |
| **Total** | | | **~$75-150 base** |

### External Service Dependencies (Keep Regardless of Cloud)

These integrations work with any cloud provider:
- **Stripe** - Payments (webhook-based)
- **Resend** - Email delivery
- **Mapbox** - Maps
- **Plaid** - Banking
- **RentCast/ATTOM** - Property data
- **PostHog** - Analytics

### Current Architecture Strengths

1. **Simple deployment** - Git push → automatic deploy
2. **Zero infrastructure management** - No servers to patch
3. **Built-in scaling** - Vercel serverless, Railway containers
4. **Fast iteration** - Deploy in minutes, not hours
5. **Low operational overhead** - 1-2 person team can manage

### Current Architecture Weaknesses

1. **Multi-vendor complexity** - 4 different dashboards/billing
2. **Limited customization** - Can't tune infrastructure deeply
3. **Cost unpredictability** - Usage-based pricing can spike
4. **No private networking** - All services communicate over public internet
5. **Vendor dependency** - Railway/Vercel-specific configurations

---

## Cloud Provider Comparison

### AWS (Amazon Web Services)

#### Equivalent Services

| Current | AWS Equivalent | Notes |
|---------|---------------|-------|
| Vercel | **AWS Amplify** or **CloudFront + S3 + Lambda** | Amplify is simpler but less flexible |
| Railway | **ECS Fargate** or **App Runner** | App Runner is simpler, Fargate is more powerful |
| Supabase | **RDS PostgreSQL** + **Cognito** | Or Aurora Serverless for auto-scaling |
| Clerk | **Cognito** or keep Clerk | Cognito is cheaper but less polished |

#### AWS Architecture Option 1: Serverless (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  CloudFront  │  │  CloudFront  │  │  API Gateway │  │
│  │  (Web CDN)   │  │  (Admin CDN) │  │  + Lambda    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐  │
│  │   S3 + SSR   │  │   S3 + SSR   │  │   Lambda     │  │
│  │  (Amplify)   │  │  (Amplify)   │  │  (Hono API)  │  │
│  └──────────────┘  └──────────────┘  └──────┬───────┘  │
│                                             │          │
│                    ┌────────────────────────┼───────┐  │
│                    │         VPC            │       │  │
│                    │  ┌─────────────────────▼────┐  │  │
│                    │  │   RDS PostgreSQL         │  │  │
│                    │  │   (or Aurora Serverless) │  │  │
│                    │  └──────────────────────────┘  │  │
│                    └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### AWS Architecture Option 2: Containers

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud                            │
│  ┌──────────────┐                   ┌──────────────┐   │
│  │     ALB      │                   │  CloudFront  │   │
│  │ (Load Bal.)  │                   │  (Static)    │   │
│  └──────┬───────┘                   └──────┬───────┘   │
│         │                                  │           │
│  ┌──────▼───────────────────────────┐     │           │
│  │         ECS Fargate              │     │           │
│  │  ┌─────────┐  ┌─────────┐       │     │           │
│  │  │   Web   │  │   API   │       │     │           │
│  │  │ Service │  │ Service │       │     │           │
│  │  └─────────┘  └─────────┘       │     │           │
│  └──────────────────┬───────────────┘     │           │
│                     │                      │           │
│         ┌───────────▼──────────────────────▼────┐     │
│         │              VPC                       │     │
│         │  ┌────────────────┐  ┌─────────────┐  │     │
│         │  │ RDS PostgreSQL │  │ ElastiCache │  │     │
│         │  └────────────────┘  │   (Redis)   │  │     │
│         │                      └─────────────┘  │     │
│         └───────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### AWS Cost Estimate (Monthly)

| Service | Specification | Cost |
|---------|--------------|------|
| Amplify Hosting | 2 apps, SSR | $15-30 |
| App Runner / ECS | 1 vCPU, 2GB RAM | $30-60 |
| RDS PostgreSQL | db.t4g.micro, 20GB | $15-25 |
| CloudFront | 100GB transfer | $10-15 |
| Route 53 | 2 hosted zones | $1 |
| Secrets Manager | 10 secrets | $4 |
| CloudWatch | Basic monitoring | $5-10 |
| **Total** | | **$80-145** |

*Add 50-100% for production redundancy (multi-AZ, backups)*

#### AWS Pros
- Industry standard, massive ecosystem
- Most job candidates know AWS
- Best for compliance (HIPAA, SOC2, FedRAMP)
- Deepest feature set for any use case
- Strong enterprise support options

#### AWS Cons
- Steepest learning curve
- Complex pricing, easy to overspend
- Many services to wire together
- Heavy operational overhead without DevOps expertise
- Vendor lock-in with AWS-specific services

---

### GCP (Google Cloud Platform)

#### Equivalent Services

| Current | GCP Equivalent | Notes |
|---------|---------------|-------|
| Vercel | **Cloud Run** or **Firebase Hosting** | Cloud Run handles SSR natively |
| Railway | **Cloud Run** | Same service for web + API |
| Supabase | **Cloud SQL** + **Firebase Auth** | Or keep Supabase (runs on GCP) |
| Clerk | **Firebase Auth** or keep Clerk | Firebase Auth is free tier friendly |

#### GCP Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                    GCP Cloud                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Cloud Load Balancing                 │  │
│  │         (Global HTTP(S) Load Balancer)           │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │                  Cloud Run                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │   Web   │  │  Admin  │  │   API   │          │  │
│  │  │ Service │  │ Service │  │ Service │          │  │
│  │  └─────────┘  └─────────┘  └─────────┘          │  │
│  │       (Auto-scaling, serverless containers)      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │              VPC (Private Network)                │  │
│  │  ┌────────────────┐  ┌─────────────────────────┐ │  │
│  │  │  Cloud SQL     │  │  Memorystore (Redis)    │ │  │
│  │  │  PostgreSQL    │  │  (Optional - caching)   │ │  │
│  │  └────────────────┘  └─────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### GCP Cost Estimate (Monthly)

| Service | Specification | Cost |
|---------|--------------|------|
| Cloud Run | 3 services, 1 vCPU, 1GB each | $20-50 |
| Cloud SQL | db-f1-micro, 10GB | $10-20 |
| Cloud Load Balancing | 1 forwarding rule | $18 |
| Cloud Storage | 10GB | $0.26 |
| Secret Manager | 10 secrets | $0.60 |
| Cloud Logging | Basic | $0-5 |
| **Total** | | **$50-95** |

*Add 30-50% for production setup*

#### GCP Pros
- **Cloud Run is excellent** - Best container-to-production experience
- Simpler pricing than AWS
- Strong Kubernetes ecosystem (GKE) if needed later
- Firebase integration for mobile
- Supabase already runs on GCP (easier migration)
- Better developer experience overall

#### GCP Cons
- Smaller market share than AWS
- Fewer compliance certifications
- Google's history of killing products (though GCP is strategic)
- Smaller partner ecosystem
- Less enterprise sales/support presence

---

### Azure (Microsoft Azure)

#### Equivalent Services

| Current | Azure Equivalent | Notes |
|---------|-----------------|-------|
| Vercel | **Azure Static Web Apps** or **App Service** | Static Web Apps is serverless |
| Railway | **Azure Container Apps** | Similar to Cloud Run |
| Supabase | **Azure Database for PostgreSQL** | Flexible Server option |
| Clerk | **Azure AD B2C** or keep Clerk | B2C is enterprise-focused |

#### Azure Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Cloud                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Azure Front Door                     │  │
│  │              (Global CDN + WAF)                   │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │            Azure Container Apps                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │   Web   │  │  Admin  │  │   API   │          │  │
│  │  └─────────┘  └─────────┘  └─────────┘          │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                              │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │                    VNet                           │  │
│  │  ┌────────────────┐  ┌─────────────────────────┐ │  │
│  │  │ PostgreSQL     │  │  Azure Cache for Redis  │ │  │
│  │  │ Flexible Server│  │  (Optional)             │ │  │
│  │  └────────────────┘  └─────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Azure Cost Estimate (Monthly)

| Service | Specification | Cost |
|---------|--------------|------|
| Container Apps | 3 apps, consumption plan | $30-60 |
| Static Web Apps | Standard tier | $9 |
| PostgreSQL Flexible | Burstable B1ms | $15-25 |
| Front Door | Standard tier | $35 |
| Key Vault | 10 secrets | $0.30 |
| Monitor | Basic | $5-10 |
| **Total** | | **$95-140** |

#### Azure Pros
- Best if you use Microsoft 365 / Active Directory
- Strong enterprise agreements (EA discounts)
- Good hybrid cloud story (on-prem + cloud)
- Azure AD B2C for complex enterprise auth
- Strong in regulated industries

#### Azure Cons
- More enterprise-focused, less startup-friendly
- Developer experience lags behind GCP
- Portal/UI is confusing
- Naming conventions are inconsistent
- Less community content for modern stacks (React, Node)

---

## Security & Compliance Comparison

### Why This Matters for Axori

**Target customers:** Real estate investors, families managing properties, landlords scaling portfolios.

You're handling **sensitive financial and personal data**:
- Bank account connections (Plaid)
- Financial documents (receipts, invoices, tax documents)
- Property records and valuations
- Personal information (tenant details, owner info)
- Email communications

Enterprise customers (property management companies, institutional investors) will require:

1. **SOC 2 Type II** - Security controls audit (table stakes for B2B SaaS)
2. **Data residency guarantees** - Data stays in specific regions
3. **Encryption at rest and in transit** - Customer-managed keys preferred
4. **Audit logging** - Who accessed what, when
5. **Access controls** - Role-based, least privilege
6. **Financial data handling** - PCI-DSS awareness (Stripe handles card data, you handle receipts)

**Not required (currently):**
- HIPAA - No healthcare customers expected
- FedRAMP - No government customers
- StateRAMP - No state government customers

*Note: AWS supports all of these if your customer base evolves, but don't over-engineer for them now.*

### Current Stack Compliance Gaps

| Requirement | Current Status | Gap |
|-------------|----------------|-----|
| SOC 2 | Vendor-level only (Vercel, Supabase have SOC2) | Your application layer is not audited |
| Data Residency | Limited control | Supabase region selection, but no guarantees |
| Encryption | TLS + at-rest (provider-managed) | No customer-managed keys (BYOK) |
| Audit Logs | Basic (Clerk, Supabase logs) | No centralized, tamper-proof audit trail |
| Private Networking | ❌ None | All services communicate over public internet |
| Private AI | ❌ Not possible | Financial documents sent to external AI APIs |

### Compliance Certifications by Provider

| Certification | AWS | GCP | Azure | Relevance for Axori |
|---------------|-----|-----|-------|---------------------|
| **SOC 2 Type II** | ✅ | ✅ | ✅ | **HIGH** - Required for enterprise sales |
| **SOC 1 / SSAE 18** | ✅ | ✅ | ✅ | **HIGH** - Financial controls for investor data |
| **ISO 27001** | ✅ | ✅ | ✅ | **HIGH** - Information security baseline |
| **ISO 27018** | ✅ | ✅ | ✅ | **HIGH** - PII protection (tenant/owner data) |
| **GDPR** | ✅ | ✅ | ✅ | **MEDIUM** - If you have EU users |
| **CCPA** | ✅ | ✅ | ✅ | **MEDIUM** - California privacy law |
| **PCI DSS Level 1** | ✅ | ✅ | ✅ | **LOW** - Stripe handles card data |
| **HIPAA BAA** | ✅ | ✅ | ✅ | **FUTURE** - Not needed now |
| **FedRAMP High** | ✅ | ✅ | ✅ | **FUTURE** - Not needed now |
| **Total Certifications** | **143+** | **100+** | **100+** | - |

**All three providers meet your current compliance needs.** AWS has the most certifications if your customer base evolves toward regulated industries.

### Security Features Comparison

| Feature | AWS | GCP | Azure |
|---------|-----|-----|-------|
| **VPC/Private Networking** | VPC + PrivateLink | VPC + VPC Service Controls | VNet + Private Endpoints |
| **Customer-Managed Keys (CMK)** | KMS with BYOK | Cloud KMS with BYOK | Key Vault with BYOK |
| **Hardware Security Modules** | CloudHSM | Cloud HSM | Dedicated HSM |
| **Secrets Management** | Secrets Manager | Secret Manager | Key Vault |
| **WAF (Web Application Firewall)** | AWS WAF | Cloud Armor | Azure WAF |
| **DDoS Protection** | Shield (Standard/Advanced) | Cloud Armor | DDoS Protection |
| **Audit Logging** | CloudTrail | Cloud Audit Logs | Azure Monitor |
| **SIEM Integration** | Security Hub | Security Command Center | Sentinel |
| **Compliance Reporting** | Artifact | Compliance Reports | Trust Center |

### Document Storage Security

For storing tenant documents, emails, and receipts:

| Feature | AWS (S3) | GCP (Cloud Storage) | Azure (Blob Storage) |
|---------|----------|---------------------|---------------------|
| **Server-Side Encryption** | SSE-S3, SSE-KMS, SSE-C | Google-managed, CMEK, CSEK | Microsoft-managed, CMK |
| **Client-Side Encryption** | ✅ SDK support | ✅ SDK support | ✅ SDK support |
| **Object Lock (Immutability)** | ✅ Governance/Compliance modes | ✅ Retention policies | ✅ Immutable storage |
| **Versioning** | ✅ | ✅ | ✅ |
| **Access Logging** | ✅ S3 access logs | ✅ Data access logs | ✅ Diagnostic logs |
| **Cross-Region Replication** | ✅ | ✅ | ✅ |
| **Legal Hold** | ✅ | ✅ | ✅ |

---

## Private AI Processing Capabilities

### Why Private AI Matters

Your requirement: **AI document processing that never leaves your network boundary.**

This rules out:
- ❌ OpenAI API (data sent to OpenAI servers)
- ❌ Anthropic API directly (data sent to Anthropic)
- ❌ Third-party AI SaaS tools (data leaves your control)

What you need:
- ✅ AI models running **inside your VPC/VNet**
- ✅ Data never traverses the public internet
- ✅ No third-party access to customer documents
- ✅ Audit trail of all AI inference requests

### Private AI Options by Provider

#### AWS: Amazon Bedrock (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your AWS VPC                            │
│  ┌───────────────┐    ┌─────────────────────────────────────┐  │
│  │  Your API     │    │         AWS Bedrock                 │  │
│  │  (ECS/Lambda) │───▶│  ┌─────────┐  ┌─────────────────┐  │  │
│  │               │    │  │ Claude  │  │ Llama 3 / Titan │  │  │
│  └───────────────┘    │  │ 3.5/4   │  │                 │  │  │
│         │             │  └─────────┘  └─────────────────┘  │  │
│         │             └─────────────────────────────────────┘  │
│         ▼                            │                         │
│  ┌───────────────┐    ┌──────────────▼──────────────────────┐  │
│  │ S3 (Documents)│    │  AWS Textract (Document Processing) │  │
│  │ Encrypted     │───▶│  - OCR                              │  │
│  │ Customer Keys │    │  - Table extraction                 │  │
│  └───────────────┘    │  - Form parsing                     │  │
│                       └─────────────────────────────────────┘  │
│                                                                 │
│  ════════════════════ VPC BOUNDARY ════════════════════════   │
│              (No data leaves without explicit egress)          │
└─────────────────────────────────────────────────────────────────┘
```

**Available Models via Bedrock:**
| Model | Provider | Best For |
|-------|----------|----------|
| Claude 3.5 Sonnet | Anthropic | General reasoning, document analysis |
| Claude 3 Opus | Anthropic | Complex analysis, high accuracy |
| Llama 3.1 70B/405B | Meta | Open source, cost-effective |
| Amazon Titan | Amazon | Text, embeddings, images |
| Mistral Large | Mistral | European data residency option |
| Cohere Command R+ | Cohere | RAG, enterprise search |

**Key Features:**
- **PrivateLink** - Access Bedrock without internet gateway
- **VPC Endpoints** - Traffic stays within AWS network
- **CloudTrail logging** - Full audit of all inference calls
- **No data retention** - AWS doesn't store your prompts/responses
- **Model customization** - Fine-tune on your data (stays in your account)

**Pricing (Bedrock):**
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Llama 3.1 70B | $2.65 | $3.50 |
| Titan Text | $0.50 | $1.50 |

#### GCP: Vertex AI

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your GCP VPC                            │
│  ┌───────────────┐    ┌─────────────────────────────────────┐  │
│  │  Your API     │    │         Vertex AI                   │  │
│  │  (Cloud Run)  │───▶│  ┌─────────┐  ┌─────────────────┐  │  │
│  │               │    │  │ Gemini  │  │ Claude / Llama  │  │  │
│  └───────────────┘    │  │ 1.5 Pro │  │ (Model Garden)  │  │  │
│         │             │  └─────────┘  └─────────────────┘  │  │
│         │             └─────────────────────────────────────┘  │
│         ▼                            │                         │
│  ┌───────────────┐    ┌──────────────▼──────────────────────┐  │
│  │ Cloud Storage │    │  Document AI                        │  │
│  │ (CMEK)        │───▶│  - OCR (200+ languages)             │  │
│  │               │    │  - Custom document extractors       │  │
│  └───────────────┘    │  - Form parsing                     │  │
│                       └─────────────────────────────────────┘  │
│                                                                 │
│  ════════════════════ VPC-SC BOUNDARY ═════════════════════   │
└─────────────────────────────────────────────────────────────────┘
```

**Available Models via Vertex AI:**
| Model | Provider | Notes |
|-------|----------|-------|
| Gemini 1.5 Pro | Google | Native, best integration |
| Gemini 1.5 Flash | Google | Faster, cheaper |
| Claude 3.5 Sonnet | Anthropic | Via Model Garden |
| Llama 3.1 | Meta | Self-hosted or managed |
| PaLM 2 | Google | Legacy, still available |

**Key Features:**
- **VPC Service Controls** - Data exfiltration prevention
- **Private Google Access** - No public IP needed
- **CMEK** - Customer-managed encryption keys
- **Data residency** - Choose processing region

**Pricing (Vertex AI):**
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Gemini 1.5 Pro | $1.25 | $5.00 |
| Gemini 1.5 Flash | $0.075 | $0.30 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |

#### Azure: Azure OpenAI Service

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Azure VNet                         │
│  ┌───────────────┐    ┌─────────────────────────────────────┐  │
│  │  Your API     │    │      Azure OpenAI Service           │  │
│  │  (Container   │───▶│  ┌─────────┐  ┌─────────────────┐  │  │
│  │   Apps)       │    │  │ GPT-4o  │  │ GPT-4 Turbo     │  │  │
│  └───────────────┘    │  │         │  │                 │  │  │
│         │             │  └─────────┘  └─────────────────┘  │  │
│         │             └─────────────────────────────────────┘  │
│         ▼                            │                         │
│  ┌───────────────┐    ┌──────────────▼──────────────────────┐  │
│  │ Blob Storage  │    │  Azure AI Document Intelligence     │  │
│  │ (CMK)         │───▶│  - OCR                              │  │
│  │               │    │  - Custom models                    │  │
│  └───────────────┘    │  - Pre-built extractors             │  │
│                       └─────────────────────────────────────┘  │
│                                                                 │
│  ════════════════════ VNET BOUNDARY ═══════════════════════   │
└─────────────────────────────────────────────────────────────────┘
```

**Available Models via Azure OpenAI:**
| Model | Provider | Notes |
|-------|----------|-------|
| GPT-4o | OpenAI | Latest multimodal |
| GPT-4 Turbo | OpenAI | 128k context |
| GPT-4 | OpenAI | Original |
| GPT-3.5 Turbo | OpenAI | Fast, cheap |
| Claude (Preview) | Anthropic | Limited availability |

**Key Features:**
- **Private Endpoints** - Access over private network only
- **Customer Managed Keys** - BYOK via Key Vault
- **Content filtering** - Built-in safety controls
- **Data, privacy, security** - Microsoft's enterprise commitments

**Pricing (Azure OpenAI):**
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4 Turbo | $10.00 | $30.00 |
| GPT-3.5 Turbo | $0.50 | $1.50 |

### Document Processing Comparison

| Feature | AWS Textract | GCP Document AI | Azure Doc Intelligence |
|---------|-------------|-----------------|----------------------|
| **OCR Accuracy** | Excellent | Excellent | Excellent |
| **Table Extraction** | ✅ | ✅ | ✅ |
| **Form Parsing** | ✅ | ✅ | ✅ |
| **Invoice Processing** | ✅ Analyze Expense | ✅ Invoice Parser | ✅ Invoice Model |
| **Receipt Processing** | ✅ Analyze Expense | ✅ Receipt Parser | ✅ Receipt Model |
| **Custom Models** | ✅ Custom Queries | ✅ Custom Extractors | ✅ Custom Models |
| **Handwriting** | ✅ | ✅ | ✅ |
| **Private Endpoint** | ✅ VPC Endpoint | ✅ VPC-SC | ✅ Private Endpoint |
| **Pricing** | $1.50/1000 pages | $1.50/1000 pages | $1.50/1000 pages |

### Private AI Architecture Recommendation

For Axori's document processing pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Recommended: AWS Architecture                     │
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐│
│  │  User Upload │────▶│  API Gateway │────▶│  Lambda / ECS        ││
│  │  (Encrypted) │     │  (Private)   │     │  (Document Processor)││
│  └──────────────┘     └──────────────┘     └──────────┬───────────┘│
│                                                        │            │
│                                            ┌───────────▼──────────┐ │
│                                            │    Step Functions    │ │
│                                            │    (Orchestration)   │ │
│                                            └───────────┬──────────┘ │
│                                                        │            │
│         ┌──────────────────────────────────────────────┼──────────┐ │
│         │                                              │          │ │
│         ▼                                              ▼          │ │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐ │ │
│  │  S3 Bucket  │   │  Textract   │   │       Bedrock           │ │ │
│  │  (SSE-KMS)  │──▶│  (OCR)      │──▶│  (Claude for analysis)  │ │ │
│  │             │   │             │   │                         │ │ │
│  └─────────────┘   └─────────────┘   └───────────┬─────────────┘ │ │
│         │                                        │               │ │
│         │              ┌─────────────────────────▼─────────────┐ │ │
│         │              │  RDS PostgreSQL                       │ │ │
│         └─────────────▶│  (Extracted data, metadata, vectors)  │ │ │
│                        │  + pgvector for semantic search       │ │ │
│                        └───────────────────────────────────────┘ │ │
│                                                                   │ │
│  ══════════════════════ VPC BOUNDARY ════════════════════════════ │
│              ALL traffic via PrivateLink / VPC Endpoints          │
└─────────────────────────────────────────────────────────────────────┘
```

**Why This Works:**
1. **Documents uploaded** → Encrypted at rest in S3 (customer-managed keys)
2. **Textract processes** → OCR extracts text, tables, forms (never leaves VPC)
3. **Bedrock analyzes** → Claude classifies, summarizes, extracts entities
4. **Data stored** → PostgreSQL with pgvector for semantic search
5. **Audit trail** → CloudTrail logs every access and inference

---

## Migration Complexity Analysis

### From Current Stack → AWS

**Effort: High (4-6 weeks for one engineer)**

| Task | Complexity | Time |
|------|------------|------|
| Set up VPC, subnets, security groups | High | 1 week |
| Configure RDS PostgreSQL | Medium | 2-3 days |
| Set up ECS/App Runner for API | Medium | 3-4 days |
| Configure Amplify for Web/Admin | Medium | 2-3 days |
| Set up CloudFront, SSL, domains | Medium | 2 days |
| Migrate CI/CD to CodePipeline or keep GitHub Actions | Medium | 2-3 days |
| Set up monitoring (CloudWatch) | Medium | 2 days |
| Data migration + testing | Medium | 1 week |
| **Total** | | **4-6 weeks** |

### From Current Stack → GCP

**Effort: Medium (3-4 weeks for one engineer)**

| Task | Complexity | Time |
|------|------------|------|
| Set up project, enable APIs | Low | 1 day |
| Configure Cloud SQL | Low | 1-2 days |
| Deploy to Cloud Run (Web, Admin, API) | Low | 2-3 days |
| Set up Load Balancer, SSL, domains | Medium | 2 days |
| Configure Secret Manager | Low | 1 day |
| Update GitHub Actions for GCP | Low | 1 day |
| Set up Cloud Logging/Monitoring | Low | 1 day |
| Data migration + testing | Medium | 1 week |
| **Total** | | **3-4 weeks** |

### From Current Stack → Azure

**Effort: High (4-6 weeks for one engineer)**

| Task | Complexity | Time |
|------|------------|------|
| Set up subscription, resource groups | Medium | 2 days |
| Configure VNet, subnets | High | 3-4 days |
| Set up PostgreSQL Flexible Server | Medium | 2 days |
| Deploy Container Apps | Medium | 3-4 days |
| Configure Front Door, SSL | Medium | 2-3 days |
| Set up Key Vault | Medium | 1 day |
| Update CI/CD | Medium | 2 days |
| Data migration + testing | Medium | 1 week |
| **Total** | | **4-6 weeks** |

---

## Decision Framework

### Stay on Current Stack If:

- [ ] Your team is < 5 engineers
- [ ] Monthly infrastructure spend is < $500
- [ ] You don't have specific compliance requirements (HIPAA, SOC2)
- [ ] You're still iterating on product-market fit
- [ ] You don't need private networking between services
- [ ] Deployment speed matters more than cost optimization

### Migrate to Major Cloud If:

- [ ] You need enterprise compliance certifications
- [ ] You're spending > $1000/month and need cost control
- [ ] You need private networking / VPC isolation
- [ ] You're scaling to > 10 engineers who need infrastructure access
- [ ] You need advanced features (ML, data pipelines, etc.)
- [ ] Enterprise customers require specific cloud providers

---

## Recommendation

### Primary Recommendation: Migrate to AWS

Given your stated priorities of **security compliance** and **private AI processing**, AWS is the clear winner.

**Why AWS:**

1. **Private AI is the Killer Feature (Bedrock)**
   - Claude 3.5/Opus available via PrivateLink
   - Financial documents never leave your VPC boundary
   - Full CloudTrail audit of all AI inference
   - No third-party access to investor data

2. **Complete Document Pipeline**
   - S3 with customer-managed encryption (KMS)
   - Textract for OCR/extraction (VPC isolated)
   - Bedrock for AI analysis
   - All in one ecosystem, one bill

3. **SOC 2 + Enterprise Trust**
   - "We run on AWS" opens doors with institutional investors
   - Well-understood security posture
   - Room to grow into HIPAA/FedRAMP if needed later

4. **Financial Data Handling**
   - Encryption at rest with keys you control
   - Audit trails for who accessed what
   - VPC isolation for Plaid/bank data flows

**Migration Timeline: 6-8 weeks**

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **1. Foundation** | Week 1-2 | VPC, IAM, KMS, networking |
| **2. Data Layer** | Week 2-3 | RDS PostgreSQL, S3, migration |
| **3. Compute** | Week 3-4 | ECS/App Runner, ALB, API |
| **4. Frontend** | Week 4-5 | Amplify or CloudFront + S3 |
| **5. AI Services** | Week 5-6 | Bedrock, Textract, Step Functions |
| **6. Cutover** | Week 6-8 | DNS, testing, monitoring |

### Alternative: Azure (Second Choice)

Choose Azure over AWS if:
- You need **GPT-4** specifically (Azure OpenAI has best GPT-4 access)
- You have a **Microsoft Enterprise Agreement** (significant discounts)
- Your enterprise customers are **Microsoft shops** (Azure AD integration)
- You're considering **Microsoft 365 integration** for email processing

### When GCP Still Makes Sense

Choose GCP if:
- Compliance is **not** a top priority
- You want **simplest migration** (Cloud Run is easiest)
- You prefer **Gemini** over Claude/GPT-4
- Cost is the **primary concern** (GCP is ~10-20% cheaper)

### Not Recommended: Stay on Current Stack

Your current stack (Railway + Vercel + Supabase) **cannot meet** your private AI requirements:
- ❌ No private networking between services
- ❌ No way to run AI models inside your network boundary
- ❌ Financial documents would be sent to external AI APIs
- ❌ No customer-managed encryption keys
- ❌ Limited audit trail capabilities

**Verdict:** Migration is necessary to meet your private AI requirement. If you didn't need VPC-isolated AI processing, you could stay on the current stack longer. But processing investor financial documents through external AI APIs is a non-starter for enterprise customers.

---

## Cost Comparison Summary

### Base Infrastructure Costs (Monthly)

| Scenario | Current | AWS | GCP | Azure |
|----------|---------|-----|-----|-------|
| **Startup (low traffic)** | $75-150 | $150-250 | $100-180 | $150-220 |
| **Growth (moderate traffic)** | $150-300 | $300-500 | $250-400 | $300-480 |
| **Scale (high traffic)** | $300-600 | $500-900 | $400-700 | $500-850 |

### AI & Document Processing Costs (Additional)

| Use Case | AWS | GCP | Azure |
|----------|-----|-----|-------|
| **Document OCR** (10K pages/month) | $15 | $15 | $15 |
| **AI Analysis** (1M tokens/month) | $18 (Claude 3.5) | $6 (Gemini) | $12 (GPT-4o) |
| **AI Analysis** (10M tokens/month) | $180 | $60 | $125 |
| **Vector Search** (pgvector on RDS) | Included | Included | Included |

### Compliance & Security Costs (Additional)

| Service | AWS | GCP | Azure |
|---------|-----|-----|-------|
| **WAF** | $5 + $0.60/M requests | $5 + $0.75/M requests | $20 + rules |
| **KMS (CMK)** | $1/key + $0.03/10K requests | $0.06/key/hour | $1/key |
| **CloudTrail / Audit Logs** | $2/100K events | Free (basic) | $2.76/GB |
| **Security Hub / Command Center** | $0.0010/check | Free tier | Included |
| **Secrets Manager** | $0.40/secret | $0.06/secret | $0.03/operation |

### Estimated Total Monthly Cost (AWS with AI + Compliance)

| Component | Low Usage | Medium Usage | High Usage |
|-----------|-----------|--------------|------------|
| Compute (ECS/Lambda) | $50 | $150 | $400 |
| Database (RDS) | $30 | $100 | $300 |
| Storage (S3) | $5 | $25 | $100 |
| Networking (ALB, NAT) | $40 | $80 | $150 |
| AI (Bedrock) | $20 | $100 | $500 |
| Document Processing | $15 | $50 | $200 |
| Security (WAF, KMS, etc.) | $20 | $40 | $80 |
| **Total** | **$180** | **$545** | **$1,730** |

*Note: Reserved capacity and Savings Plans can reduce costs by 30-40% at scale.*

---

## Next Steps: AWS Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Infrastructure as Code Setup:**
- [ ] Create AWS Organization and accounts (dev, staging, prod)
- [ ] Set up Terraform/Pulumi project structure
- [ ] Configure VPC with public/private subnets across 2 AZs
- [ ] Set up NAT Gateway for private subnet egress
- [ ] Create KMS keys for encryption (database, S3, secrets)
- [ ] Configure IAM roles and policies (least privilege)
- [ ] Set up CloudTrail for audit logging

**Networking:**
- [ ] Create VPC endpoints for S3, Secrets Manager, Bedrock
- [ ] Configure security groups (API, database, internal)
- [ ] Set up Route 53 hosted zone

### Phase 2: Data Layer (Weeks 2-3)

**Database:**
- [ ] Deploy RDS PostgreSQL (Multi-AZ for production)
- [ ] Enable encryption at rest with CMK
- [ ] Configure automated backups and point-in-time recovery
- [ ] Install pgvector extension for semantic search
- [ ] Test connection from development environment

**Storage:**
- [ ] Create S3 buckets (documents, backups)
- [ ] Enable versioning and encryption (SSE-KMS)
- [ ] Configure lifecycle policies for cost optimization
- [ ] Set up S3 access logging

**Migration:**
- [ ] Export Supabase database (pg_dump)
- [ ] Import to RDS PostgreSQL
- [ ] Verify data integrity
- [ ] Test application queries

### Phase 3: Compute Layer (Weeks 3-4)

**API Service:**
- [ ] Create ECR repository for API Docker image
- [ ] Deploy ECS Fargate cluster (or App Runner for simplicity)
- [ ] Configure Application Load Balancer
- [ ] Set up auto-scaling policies
- [ ] Configure health checks

**Frontend:**
- [ ] Deploy Web app to AWS Amplify (SSR support)
- [ ] Deploy Admin app to Amplify
- [ ] Configure CloudFront for caching
- [ ] Set up SSL certificates (ACM)

**CI/CD:**
- [ ] Update GitHub Actions to deploy to AWS
- [ ] Configure AWS credentials in GitHub Secrets
- [ ] Test deployment pipeline

### Phase 4: AI & Document Processing (Weeks 5-6)

**Bedrock Setup:**
- [ ] Enable Bedrock in your region
- [ ] Request access to Claude models
- [ ] Create VPC endpoint for Bedrock (PrivateLink)
- [ ] Test inference from within VPC (no internet egress)

**Textract Setup:**
- [ ] Create VPC endpoint for Textract
- [ ] Build document processing Lambda/service
- [ ] Test OCR on sample documents

**Integration:**
- [ ] Create Step Functions workflow (upload → OCR → AI → store)
- [ ] Implement document upload API endpoint
- [ ] Store extracted data in PostgreSQL
- [ ] Generate embeddings for semantic search

### Phase 5: Security & Compliance (Week 6-7)

**Security Hardening:**
- [ ] Enable AWS WAF on ALB
- [ ] Configure AWS Shield (DDoS protection)
- [ ] Set up GuardDuty (threat detection)
- [ ] Enable Security Hub
- [ ] Review and remediate findings

**Compliance:**
- [ ] Document data flow diagrams
- [ ] Create incident response runbook
- [ ] Enable AWS Config for compliance monitoring
- [ ] Generate compliance reports (AWS Artifact)

**Audit:**
- [ ] Verify CloudTrail captures all API calls
- [ ] Set up alerts for security events
- [ ] Test audit log retrieval

### Phase 6: Cutover & Go-Live (Week 7-8)

**Pre-Cutover:**
- [ ] Final database sync (if running in parallel)
- [ ] Lower DNS TTL to 60 seconds (24 hours before)
- [ ] Notify customers of maintenance window

**Cutover:**
- [ ] Final database export/import
- [ ] Update DNS to point to AWS
- [ ] Verify all services operational
- [ ] Monitor for errors (CloudWatch, application logs)

**Post-Cutover:**
- [ ] Monitor for 48-72 hours
- [ ] Increase DNS TTL back to normal
- [ ] Decommission Railway, Vercel, Supabase
- [ ] Update documentation

### Phase 7: Optimization (Ongoing)

- [ ] Implement Savings Plans or Reserved Instances
- [ ] Fine-tune auto-scaling based on actual usage
- [ ] Optimize Bedrock usage (caching, model selection)
- [ ] Set up cost alerts and budgets
- [ ] Regular security reviews

---

## References

- [AWS Pricing Calculator](https://calculator.aws/)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [AWS App Runner](https://aws.amazon.com/apprunner/)
- [Azure Container Apps](https://azure.microsoft.com/products/container-apps)
