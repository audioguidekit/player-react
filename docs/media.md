# Media Session / Audio Fixes

Solutions tried for iOS Safari Control Center and audio playback issues.

## Problem: Transition audio looping infinitely

**Solution**: Source ID tracking for ended events
- Changed from URL-based `hasEndedForCurrentUrlRef` flag to a `audioSourceId` counter
- Increment ID on each URL change before loading new source
- In `handleEnded`, capture current ID and use `setTimeout(0)` to let pending URL changes process
- If ID doesn't match after timeout, ignore as stale event

File: `hooks/useAudioPlayer.ts`

## Problem: Control Center track info disappears after a few seconds

**Solution 1**: Singleton audio element
- Changed from creating audio element in `useEffect` (returns null on first render) to module-level singleton via `getOrCreateAudioElement()`
- Audio element available immediately on first render
- Prevents Media Session action handlers effect from re-running when `audioElement` changes from null to actual element

File: `hooks/useAudioPlayer.ts`

**Solution 2**: Metadata only updates on track change
- Added `lastMetadataTrackIdRef` to track last metadata track ID
- Skip setting `MediaMetadata` when track ID hasn't changed
- Prevents redundant metadata updates that cause Control Center flickering

File: `App.tsx`

**Solution 3**: Position state throttling
- Increased throttle to 2 seconds (was lower)
- Only update position state when `isPlaying=true`
- Track last duration/position values in `lastPositionValuesRef`
- Skip update if values haven't changed significantly (duration > 0.5s, position > 2s)

File: `App.tsx`

**Solution 4**: Single source of truth for playbackState
- Moved `navigator.mediaSession.playbackState` management from `useBackgroundAudio` to `App.tsx`
- `useBackgroundAudio` is now a no-op (kept for hook count parity with HMR)
- Prevents duplicate/conflicting playback state updates

Files: `App.tsx`, `hooks/useBackgroundAudio.ts`

## Problem: Control Center time resets to zero momentarily

**Solution**: Source ID tracking (same as transition audio fix)
- When track changes, increment source ID before changing URL
- Any pending ended events from old source get ignored
- Prevents the old source's ended event from resetting state

File: `hooks/useAudioPlayer.ts`

## Problem: Control Center time keeps jumping to zero during track changes

**Root Cause**: Race condition between MediaMetadata updates and position state updates
- When track changes, `useAudioPlayer` immediately resets React state: `setDuration(0)`, `setCurrentTime(0)`
- Position state effect triggers based on these React state values
- If not guarded, `setPositionState({ duration: 0, position: 0 })` is called
- iOS Control Center briefly displays 0:00 before new metadata loads

**Solution 5**: Read position state directly from audio element (FINAL FIX) ⭐⭐⭐
- **Root Cause**: React state (`audioPlayer.currentTime`) is stale due to async updates
- Effect was triggering with old `currentTime` values, sending position=0 to iOS
- **Solution**: Read `duration` and `currentTime` DIRECTLY from audio element, not React state
- Use periodic timer (setInterval 2s) to update position state
- Effect depends on `[audioPlayer.audioElement, isPlaying]` only - NO React state dependencies
- Guard: `if (duration < 0.5 || !isFinite(duration)) return;`
- This completely eliminates stale state issues

File: `App.tsx` lines 287-336

**Solution 6**: Always include artwork type field (FINAL FIX) ⭐
- Use single artwork entry with `type` always present (no conditional logic)
- `type: artworkType || 'image/png'` ensures type is never undefined
- iOS requires consistent artwork specification
- Multiple entries with same URL was confusing iOS

File: `App.tsx` lines 190-199

**Solution 7**: Optimize Media Session handler management
- Move navigation refs before handler setup
- Set nexttrack/previoustrack handlers once using refs (not empty placeholders)
- Remove duplicate effect that re-sets handlers on every navigation state change
- Handlers set once and use refs to access current state
- Reduces iOS instability from frequent handler re-registration

File: `App.tsx` lines 235-285

**Solution 8**: Only apply seek buffer to long tracks (FINAL FIX) ⭐
- **Root Cause**: `dur - 0.5` prevented short transition audio (< 2s) from reaching natural end
- `ended` event never fired, transition state got stuck, audio looped
- **Solution**: Only apply 0.5s buffer for tracks > 5 seconds
- Short tracks (≤ 5s) can reach exact duration and fire ended event properly
- `const maxPosition = dur > 5 ? dur - 0.5 : dur;`

File: `hooks/useAudioPlayer.ts` lines 303-314

## Problem: Position jumps to 0:01 during playback + Metadata disappears

**Root Causes**:
1. Position state being updated during track loading when `currentTime=0` but duration is still valid
2. Position state not updating when paused, causing iOS to drop session after extended pauses
3. Metadata updating during transitions when transition audio should be silent

**Solution 9**: Prevent position updates during transitions and track loading ⭐⭐
- **Root Cause**: Timer was reading from audio element during track changes when values are inconsistent
- **Solution**:
  - Skip updates during `isTransitioning` or `isSwitchingTracks`
  - Add track loading detection: if `currentTime < 1.0` and last position was > 5.0 and duration changed significantly, skip update
  - Update position even when paused (at slower rate: 10s vs 2s) to keep iOS session alive
- **Effect**: No more position jumps, metadata stays visible during pauses

File: `App.tsx` lines 290-355

**Solution 10**: Prevent metadata updates during transitions ⭐
- **Root Cause**: Metadata effect didn't check if transition audio was playing
- **Solution**: Skip metadata updates when `isTransitioning=true`
- Transition audio plays without showing metadata in Control Center
- Only standard audio stops show metadata

File: `App.tsx` lines 182-212

## Problem: Track repeats after skip forward + Transition audio loops

**Root Causes**:
1. Missing state cleanup at end of tour - `isTransitioning` and `isAudioCompleting` not reset
2. `handleTrackTransition` callback recreated on every `isTransitioning` change
3. No timeout fallback for stuck transitions
4. No safety check for missing transition audio

**Solution 11**: Fix transition state management ⭐⭐⭐
- **Root Cause**: When tour ends, transition states not reset, causing audioURL to get stuck
- **Solutions**:
  - Reset all states at end of tour: `setIsTransitioning(false)`, `setIsAudioCompleting(false)`
  - Use `isTransitioningRef` instead of `isTransitioning` in dependency array
  - Add 10-second timeout fallback to force advance if transition gets stuck
  - Check if `tour.transitionAudio` exists before calling `handleTrackTransition`
  - Clear transition timeout when advancing to next track
- **Effect**: Transition audio plays once, tracks advance correctly, no more repeats or loops

Files:
- `hooks/useTourNavigation.ts` lines 135-198 (handleAdvanceToNextTrack, handleTrackTransition)
- `App.tsx` lines 148-161 (handleAudioEnded)
