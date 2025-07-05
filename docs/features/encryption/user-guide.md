# End-to-End Encryption - User Overview

## What This Means for You

### 🔒 Your Privacy, Guaranteed

When you enable encryption for a journal entry:
- **Only you can read it** - Not even we can see your content
- **You control the keys** - Like having a safe only you can open
- **Optional sharing** - Share securely with specific friends
- **Zero knowledge** - Our servers only see encrypted gibberish

### 🔑 How It Works (Simple Version)

1. **You write** → Your device encrypts → We store encrypted text
2. **You read** → We send encrypted text → Your device decrypts
3. **You share** → Your device creates a special key for your friend
4. **Friend reads** → Their device uses their key to decrypt

### 📱 What You'll See

#### Creating an Encrypted Entry
```
┌─────────────────────────────────────┐
│ 📝 New Journal Entry                │
│                                     │
│ [🔒 Encryption: ON] ←── Toggle this │
│                                     │
│ This entry will be end-to-end      │
│ encrypted. Only you can read it.   │
│                                     │
│ Write your thoughts here...         │
│                                     │
└─────────────────────────────────────┘
```

#### Sharing with Friends
```
┌─────────────────────────────────────┐
│ 🤝 Share Encrypted Entry            │
│                                     │
│ Select friends who can decrypt:     │
│ ☑ Sarah (has encryption)           │
│ ☑ Mike (has encryption)            │
│ ☐ Amy (invite to enable?)          │
│                                     │
│ Expires: [Never ▼]                  │
│                                     │
│ [Share Securely]                    │
└─────────────────────────────────────┘
```

### 🛡️ Recovery Options

Choose how to recover encrypted entries if you forget your password:

1. **Recovery Phrase** (Recommended)
   - 24 words you write down and keep safe
   - Like a master key to your safe
   - Works even if you forget your password

2. **Trusted Friends**
   - Choose 5 friends, need 3 to help recover
   - They can't read your entries
   - They just help you regain access

3. **Maximum Security**
   - No recovery possible
   - If you forget = entries lost forever
   - For the ultra-privacy conscious

### ⚡ Performance Impact

- **Encrypting**: ~100ms (instant)
- **Decrypting**: ~50ms (instant)
- **Sharing**: ~200ms (very fast)
- **No server slowdown** - All done on your device

### 💰 Premium Feature

End-to-end encryption is a premium feature because:
- Complex cryptography implementation
- Additional storage for encrypted keys
- Recovery system maintenance
- Sharing infrastructure

### 🚫 Limitations

When entries are encrypted:
- **No server-side search** - Search happens on your device
- **No AI analysis** - Unless you explicitly allow it
- **No password reset** - Only recovery options work
- **Slightly larger files** - ~20% more storage

### ✅ Benefits

- **True privacy** - Not even subpoenas can reveal content
- **Secure sharing** - Share without compromising privacy
- **Peace of mind** - Your deepest thoughts stay yours
- **Compliance ready** - Meets strictest privacy laws

## FAQ

**Q: Can you really not read my encrypted entries?**
A: Correct. We only store encrypted data. Without your password, it's meaningless random characters to us.

**Q: What if I lose my recovery phrase?**
A: If you lose both your password AND recovery phrase, encrypted entries are permanently inaccessible. This is the trade-off for true security.

**Q: Can I encrypt old entries?**
A: Yes! We offer a one-click option to encrypt all existing entries.

**Q: How is this different from regular HTTPS?**
A: HTTPS protects data in transit. E2E encryption means we can't read it even when stored on our servers.

**Q: Can shared friends reshare my entries?**
A: Only if you allow it. You control all permissions when sharing.

**Q: What happens if I disable encryption later?**
A: New entries won't be encrypted. Old encrypted entries remain encrypted unless you explicitly decrypt them.

---

## Visual Guide

### The Encryption Journey

```
Your Device          Internet          Our Servers
    📝      ----->    🔒🔒🔒    ----->    🔒
  Clear              Encrypted          Encrypted
  Text               In Transit          At Rest

Your Friend's Device
    📝      <-----    🔒🔒🔒    <-----    🔒
  Clear              Encrypted          Encrypted
  Text               In Transit          From Server
```

### Key Hierarchy Simplified

```
Your Password
     |
     ├──> Master Key (never leaves device)
     |         |
     |         ├──> Personal Keys (encrypted, stored)
     |         |
     |         └──> Recovery Key (optional)
     |
     └──> Each Entry Key (unique per entry)
```

This system ensures maximum privacy while maintaining usability!