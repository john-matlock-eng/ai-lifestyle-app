# End-to-End Encryption - Visual Architecture

## Encryption Flow Diagrams

### 1. Initial Setup Flow

```mermaid
graph TD
    A[User Creates Account] --> B[Choose Encryption Option]
    B --> C{Enable E2E Encryption?}
    C -->|Yes| D[Enter Strong Password]
    C -->|No| E[Standard Account Setup]
    
    D --> F[Generate Master Key<br/>PBKDF2 100k iterations]
    F --> G[Generate RSA-4096 Keypair]
    G --> H[Encrypt Private Key<br/>with Master Key]
    H --> I[Store on Server:<br/>- Public Key<br/>- Encrypted Private Key<br/>- Salt]
    I --> J[Setup Recovery Options]
    J --> K[Ready to Use]
    
    style F fill:#FFE4B5
    style G fill:#FFE4B5
    style H fill:#E6E6FA
    style I fill:#98FB98
```

### 2. Creating Encrypted Entry

```mermaid
sequenceDiagram
    participant U as User Browser
    participant C as Crypto Engine
    participant S as Server
    participant D as Database
    
    U->>U: Write Journal Entry
    U->>C: Request Encryption
    
    rect rgb(255, 228, 181)
        Note over C: Client-Side Only
        C->>C: Generate AES-256 Key
        C->>C: Encrypt Content
        C->>C: Encrypt AES Key with<br/>User's Public Key
    end
    
    C->>U: Return Encrypted Package
    U->>S: POST /journal/entries<br/>{encrypted data}
    S->>D: Store Encrypted Entry
    S-->>U: 201 Created
    
    Note over S,D: Server never sees<br/>unencrypted content!
```

### 3. Sharing Encrypted Entry

```mermaid
graph LR
    subgraph "Alice's Browser"
        A1[Encrypted Entry]
        A2[Alice's Private Key]
        A3[Decrypt Content Key]
        A4[Re-encrypt for Bob]
    end
    
    subgraph "Server"
        S1[Bob's Public Key]
        S2[Share Record]
        S3[Notification]
    end
    
    subgraph "Bob's Browser"
        B1[Receive Share]
        B2[Bob's Private Key]
        B3[Decrypt Content Key]
        B4[Read Entry]
    end
    
    A1 --> A3
    A2 --> A3
    A3 --> A4
    S1 --> A4
    A4 --> S2
    S2 --> S3
    S3 --> B1
    B1 --> B3
    B2 --> B3
    B3 --> B4
    
    style A3 fill:#FFE4B5
    style A4 fill:#FFE4B5
    style B3 fill:#FFE4B5
```

### 4. Key Hierarchy

```mermaid
graph TD
    P[User Password] --> M[Master Key<br/>PBKDF2-SHA256]
    M --> PK[Encrypts Personal<br/>Private Key]
    
    subgraph "Personal Keys"
        PRV[Private Key<br/>RSA-4096]
        PUB[Public Key<br/>RSA-4096]
    end
    
    PK --> PRV
    
    subgraph "Per Entry"
        CK1[Content Key 1<br/>AES-256]
        CK2[Content Key 2<br/>AES-256]
        CK3[Content Key N<br/>AES-256]
    end
    
    PUB --> CK1
    PUB --> CK2
    PUB --> CK3
    
    subgraph "Recovery"
        RP[Recovery Phrase<br/>24 words]
        RK[Recovery Key]
    end
    
    RP --> RK
    RK --> M
    
    style M fill:#FFB6C1
    style PRV fill:#FFE4B5
    style PUB fill:#98FB98
```

### 5. Recovery Options Flow

```mermaid
graph TD
    A[Forgot Password] --> B{Recovery Method?}
    
    B -->|Recovery Phrase| C[Enter 24 Words]
    C --> D[Derive Recovery Key]
    D --> E[Decrypt Master Key]
    
    B -->|Social Recovery| F[Contact 3 of 5 Friends]
    F --> G[Friends Approve]
    G --> H[Combine Key Shares]
    H --> E
    
    B -->|No Recovery| I[❌ Data Lost Forever]
    
    E --> J[Set New Password]
    J --> K[Re-encrypt Keys]
    K --> L[✅ Access Restored]
    
    style C fill:#E6E6FA
    style F fill:#E6E6FA
    style I fill:#FFB6C1
    style L fill:#98FB98
```

