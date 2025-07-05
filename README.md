# AI Lifestyle App

A comprehensive wellness platform with AI-powered insights, built on privacy-first principles with end-to-end encryption.

## 🚀 Current Status

**Sprint 2 In Progress**
- ✅ Authentication system complete
- 🔄 Core Encryption Service (PRIORITY)
- 🔄 Enhanced Goal System design
- 🔄 AI Analysis feature planning

## 🏗️ Architecture Overview

### Platform Services
- **Core Encryption Service**: Zero-knowledge encryption for all modules
- **Authentication**: AWS Cognito with 2FA support
- **API Gateway**: HTTP API v2 with Lambda integration
- **Database**: DynamoDB with single-table design
- **Frontend**: React 18 + TypeScript + Material-UI

### Feature Modules
- **Journal**: Encrypted personal entries with rich text
- **Goals**: Comprehensive goal tracking (5 pattern types)
- **AI Analysis**: Selective sharing for intelligent insights
- **Health**: Medical records and wellness tracking (planned)
- **Finance**: Expense tracking and budgeting (planned)

## 🔐 Privacy-First Design

Our core principle: **Your data is yours alone**
- End-to-end encryption by default
- Zero-knowledge architecture
- Selective sharing with expiration
- No server-side data access

## 📚 Key Documentation

### Architecture Decisions
- [ADR-004: Enhanced Goal Model](./docs/adr/ADR-004-enhanced-goal-model.md)
- [ADR-005: Client-Side Encryption](./docs/adr/ADR-005-client-side-encryption.md)
- [ADR-006: AI Analysis of Encrypted Entries](./docs/adr/ADR-006-ai-analysis-encrypted-entries.md)
- [ADR-007: Core Encryption Service](./docs/adr/ADR-007-core-encryption-service.md)

### Feature Specifications
- [Core Encryption Service](./docs/features/core/encryption-service.md)
- [Goal System Design](./docs/features/core/goal-system-design-v2.md)
- [AI Analysis](./docs/features/ai-analysis/technical-specification.md)

### Team Resources
- [Backend Tasks](./backend/current-task.md)
- [Frontend Tasks](./frontend/current-task.md)
- [Active Sprint](./pm/active-sprint.md)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker Desktop
- AWS CLI configured
- Terraform 1.5+

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd ai-lifestyle-app

# Backend setup
cd backend
make setup
make deploy ENV=dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Development Commands
```bash
# Backend
make test              # Run backend tests
make fmt               # Format Python code
make lint              # Run linters
make build-lambda      # Build Lambda containers

# Frontend
npm run dev            # Start development server
npm run test           # Run frontend tests
npm run build          # Build for production
npm run type-check     # Check TypeScript types
```

## 🏃‍♂️ Current Sprint Goals

### Week 2 (Current)
- [ ] Complete Core Encryption Service foundation
- [ ] Finish 2FA implementation
- [ ] Deploy CloudFront
- [ ] Finalize Goal System design

### Upcoming
- Week 3-4: Build Goal System with encryption
- Week 5-6: Implement Journaling
- Week 7-8: Polish and optimization

## 🤝 Team Structure

### Agents
- **PM Agent**: Product strategy and coordination
- **Backend Agent**: API and infrastructure
- **Frontend Agent**: UI and user experience

### Communication
- Tasks via `current-task.md` files
- OpenAPI contract as source of truth
- Architecture decisions in ADRs

## 📊 Tech Stack

### Backend
- **Runtime**: Python 3.11 on AWS Lambda
- **API**: FastAPI + AWS API Gateway
- **Database**: DynamoDB
- **Auth**: AWS Cognito
- **Infrastructure**: Terraform

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **UI**: Material-UI v5
- **State**: Redux Toolkit
- **Build**: Vite

### Security
- **Encryption**: AES-256-GCM + RSA-4096
- **Key Derivation**: PBKDF2/Argon2id
- **Storage**: IndexedDB + secure cloud backup
- **Compliance**: HIPAA/GDPR ready

## 🎯 Vision

Building the most trusted wellness platform where:
- Privacy is guaranteed, not promised
- AI provides insights without accessing raw data
- Users own and control their information
- Security enables features, not restricts them

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details

---

**Questions?** Check our documentation or reach out to the team!