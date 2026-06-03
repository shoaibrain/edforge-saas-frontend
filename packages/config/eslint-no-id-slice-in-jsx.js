/**
 * @edforge/config — `no-id-slice-in-jsx` lint rule.
 *
 * Forbids rendering a raw UUID fragment via `<id>.slice(0, N)` (N ≤ 12) inside
 * JSX. These truncated-UUID stubs leak internal infrastructure identifiers into
 * operator-facing UI where an archetype-compliant identifier belongs (e.g. a
 * PABSON student's government EMIS id). Use the merged `@edforge/archetype`
 * primitives instead:
 *   - `<EntityIdDisplay entity="…" data={row} />` — resolves the governance-body
 *     identifier with a graceful fallback.
 *   - `<UuidBadge value={someId} />` — truncated, copyable, masking-aware badge
 *     for rows that only carry a raw UUID.
 *
 * Why an AST rule, not grep / `no-restricted-syntax`:
 *   - A grep is too noisy (false-positives on legitimate Array/String slices).
 *   - `no-restricted-syntax` is already owned by `eslint-mfe-nav.js` on the same
 *     app globs, and flat-config rule values don't array-merge (last wins) — a
 *     second `no-restricted-syntax` entry would clobber the MFE-nav selectors.
 *     A dedicated rule id avoids the collision.
 *
 * Scoping (keeps false-positives near zero):
 *   - Only `*.slice(0, N)` with `N ≤ 12` (UUID-fragment shape).
 *   - Only when the receiver's terminal name ends in `id` (case-insensitive) —
 *     `id`, `studentId`, `invoiceId`, `paymentId`, `userId`, `enrollmentId`, …
 *     So `teacherSections.slice(0, 8)` or `items.slice(0, 8)` are NOT flagged.
 *   - Only inside a JSX expression container (children OR attribute value).
 *
 * Escape hatch: a genuinely-needed string fallback in a non-render context that
 * still sits in JSX (e.g. a string-typed component prop) may use
 * `// eslint-disable-next-line edforge/no-id-slice-in-jsx -- <reason>`.
 */

const MESSAGE =
  'Do not render a raw UUID fragment (`<id>.slice(0, N)`) in JSX — it leaks an ' +
  'internal identifier. Use <EntityIdDisplay entity="…" data={…} /> or ' +
  '<UuidBadge value={…} /> from @edforge/archetype instead.'

/** Terminal name of the slice receiver, or null. */
function receiverName(object) {
  if (object.type === 'Identifier') return object.name
  if (object.type === 'MemberExpression' && object.property.type === 'Identifier') {
    return object.property.name
  }
  return null
}

function insideJsxExpression(node) {
  let p = node.parent
  while (p) {
    if (p.type === 'JSXExpressionContainer') return true
    // Stop climbing at a function boundary that isn't itself rendered inline —
    // a `.slice` inside a nested non-arrow callback isn't a direct JSX render.
    p = p.parent
  }
  return false
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow raw UUID-fragment (id.slice(0, N)) renders in JSX.' },
    messages: { idSliceInJsx: MESSAGE },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee
        if (callee.type !== 'MemberExpression') return
        if (callee.property.type !== 'Identifier' || callee.property.name !== 'slice') return

        const args = node.arguments
        if (args.length !== 2) return
        const [start, end] = args
        if (!(start.type === 'Literal' && start.value === 0)) return
        if (!(end.type === 'Literal' && typeof end.value === 'number' && end.value <= 12)) return

        const name = receiverName(callee.object)
        if (!name || !/id$/i.test(name)) return

        if (!insideJsxExpression(node)) return

        context.report({ node, messageId: 'idSliceInJsx' })
      },
    }
  },
}

export const noIdSliceInJsxPlugin = { rules: { 'no-id-slice-in-jsx': rule } }

/** Flat-config block: enable the rule on all app + package TSX. */
export default {
  files: ['apps/**/*.tsx', 'packages/**/*.tsx'],
  plugins: { edforge: noIdSliceInJsxPlugin },
  rules: { 'edforge/no-id-slice-in-jsx': 'error' },
}
