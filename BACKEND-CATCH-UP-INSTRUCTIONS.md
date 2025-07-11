# Backend Developer Instructions - Urgent Catch-Up Required

## 🚨 IMMEDIATE ACTIONS (Complete Today)

### 1. Deploy Token Refresh Fix (CRITICAL)
There's a production bug preventing users from refreshing tokens. The fix is already implemented.

```bash
# Execute these commands NOW:
cd backend
git add src/refresh_token/cognito_client.py
git commit -m "fix: remove SECRET_HASH from token refresh flow"
git push origin feature/fix-token-refresh

# Create a Pull Request to trigger deployment
# This will deploy to dev, then merge to deploy to prod
```

**Issue**: The code was trying to use SECRET_HASH when the Cognito client doesn't have a secret.
**File**: `backend/src/refresh_token/cognito_client.py` - The fix removes the SECRET_HASH calculation.

### 2. Complete 2FA Implementation (Week 2 Commitment)

The frontend is waiting for these endpoints to build the UI. You need to implement:

#### Task B5: 2FA Setup Endpoints (8 hours)

**Endpoint 1**: `POST /auth/mfa/setup`
```python
# Key implementation details:
import pyotp
import qrcode
import io
import base64

def setup_mfa_handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    
    # Generate TOTP secret
    secret = pyotp.random_base32()
    
    # Create provisioning URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name='AI Lifestyle App'
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    # Convert to base64
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store encrypted secret in DynamoDB (NOT in Cognito)
    store_mfa_secret(user_id, encrypt(secret))
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'qrCode': f"data:image/png;base64,{qr_base64}",
            'manualEntryKey': secret,
            'backupCodes': generate_backup_codes(8)
        })
    }
```

**Endpoint 2**: `POST /auth/mfa/verify-setup`
```python
def verify_mfa_setup_handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['sub']
    code = json.loads(event['body'])['code']
    
    # Retrieve secret from DynamoDB
    secret = decrypt(get_mfa_secret(user_id))
    
    # Verify TOTP code
    totp = pyotp.TOTP(secret)
    if totp.verify(code, valid_window=1):
        # Enable MFA in Cognito
        cognito.admin_set_user_mfa_preference(
            UserPoolId=USER_POOL_ID,
            Username=user_id,
            SoftwareTokenMfaSettings={
                'Enabled': True,
                'PreferredMfa': True
            }
        )
        
        # Update user record
        update_user_mfa_status(user_id, enabled=True)
        
        return {
            'statusCode': 200,
            'body': json.dumps({'mfaEnabled': True})
        }
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'INVALID_CODE'})
        }
```

**Endpoint 3**: `POST /auth/mfa/verify` (During login)
```python
def verify_mfa_handler(event, context):
    body = json.loads(event['body'])
    session_token = body['sessionToken']
    code = body['code']
    
    # Complete Cognito MFA challenge
    response = cognito.respond_to_auth_challenge(
        ClientId=CLIENT_ID,
        ChallengeName='SOFTWARE_TOKEN_MFA',
        Session=session_token,
        ChallengeResponses={
            'USERNAME': get_username_from_session(session_token),
            'SOFTWARE_TOKEN_MFA_CODE': code
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'accessToken': response['AuthenticationResult']['AccessToken'],
            'refreshToken': response['AuthenticationResult']['RefreshToken'],
            'tokenType': 'Bearer',
            'expiresIn': 3600
        })
    }
```

## 📋 CONTEXT: Major Architecture Change

We discovered our initial goal model was too limited. We're now building an **Enhanced Goal System** that supports:
- **Recurring goals**: "Walk 10k steps daily" ✅
- **Milestone goals**: "Write 50k words total" ✅ (NEW)
- **Target goals**: "Lose 20 lbs by June" ✅ (NEW)
- **Streak goals**: "100-day meditation" ✅ (NEW)
- **Limit goals**: "Screen time < 2 hrs" ✅ (NEW)

This change adds 2 weeks but saves months of development time later.

## 🎯 Week 3-4: Enhanced Goal System Tasks

After completing 2FA, you'll build the foundation for ALL features:

### Task GS-B1: Core Goal Model & Database (10 hours)
**Start**: Week 3, Day 1

Create the DynamoDB schema and base models:

```python
# DynamoDB Table Structure
Table: goals
Partition Key (PK): USER#{userId}
Sort Key (SK): GOAL#{goalId}

# Global Secondary Indexes
GSI1PK: GOAL#{goalId}       # Single goal lookup
GSI2PK: TYPE#{goalType}      # Goals by type
GSI3PK: STATUS#{status}      # Active goals
GSI4PK: REMINDER#{datetime}  # Upcoming reminders

# Goal Model
class Goal(BaseModel):
    goal_id: str
    user_id: str
    goal_type: Literal['journal', 'workout', 'nutrition', 'reading', 'custom']
    goal_pattern: Literal['recurring', 'milestone', 'target', 'streak', 'limit']
    
    title: str
    description: Optional[str]
    
    target: GoalTarget  # Flexible based on pattern
    schedule: Schedule
    progress: Progress
    reminders: List[Reminder]
    
    status: Literal['active', 'paused', 'completed', 'archived']
    visibility: Literal['private', 'friends', 'public']
    
    context: GoalContext  # For AI analysis
    metadata: Dict[str, Any]  # Feature-specific data
    
    created_at: datetime
    updated_at: datetime
```

