# iOS Media Session API - Debugging Log

## Problem Statement

When user clicks "Start tour", audio plays correctly (progress bar visible in Control Center), but iOS Control Center shows a **play button** instead of a **pause button**.

**Key observation**: After manually pressing pause then play **in the app itself**, Control Center shows the correct button state.

## Working Reference

The [CSS-Tricks CodePen example](https://codepen.io/engageinteractive/pen/abBKwPO) works correctly on iOS. Key characteristics:
- Simple `<audio>` element in DOM with static `src`
- On click: set metadata, call `audio.play()`
- No explicit `playbackState` setting
- No React, no effects

## Environment

- iOS Safari (version unknown)
- React 19
- Singleton audio element pattern (for iOS stability)
- Audio preloaded before user interaction

## Attempts Log

### Attempt 1: Event-based playbackState sync
**Change**: Sync `playbackState` with actual audio element events (`play`, `pause`) instead of React state.

**Code**:
```javascript
audio.addEventListener('play', () => {
  navigator.mediaSession.playbackState = 'playing';
});
audio.addEventListener('pause', () => {
  navigator.mediaSession.playbackState = 'paused';
});
```

**Result**: ❌ Did not fix the issue

---

### Attempt 2: Alternative useMediaSession implementation
**Change**: Complete rewrite of useMediaSession hook with:
- Refs for handler dependencies
- `playing` event listener (not just `play`)
- Self-healing logic checking every 1 second
- No module-level flag

**Result**: ❌ Did not fix the issue

---

### Attempt 3: Remove ALL explicit playbackState settings
**Change**: Let iOS handle playbackState automatically (like the CodePen)

**Result**: ❌ Did not fix the issue

---

### Attempt 4: Set playbackState on 'playing' event only
**Change**: Only set `playbackState = 'playing'` when `playing` event fires (when audio actually outputs sound), not on `play` event.

**Result**: ❌ Did not fix the issue. Logs confirmed playbackState was being set to 'playing'.

---

### Attempt 5: Set playbackState BEFORE calling play()
**Change**: Set `navigator.mediaSession.playbackState = 'playing'` synchronously before `audio.play()` in click handler.

**Result**: ❌ Did not fix the issue. Logs confirmed playbackState was 'playing'.

---

### Attempt 6: Append audio element to DOM
**Change**: Append the singleton audio element to `document.body` (hidden). CodePen uses DOM-attached `<audio>` element.

**Code**:
```javascript
globalAudioElement.style.display = 'none';
document.body.appendChild(globalAudioElement);
```

**Result**: ❌ Did not fix the issue

---

### Attempt 7: Pre-load audio into singleton element
**Change**: Pre-load first audio into the singleton element when tour loads (not on click). This ensures `readyState >= 2` when user clicks.

**Rationale**: iOS might need "actual audio playback" not buffering.

**Result**: ❌ Did not fix the issue. Audio was fully loaded (readyState: 4), no "waiting for data" message, but Control Center still wrong.

---

### Attempt 8: Remove duplicate playbackState setting
**Change**: Only set playbackState in the 'playing' event handler, not also in click handler.

**Result**: ❌ Did not fix the issue

---

### Attempt 9: Quick pause/play cycle via setTimeout
**Change**: After initial play(), do a quick pause/play cycle via setTimeout to "wake up" Media Session.

**Result**: ❌ Did not fix the issue. setTimeout runs outside user gesture context.

---

### Attempt 10: Unlock audio then let React effect call play()
**Change**: Call `audio.play()` to unlock, immediately `audio.pause()`, then let React effect call `play()` (mimicking manual pause/play flow).

**Result**: ❌ Audio didn't play due to race condition with async `.then()` callback.

---

### Attempt 11: Don't call play() directly, let React effect handle it
**Change**: Remove direct `audio.play()` call, rely entirely on React effect.

**Result**: ❌ Audio doesn't play at all. iOS requires user gesture for play().

---

### Attempt 12: Set up action handlers in click handler
**Change**: Set up Media Session action handlers within the user gesture context (click handler), not just on mount.

**Result**: ❌ Did not fix the issue

---

### Attempt 13: Synchronous pause/play cycle in click handler (current)
**Change**: Before calling play(), call pause() first to "register" the Media Session. This mimics the manual pause/play flow that works.

**Rationale**: The key insight is that **manual pause→play works**. iOS might need to see a 'pause' event before the first play to properly initialize the Media Session.

**Code**:
```javascript
// Step 1: Pause first (triggers 'pause' event)
audio.pause();

// Step 2: Immediately play (triggers 'playing' event after pause)
audio.play();
```

**Result**: ⏳ Pending test

---

## Key Findings

1. **playbackState IS being set correctly** - Logs confirm `navigator.mediaSession.playbackState === 'playing'`

2. **Metadata IS being set correctly** - Logs confirm `navigator.mediaSession.metadata.title` is set

3. **Audio IS playing** - Progress bar visible in Control Center, audio audible

4. **After manual pause/play in app, it works** - This is the critical clue

5. **iOS requires user gesture for play()** - Can't rely solely on React effects

6. **Pre-loading doesn't help** - Even with readyState: 4, issue persists

## Differences: Start Tour vs Manual Pause/Play

| Aspect | Start Tour (broken) | Manual Pause/Play (works) |
|--------|---------------------|---------------------------|
| play() called from | Direct in click handler | React effect |
| Preceded by pause? | No | Yes |
| Action handlers set? | On mount (useEffect) | Already set |
| User gesture context | Yes (click) | Yes (click) |

## Hypotheses to Test

1. **iOS needs a pause event before play to initialize Media Session** - The manual flow has a pause before the play that works.

2. **Action handlers must be set in user gesture context** - Currently testing (Attempt 12).

3. **The effect-based play() somehow registers differently with Media Session** - Unknown mechanism.

4. **There's a timing issue** - iOS reads state at a specific moment we're missing.

5. **The order of operations matters** - Maybe: action handlers → metadata → play?

## Next Ideas to Try

1. **Simulate the exact manual flow programmatically**:
   - Click handler sets isPlaying = false first
   - Then sets isPlaying = true
   - This triggers effect to pause (no-op) then play

2. **Set action handlers before metadata**

3. **Use a "silent" initial play/pause to initialize, then real play**

4. **Check iOS Safari version-specific behavior**

5. **Try setting playbackState in the action handlers themselves**

6. **Create minimal reproduction without React to isolate the issue**
