/**
 * School-scoped query matching.
 *
 * Query keys embed the school id either as a bare string segment
 * (['schools', schoolId]) or inside a filter/params object
 * ({ schoolId }). This predicate is the single definition used for
 * cache invalidation on school switch, the transition "settled"
 * signal, and the transition error toast.
 */

export function queryMatchesSchool(schoolId: string) {
  return (query: { queryKey: readonly unknown[] }): boolean => {
    return query.queryKey.some((segment) => {
      if (typeof segment === 'string' && segment === schoolId) return true
      if (typeof segment === 'object' && segment !== null) {
        const obj = segment as Record<string, unknown>
        if (obj.schoolId === schoolId) return true
      }
      return false
    })
  }
}
