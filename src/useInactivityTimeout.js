import { useEffect, useRef, useState, useCallback } from 'react'

const TIMEOUT_MS  = 60 * 60 * 1000   // 60 minutes
const WARN_MS     = 55 * 60 * 1000   // warn at 55 minutes (5 min before)
const CHECK_MS    = 30_000            // check every 30 seconds
const LS_KEY      = 'tiny-moments-last-activity'

// Activity events that reset the timer
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'touchstart']

export function useInactivityTimeout(signOut) {
  // null  → no warning
  // 1..5  → minutes remaining (show warning)
  const [minsLeft, setMinsLeft] = useState(null)

  // Keep signOut stable in the interval without causing re-registrations
  const signOutRef = useRef(signOut)
  useEffect(() => { signOutRef.current = signOut }, [signOut])

  const resetTimer = useCallback(() => {
    localStorage.setItem(LS_KEY, String(Date.now()))
    setMinsLeft(null)
  }, [])

  useEffect(() => {
    // Stamp activity on mount so the clock starts from now
    resetTimer()

    // Attach activity listeners
    ACTIVITY_EVENTS.forEach(ev =>
      window.addEventListener(ev, resetTimer, { passive: true })
    )

    // Periodic check
    const interval = setInterval(() => {
      const last    = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10)
      const elapsed = Date.now() - last

      if (elapsed >= TIMEOUT_MS) {
        // Time's up — sign out
        signOutRef.current()
        return
      }

      if (elapsed >= WARN_MS) {
        // Inside the warning window — show countdown
        const remaining = Math.max(1, Math.ceil((TIMEOUT_MS - elapsed) / 60_000))
        setMinsLeft(remaining)
      } else {
        setMinsLeft(null)
      }
    }, CHECK_MS)

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer))
      clearInterval(interval)
      localStorage.removeItem(LS_KEY)
    }
  }, [resetTimer])

  return { minsLeft, resetTimer }
}
