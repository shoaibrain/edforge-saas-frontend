import { useEffect, useRef, useState } from 'react'

/**
 * Returns [ref, isInView]. Once the sentinel enters the viewport
 * (with `rootMargin`), `isInView` flips to `true` and stays true.
 */
export function useInView(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, isInView] as const
}