### Task GS-B2: Progress Tracking Engine (8 hours)
**Dependencies**: GS-B1

Implement different progress calculations per pattern:

```python
def calculate_progress(goal: Goal, activities: List[GoalActivity]) -> Progress:
    """Calculate progress based on goal pattern"""
    
    if goal.goal_pattern == 'recurring':
        return calculate_recurring_progress(goal, activities)
    elif goal.goal_pattern == 'milestone':
        return calculate_milestone_progress(goal, activities)
    elif goal.goal_pattern == 'target':
        return calculate_target_progress(goal, activities)
    elif goal.goal_pattern == 'streak':
        return calculate_streak_progress(goal, activities)
    elif goal.goal_pattern == 'limit':
        return calculate_limit_progress(goal, activities)

def calculate_recurring_progress(goal: Goal, activities: List[GoalActivity]) -> Progress:
    """Daily/weekly/monthly goals that reset"""
    current_period = get_current_period(goal.target.period)
    period_activities = filter_activities_by_period(activities, current_period)
    
    return Progress(
        current_period_value=sum(a.value for a in period_activities),
        period_target=goal.target.value,
        achieved=current_period_value >= goal.target.value,
        success_rate=calculate_success_rate(goal, activities),
        current_streak=calculate_streak(goal, activities)
    )

def calculate_milestone_progress(goal: Goal, activities: List[GoalActivity]) -> Progress:
    """Cumulative goals without reset"""
    total = sum(a.value for a in activities)
    
    return Progress(
        total_accumulated=total,
        remaining_to_goal=goal.target.value - total,
        percent_complete=(total / goal.target.value) * 100,
        projected_completion=project_completion_date(goal, activities)
    )
```

### Task GS-B3: Goal Activity System (8 hours)
**Dependencies**: GS-B1

Rich activity tracking with AI context:

```python
class GoalActivity(BaseModel):
    activity_id: str
    goal_id: str
    user_id: str
    
    # Core tracking
    value: float
    unit: str
    activity_date: datetime
    
    # Rich context for AI
    context: ActivityContext
    
    # Links to other features
    attachments: List[Attachment]
    
class ActivityContext(BaseModel):
    # Temporal
    time_of_day: Literal['early-morning', 'morning', 'afternoon', 'evening', 'night']
    day_of_week: int
    is_weekend: bool
    
    # Environmental
    weather: Optional[WeatherData]
    location: Optional[LocationData]
    
    # Physical/Mental
    energy_level: Optional[int]  # 1-10
    stress_level: Optional[int]  # 1-10
    sleep_hours: Optional[float]
    mood: Optional[str]
    
    # Activity details
    difficulty: Optional[int]  # 1-5
    enjoyment: Optional[int]   # 1-10
    with_others: bool
    notes: Optional[str]
```

## 📚 Required Reading

Before starting the goal system:
1. **[Enhanced Goal Model v2](../docs/features/core/goal-system-design-v2.md)** - Full specification
2. **[Goal Model Analysis](../docs/features/core/goal-model-analysis.md)** - Real examples
3. **[API Contract](../docs/features/core/goal-api-contract.md)** - All endpoints
4. **[Sprint Plan](../docs/features/core/goal-system-sprint-plan.md)** - Task details

## 🔧 Technical Setup

### Dependencies to Add
```txt
# requirements.txt additions
pyotp==2.8.0          # TOTP generation
qrcode==7.4.2         # QR code generation  
pillow==10.0.0        # Image processing
cryptography==41.0.0  # Secret encryption
```

### Environment Variables
```bash
# .env additions
MFA_ENCRYPTION_KEY=<generate-with-cryptography>
COGNITO_USER_POOL_ID=<existing>
COGNITO_CLIENT_ID=<existing>
```

### Lambda Layers
Consider creating a shared layer with common dependencies for all goal-related lambdas.

## 📊 Testing Requirements

### 2FA Tests
```python
def test_mfa_setup_generates_valid_qr():
    response = setup_mfa(user_id='test-user')
    assert response['qrCode'].startswith('data:image/png;base64,')
    assert len(response['backupCodes']) == 8
    assert pyotp.TOTP(response['manualEntryKey']).verify(
        pyotp.TOTP(response['manualEntryKey']).now()
    )

def test_mfa_verify_accepts_valid_code():
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    code = totp.now()
    
    assert verify_mfa_code(secret, code) == True
```

### Goal System Tests
- Test all 5 goal patterns
- Validate progress calculations
- Ensure proper data validation
- Test cross-pattern queries

## 🚀 Deployment Notes

1. **2FA Deployment**: Can deploy immediately after implementation
2. **Goal System**: Deploy incrementally:
   - Phase 1: Core model + recurring goals
   - Phase 2: Other goal patterns
   - Phase 3: AI features

## 💬 Communication

- **Frontend is waiting for**: 2FA endpoints
- **Frontend has completed**: All Week 1 tasks, ready for integration
- **PM wants**: 2FA done ASAP, then focus on goal system foundation

## 📅 Timeline Summary

**Today**: Deploy token fix + Start 2FA
**Tomorrow**: Complete 2FA endpoints
**Day 3**: Test 2FA with frontend
**Week 3**: Start goal system core
**Week 4**: Complete goal patterns
**Week 5-6**: AI and advanced features

---

**Critical Path**: Token Fix → 2FA → Goal System Core → Journaling Integration

**Remember**: The goal system is the foundation for the entire app. Take time to build it right!