## Data Flow Visualization

### What the Server Sees

```
┌─────────────────────────────────────┐
│ What Server Stores:                 │
│                                     │
│ entryId: "entry-123"               │
│ userId: "user-456"                 │
│ encryptedContent: "7J+U3K8dS9..."  │ ← Gibberish
│ encryptedKey: "mK9dj3Hs8..."      │ ← Gibberish
│ iv: "8dK3js9..."                   │
│ metadata: {                        │
│   wordCount: 523,                  │ ← Visible
│   created: "2024-01-15",           │ ← Visible
│   isEncrypted: true                │ ← Visible
│ }                                  │
└─────────────────────────────────────┘

❌ Cannot see: Content, Title, Tags (if encrypted)
✅ Can see: Metadata, Dates, Structure
```

### What the User Sees

```
┌─────────────────────────────────────┐
│ After Decryption in Browser:       │
│                                     │
│ Title: "Today's Reflection"        │
│                                     │
│ Content:                           │
│ "Today was challenging but I       │
│  learned so much about myself..."  │
│                                     │
│ Tags: #personal #growth #therapy   │
│ Mood: Thoughtful                   │
│                                     │
│ [🔒 End-to-End Encrypted]          │
└─────────────────────────────────────┘
```

## Performance Characteristics

### Encryption Overhead

```mermaid
graph LR
    subgraph "Operations Timeline"
        A[Generate Key<br/>~10ms] --> B[Encrypt Content<br/>~50-100ms]
        B --> C[Encrypt Key<br/>~20ms]
        C --> D[Total: ~80-130ms]
    end
    
    subgraph "Size Overhead"
        E[Original: 10KB] --> F[Encrypted: 12KB<br/>+20%]
    end
```

### Optimization Strategies

```mermaid
graph TD
    A[Performance Optimizations] --> B[Web Workers]
    A --> C[Lazy Decryption]
    A --> D[Content Caching]
    A --> E[Key Caching]
    
    B --> B1[Parallel Processing]
    C --> C1[Decrypt on View]
    D --> D1[5-minute TTL]
    E --> E1[Session Storage]
    
    style B fill:#98FB98
    style C fill:#98FB98
    style D fill:#98FB98
    style E fill:#98FB98
```

## Security Boundaries

```mermaid
graph TB
    subgraph "Trust Boundary"
        subgraph "User's Device"
            A[Password]
            B[Master Key]
            C[Decrypted Content]
            D[Private Keys]
        end
    end
    
    subgraph "Untrusted Network"
        E[🔒 Encrypted Data]
    end
    
    subgraph "Our Servers"
        F[Encrypted Storage]
        G[Public Keys]
        H[Metadata]
    end
    
    A -.->|Never Leaves Device| E
    B -.->|Never Leaves Device| E
    C -.->|Never Leaves Device| E
    D -.->|Encrypted Version Only| F
    
    style A fill:#FFB6C1
    style B fill:#FFB6C1
    style C fill:#FFB6C1
    style D fill:#FFB6C1
```

## Implementation Phases

```mermaid
gantt
    title E2E Encryption Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Core Encryption           :a1, 2024-02-01, 14d
    Key Management           :a2, after a1, 7d
    section Phase 2
    Sharing System           :b1, after a2, 7d
    Public Key Directory     :b2, after a2, 5d
    section Phase 3
    Recovery Phrase          :c1, after b1, 5d
    Social Recovery          :c2, after c1, 7d
    section Phase 4
    UI/UX Polish            :d1, after c2, 7d
    Performance Opt         :d2, after c2, 5d
    section Phase 5
    Migration Tools         :e1, after d1, 5d
    Launch Prep            :e2, after e1, 3d
```

This visual guide helps understand the complete encryption system architecture and flow!