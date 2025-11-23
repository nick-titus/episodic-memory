# Episodic Memory - Issues and Fixes

Documentation of issues discovered and fixes applied to the episodic-memory plugin.

## Issue 1: SessionStart Hook Fires Twice

**Status:** Fixed (2025-11-19)

### Symptoms
- Two `SessionStart:Callback hook success: Success` messages appear when starting a Claude Code session
- Plugin warning: "Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file"

### Root Cause
The `.claude-plugin/plugin.json` explicitly declared the hooks file:
```json
"hooks": "./hooks/hooks.json"
```

Claude Code **auto-discovers** `hooks/hooks.json` by convention. When explicitly declared in plugin.json, it gets loaded twice.

### Fix
Removed line 21 from `.claude-plugin/plugin.json`:
```diff
-  },
-  "hooks": "./hooks/hooks.json"
+  }
```

The hooks functionality remains intact via auto-discovery.

### Related Upstream PR
- [PR #20: Fix: Remove hook from plugin.json](https://github.com/obra/episodic-memory/pull/20)

---

## Issue 2: Summarization Failures

**Status:** Fixed (2025-11-22)

### Symptoms
During `episodic-memory sync`, some conversations fail with:
```
Summary generation failed: Claude Code process exited with code 1
```

Stats showed 97% of conversations (288/297) were missing summaries.

### Root Cause

The summarizer (`src/summarizer.ts`) used the Claude Agent SDK's `query()` function with a `resume` parameter for short conversations (≤15 exchanges). The intent was to resume the original session so Claude would have full context for better summaries.

However, old sessions are invalid/expired, causing the spawned Claude Code process to exit with code 1.

### Fix

Implemented graceful fallback (Option B):
```typescript
// Try resuming the session first (works for recent sessions with full context)
// Fall back to including conversation text if resume fails (old/expired sessions)
if (sessionId) {
  try {
    const result = await callClaude(basePrompt, sessionId);
    return extractSummary(result);
  } catch (error) {
    // Resume failed (session expired/invalid) - fall through to text-based approach
    console.log(`  Session resume failed, using text-based summarization`);
  }
}

// Text-based summarization (no session context)
const conversationText = formatConversationText(exchanges);
const result = await callClaude(`${basePrompt}\n\n${conversationText}`);
return extractSummary(result);
```

**Benefits:**
- Recent sessions still get context-aware summaries via resume
- Old sessions fall back to text-based summarization (still produces good summaries)
- No more silent failures

### Related Upstream PRs
- [PR #25: Fix: --background flag fails silently](https://github.com/obra/episodic-memory/pull/25) - Addresses related SessionStart hook issues with background processes

---

## Database Statistics (2025-11-19)

| Metric | Value |
|--------|-------|
| Total Conversations | 297 |
| Total Exchanges | 1,239 |
| With Summaries | 9 (3%) |
| Without Summaries | 288 (97%) |
| Date Range | Sep 26 - Nov 19, 2025 |
| Unique Projects | 21 |

**Top Projects by Conversation Count:**
- betterpack: 77
- ~/Dev: 51
- tpf-website: 48
- trainingpeaks: 31
- tpv-data: 20

---

## Upstream Repository

Forked from: https://github.com/obra/episodic-memory

### Relevant Open PRs (as of 2025-11-19)

1. **#25** - Fix: --background flag fails silently (SessionStart hook broken)
2. **#20** - Fix: Remove hook from plugin.json
3. **#18** - Fix issues with initialisation and first run experience
4. **#17** - Fix shebang line in episodic-memory.js
5. **#15** - Fix: Add exclusion marker to summarizer prompts
6. **#11** - Use more generic "#!/usr/bin/env bash" instead of "#!/bin/bash"

Consider syncing with upstream to incorporate community fixes.
