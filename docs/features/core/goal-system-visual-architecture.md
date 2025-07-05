# Generic Goal System - Visual Architecture

## System Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        GD[Goal Dashboard]
        GC[Goal Creation Wizard]
        GP[Progress Tracker]
        GN[Notifications]
    end
    
    subgraph "Feature Modules"
        JM[Journaling Module]
        FM[Fitness Module]
        NM[Nutrition Module]
        RM[Reading Module]
        MM[Meditation Module]
    end
    
    subgraph "Core Goal System"
        GA[Goal API]
        GS[Goal Service]
        GT[Goal Templates]
        GV[Goal Validators]
        GR[Reminder Engine]
        GAN[Analytics Engine]
    end
    
    subgraph "Data Layer"
        DB[(DynamoDB - Goals Table)]
        S3[S3 - Media Storage]
        Cache[ElastiCache]
    end
    
    GD --> GA
    GC --> GA
    GP --> GA
    GN --> GR
    
    JM --> GA
    FM --> GA
    NM --> GA
    RM --> GA
    MM --> GA
    
    GA --> GS
    GS --> GT
    GS --> GV
    GS --> GR
    GS --> GAN
    
    GS --> DB
    GS --> Cache
    JM --> S3
    FM --> S3
```

## Goal Types and Their Metadata

```mermaid
graph LR
    subgraph "Core Goal Model"
        G[Goal<br/>- ID, Type, Title<br/>- Target & Schedule<br/>- Progress & Status<br/>- Reminders]
    end
    
    subgraph "Journaling"
        J[Metadata<br/>- Prompts<br/>- AI Settings<br/>- Privacy Level<br/>- Topics]
    end
    
    subgraph "Fitness"
        F[Metadata<br/>- Exercise Type<br/>- Equipment<br/>- Muscle Groups<br/>- Intensity]
    end
    
    subgraph "Nutrition"
        N[Metadata<br/>- Meal Types<br/>- Nutrient Targets<br/>- Dietary Prefs<br/>- Recipes]
    end
    
    subgraph "Reading"
        R[Metadata<br/>- Book Info<br/>- Genres<br/>- Format<br/>- Reading List]
    end
    
    G --> J
    G --> F
    G --> N
    G --> R
```

## User Journey: Cross-Feature Goals

```mermaid
journey
    title User's Daily Goal Journey
    section Morning
      Wake up: 5: User
      Check goal dashboard: 5: User, Goal System
      See today's targets: 5: Goal System
      Complete meditation goal: 5: User, Meditation Module
      Log breakfast (nutrition goal): 4: User, Nutrition Module
    section Afternoon
      Receive workout reminder: 5: Goal System, User
      Complete workout: 5: User, Fitness Module
      Auto-track progress: 5: Fitness Module, Goal System
    section Evening
      Journal prompt notification: 5: Goal System, User
      Write journal entry: 5: User, Journaling Module
      AI analyzes entry: 5: Journaling Module
      Mark goal complete: 5: Goal System
      View daily summary: 5: User, Goal System
```

## Data Flow Example: Creating a Goal

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Goal UI
    participant API as Goal API
    participant VAL as Validator
    participant DB as DynamoDB
    participant REM as Reminder Engine
    
    U->>UI: Create new fitness goal
    UI->>UI: Show goal type selector
    U->>UI: Select "Fitness" + fill form
    UI->>API: POST /goals {type: "fitness", ...}
    API->>VAL: Validate fitness metadata
    VAL-->>API: Validation passed
    API->>DB: Save goal with metadata
    DB-->>API: Goal created
    API->>REM: Schedule reminders
    REM-->>API: Reminders set
    API-->>UI: Goal created successfully
    UI-->>U: Show success + goal details
```

## Analytics Integration

```mermaid
graph TD
    subgraph "Goal Activities"
        JA[Journal Entries]
        WA[Workouts]
        MA[Meals]
        RA[Reading Sessions]
    end
    
    subgraph "Goal System"
        GA[Goal Activities Table]
        PM[Progress Monitor]
    end
    
    subgraph "Analytics"
        CS[Correlation Service]
        IS[Insight Generator]
        ML[ML Predictions]
    end
    
    subgraph "User Insights"
        UI1[You journal more after workouts]
        UI2[Your mood improves with reading]
        UI3[Suggested: Try morning meditation]
    end
    
    JA --> GA
    WA --> GA
    MA --> GA
    RA --> GA
    
    GA --> PM
    PM --> CS
    CS --> IS
    IS --> ML
    
    ML --> UI1
    ML --> UI2
    ML --> UI3
```

## Component Hierarchy

```
Goal System Components
├── Core Components (Shared)
│   ├── GoalCard
│   ├── GoalProgress
│   ├── StreakTracker
│   ├── ReminderSettings
│   └── GoalAnalytics
├── Creation Components
│   ├── GoalTypeSelector
│   ├── TargetConfigurator
│   ├── ScheduleBuilder
│   └── MetadataForms
│       ├── JournalingForm
│       ├── FitnessForm
│       ├── NutritionForm
│       └── ReadingForm
└── Feature Integrations
    ├── JournalEntryGoalLink
    ├── WorkoutGoalTracker
    ├── MealGoalChecker
    └── ReadingSessionLogger
```

## Database Query Patterns

```
Access Patterns:
1. Get all active goals for user
   PK: USER#123, SK: begins_with(GOAL#), filter: status = 'active'

2. Get goals by type
   GSI1PK: TYPE#fitness, GSI1SK: USER#123

3. Get goals needing reminders
   GSI2PK: REMINDER#2024-01-15T09:00:00Z

4. Get goal with activities
   PK: GOAL#456, SK: begins_with(ACTIVITY#)

5. Get user's activities by date
   GSI3PK: USER#123, GSI3SK: begins_with(2024-01-15)
```

## Implementation Phases

```mermaid
gantt
    title Goal System Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Core System
    Base Goal Model           :done, core1, 2024-01-08, 3d
    CRUD Operations           :done, core2, after core1, 2d
    Progress Tracking         :active, core3, after core2, 2d
    Reminder System          :rem, after core3, 3d
    
    section Feature Adapters
    Journaling Adapter       :jour, after core3, 2d
    Fitness Adapter          :fit, after jour, 2d
    Nutrition Adapter        :nut, after fit, 2d
    
    section UI Components
    Goal Dashboard           :ui1, after core3, 3d
    Creation Wizard          :ui2, after ui1, 3d
    Progress Visualizations  :ui3, after ui2, 2d
    
    section Analytics
    Basic Analytics          :an1, after ui3, 3d
    ML Insights             :an2, after an1, 5d
```

This architecture ensures that all lifestyle features can leverage the same robust goal system while maintaining their unique requirements through metadata extensions.
