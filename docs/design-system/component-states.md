# Component State Matrix

Every interactive component must define and test the states below. “Visible focus” means a keyboard user can clearly locate the active control in both light and dark themes.

## Shared focus contract

Use:

- `focusRing` for standalone buttons/cards/tabs.
- `focusRingInset` for dense rows, menu items, table rows, and icon buttons.

Both are backed by the `--border-focus` semantic token.

## State matrix

| Component | Default | Hover | Active/selected | Focus-visible | Disabled | Loading |
|---|---|---|---|---|---|---|
| `Button` | variant token background/foreground | action hover token | action active token | `focusRing` | opacity + no pointer events | spinner + disabled |
| `Dropdown` trigger | semantic surface + border | background tertiary surface | open state follows Headless UI | `focusRing` | consumer-controlled | n/a |
| `Dropdown` item | text primary on menu surface | surface secondary | selected item uses action/brand text | `focusRingInset` | consumer-controlled | n/a |
| `FilterTabs` | tertiary surface + secondary text | background hover | primary action bg + on-accent text | `focusRing` | future prop | n/a |
| `Accordion` trigger | inherited surface/text | component context | expanded icon/state | `focusRing` | future prop | n/a |
| `TableRow` | border + primary text | background hover | selected tertiary surface | `focusRingInset` when clickable | n/a | table skeleton |
| `DataTable` row | alternating semantic surfaces | primary action low-alpha hover | selected state + left border | `focusRingInset` when clickable | n/a | `DataTableSkeleton` |
| `AttendanceHeatmap` nav | icon button | contextual hover | n/a | `focusRingInset` | future prop | n/a |
| `AttendanceHeatmap` cell | status color | future tooltip/hover | today border/status | `focusRingInset` | future prop | n/a |
| Clickable `Card` | surface + raised shadow | overlay shadow | consumer-selected | `focusRing` | future prop | skeleton/consumer |
| Clickable `Tag` | variant pill | consumer hover | consumer-selected | `focusRing` | future prop | n/a |
| `Field` | label + optional helper | n/a | child-focused state optional | child control owns focus | muted metadata | n/a |
| `Input` | semantic surface + default border | border/surface lift | n/a | `focusRing`/focus border token | muted, non-interactive | spinner/suffix, geometry stable |
| `Textarea` | semantic surface + default border | border/surface lift | n/a | `focusRing`/focus border token | muted, non-interactive | n/a |
| `Select` trigger | semantic surface + default border | surface lift | open trigger state | `focusRing` | muted, no menu open | loading option/trigger state |
| `Select` option | elevated menu surface | highlighted option | selected check + state text | roving/active descendant visible | disabled option muted | n/a |
| `Combobox` input | semantic surface + default border | surface lift | open/filtering state | `focusRing` | muted, no typing | loading list state |
| `Combobox` option | elevated menu surface | highlighted option | selected check + state text | active descendant visible | disabled option muted | loading/empty state |
| `Checkbox` | border + transparent bg | border lift | checked/indeterminate fill | `focusRing` | muted, no toggle | n/a |
| `RadioGroup` option | border + option text | border/surface lift | selected dot/card state | visible radio/card focus | muted, no selection | n/a |
| `Switch` | off track + thumb | track lift | on track + translated thumb | `focusRing` | muted, no toggle | n/a |
| `Tabs` | tab text + indicator/border | text/surface lift | active indicator/surface | `focusRing` / roving focus | muted, no activation | n/a |
| `SegmentedControl` | grouped button surface | surface lift | selected segment | `focusRingInset` | muted | n/a |
| `InlineAlert` | semantic state bg/fg/border | n/a | n/a | links/actions inside own focus | n/a | n/a |
| `EmptyState` | icon/title/copy/action | action hover | n/a | action owns focus | n/a | n/a |
| `ErrorState` | danger icon/title/copy/retry | retry hover | n/a | retry owns focus | n/a | retry loading |

## Review checklist

Before merging a presentation-layer PR:

1. Can a keyboard user tab to every changed interactive element?
2. Is the focused element visible in light and dark themes?
3. Does hover differ from selected/active state?
4. Does disabled state suppress pointer/keyboard activation?
5. Does loading state preserve geometry and avoid layout jump?
6. Do all text/state pairs meet WCAG AA?
7. Is motion tokenized and compatible with reduced motion?
8. If the change adds a form control, is there a label, helper/error ID wiring, and a keyboard path?
9. If the change adds a select/combobox, does the menu render correctly in both light and dark themes?
10. If the change adds a non-data state, does it use `EmptyState`, `LoadingState`, `ErrorState`, or `InlineAlert` instead of a page-local pattern?
