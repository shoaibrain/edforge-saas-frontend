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

## Review checklist

Before merging a presentation-layer PR:

1. Can a keyboard user tab to every changed interactive element?
2. Is the focused element visible in light and dark themes?
3. Does hover differ from selected/active state?
4. Does disabled state suppress pointer/keyboard activation?
5. Does loading state preserve geometry and avoid layout jump?
6. Do all text/state pairs meet WCAG AA?
7. Is motion tokenized and compatible with reduced motion?
