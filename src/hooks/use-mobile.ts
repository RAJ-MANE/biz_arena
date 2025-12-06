import * as React from "react"

const MOBILE_BREAKPOINT = 768
const DEBOUNCE_MS = 150

// Small debounce helper
function debounce(fn: (...args: any[]) => void, wait: number) {
  let t: any = null
  return (...args: any[]) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}

export function useIsMobile() {
  // start undefined so server-side rendering doesn't mismap viewport
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    const mql = window.matchMedia(query)

    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    const debounced = debounce(() => {
      // Use requestAnimationFrame to avoid layout thrashing during resize
      requestAnimationFrame(() => update())
    }, DEBOUNCE_MS)

    // Initialize
    update()

    // Use the modern event API when available
    try {
      mql.addEventListener('change', debounced)
    } catch (e) {
      // Fallback for older browsers
      mql.addListener(debounced as any)
    }

    // Also listen to window resize as a backup
    window.addEventListener('resize', debounced, { passive: true })

    return () => {
      try {
        mql.removeEventListener('change', debounced)
      } catch (e) {
        mql.removeListener(debounced as any)
      }
      window.removeEventListener('resize', debounced as any)
    }
  }, [])

  return !!isMobile
}
