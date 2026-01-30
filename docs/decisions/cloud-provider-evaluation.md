# Cloud Provider Evaluation: AWS vs GCP vs Azure

**Date:** January 2026
**Current Stack:** Railway (API) + Vercel (Web/Admin) + Supabase (DB) + Clerk (Auth)
**Goal:** Evaluate migration to a major cloud provider for long-term scalability and cost optimization

---

## Executive Summary

| Factor | Current Stack | AWS | GCP | Azure |
|--------|--------------|-----|-----|-------|
| **Monthly Cost (Est.)** | ~$150-300 | ~$200-400 | ~$180-350 | ~$200-400 |
| **Migration Effort** | N/A | High (4-6 weeks) | Medium (3-4 weeks) | High (4-6 weeks) |
| **Operational Complexity** | Low | High | Medium | High |
| **Vendor Lock-in** | Medium | High | Medium | High |
| **Scaling Ceiling** | Medium | Unlimited | Unlimited | Unlimited |
| **Best For** | Startups, MVPs | Enterprise, Complex | Developer-friendly | Microsoft shops |

**Recommendation:** Stay on current stack until you hit specific scaling pain points OR have a clear enterprise requirement. If you must migrate, **GCP is the best fit** for your tech stack.

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

### Short Term (Next 6-12 months): Stay on Current Stack

**Rationale:**
1. Your current setup works and is optimized for developer velocity
2. Migration would consume 4-6 weeks of engineering time
3. No clear ROI until you hit scaling limits or compliance requirements
4. Supabase already runs on GCP (partial cloud benefit)

**Optimizations to consider now:**
- Consolidate on Supabase Auth instead of Clerk (saves ~$25/month, reduces vendors)
- Use Vercel's Edge Functions for latency-sensitive API routes
- Add Redis caching when you see database bottlenecks

### Medium Term (If Migration Needed): Choose GCP

**Rationale:**
1. **Cloud Run is ideal for your stack** - Hono, Node.js, containers all work seamlessly
2. **Lowest migration effort** - Similar mental model to Railway
3. **Supabase affinity** - Already runs on GCP, easier data migration
4. **Firebase for mobile** - Natural fit for React Native/Expo
5. **Cost competitive** - Generally 10-20% cheaper than AWS for your use case

### When to Reconsider AWS

Choose AWS over GCP if:
- Enterprise customers mandate AWS (common in healthcare, finance, government)
- You need specific AWS services (SageMaker, Bedrock, etc.)
- You're hiring and AWS experience is more common in your talent pool
- You anticipate SOC2/HIPAA compliance in next 12 months

---

## Cost Comparison Summary

| Scenario | Current | AWS | GCP | Azure |
|----------|---------|-----|-----|-------|
| **Startup (low traffic)** | $75-150 | $100-200 | $70-150 | $100-180 |
| **Growth (moderate traffic)** | $150-300 | $200-400 | $150-300 | $200-350 |
| **Scale (high traffic)** | $300-600 | $400-800 | $300-600 | $400-700 |

*Note: Current stack costs increase faster at scale due to usage-based pricing. Cloud providers offer reserved capacity discounts at scale.*

---

## Next Steps If You Decide to Migrate

### Phase 1: Preparation (Week 1)
- [ ] Document all environment variables and secrets
- [ ] Create infrastructure-as-code (Terraform/Pulumi) for target cloud
- [ ] Set up development environment on cloud provider
- [ ] Create database backup strategy

### Phase 2: Infrastructure Setup (Weeks 2-3)
- [ ] Deploy database and verify connectivity
- [ ] Deploy API service and validate
- [ ] Deploy Web/Admin apps
- [ ] Configure networking, SSL, domains

### Phase 3: Migration (Week 4)
- [ ] Migrate database (pg_dump/pg_restore)
- [ ] Update DNS with low TTL
- [ ] Cut over to new infrastructure
- [ ] Monitor for 48 hours

### Phase 4: Cleanup (Week 5)
- [ ] Decommission old infrastructure
- [ ] Update documentation
- [ ] Train team on new platform

---

## References

- [AWS Pricing Calculator](https://calculator.aws/)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [AWS App Runner](https://aws.amazon.com/apprunner/)
- [Azure Container Apps](https://azure.microsoft.com/products/container-apps)
