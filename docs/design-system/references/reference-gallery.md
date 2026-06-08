# Design System Visual References

**Purpose:** Anchor EdForge presentation polish to public, inspectable references from Google for Education and Apple. Authenticated product screenshots for Admin Console/Classroom were not available in this environment, so entries below use official public documentation/product pages or clearly marked proxy references. Do not treat any third-party screenshot as a pixel-copy target; use them for interaction density, hierarchy, and state-language only.

## 1. Google Workspace for Education Admin Console — users/devices tables

- Source: <https://support.google.com/a/answer/55955?hl=en>
- Source: <https://knowledge.workspace.google.com/admin/users/find-a-user-account>
- Source: <https://knowledge.workspace.google.com/admin/devices/view-computer-and-smart-home-device-details>
- Image/source status: public official documentation/proxy for authenticated Admin Console.

Google Admin’s relevant pattern for EdForge is dense operator UI: search first, filter chips above tables, thin row dividers, subdued neutral surfaces, and action color used sparingly for primary actions. Semantic color is not decorative; status and destructive actions are separated from navigation. Type rhythm is compact but readable: page title, toolbar, table header, row primary text, row metadata. Empty/loading/error states are usually inline in the table region instead of large detached panels. Focus/hover states are quiet but visible, with row hover and selected states remaining low-contrast. Motion is nearly invisible: short fades or state changes rather than springy animation.

## 2. Google Classroom — stream, classwork, people, gradebook

- Source: <https://support.google.com/edu/classroom/answer/9582854>
- Source: <https://services.google.com/fh/files/misc/google_classroom_user_guide.pdf>
- Image/source status: public official help/user-guide references.

Classroom balances educator warmth with operational clarity. Cards dominate stream/classwork, while people and grades switch to list/table density. Color indicates assignment/work status rather than arbitrary emphasis; red/green/black status markers in the gradebook are paired with text labels. Typography is calm and functional: medium-weight titles, smaller metadata, clear tab labels. Spacing is more generous than Admin Console on cards, tighter in rosters and gradebook. Empty states explain the next action. Focus and hover states follow Material restraint: visible enough for keyboard/mouse confidence but not ornamental. Motion is short and purposeful.

## 3. ChromeOS / Chromebook EDU Admin — device management

- Source: <https://support.google.com/chrome/a/answer/1698333?hl=en>
- Source: <https://support.google.com/chrome/a/answer/1289314>
- Image/source status: public official Chrome Enterprise/Education documentation.

ChromeOS device management is closest to EdForge’s future “operator command center” needs: large tables, column management, filters, detail drill-ins, and action sidebars. Semantic color is used primarily for provisioning, update, and risk states. Type rhythm prioritizes scanability: compact row text, clear column headings, and detail pages with grouped attributes. Spacing density is compact by default with enough whitespace to avoid grid fatigue. Loading states should preserve table geometry. Focus/hover/pressed states must make rows and toolbar buttons keyboard-operable. Motion should be almost entirely stateful: panel open/close and selection changes.

## 4. Google Forms — education workflows and validation

- Source: <https://support.google.com/docs/answer/3378864>
- Source: <https://support.google.com/a/users/answer/9303071>
- Image/source status: public official Google Docs Editors / Workspace Learning Center documentation.

Google Forms is the reference for EdForge form workflows: progressive sections, clear labels, helper text, validation close to the field, and obvious required-state treatment. Semantic color is restrained: error red for validation, accent color for active controls, neutral text for descriptions. Type rhythm separates section title, question/label, helper text, and error text. Spacing is comfortable, not dense, because forms require confidence. Focus states are strong and unmistakable. Motion is minimal; validation should appear without layout surprise.

## 5. Google for Education product marketing pages

- Source: <https://edu.google.com/intl/ALL_us/resources/get-started/setup-products/google-workspace-for-education/outreach-branding/>
- Source: <https://edu.google.com/intl/ALL_uk/workspace-for-education/editions/overview/>
- Proxy visual reference: <https://styles.refero.design/style/c57ba3f8-1d76-4660-8ba4-48ddce26e759>
- Proxy image URL: <https://images.refero.design/styles/refero.design/image/edf290fb-ea16-42fb-853c-4b59693a8725.jpg>
- Image/source status: official marketing pages plus public proxy image.

The marketing surfaces are useful for type and card restraint, not for EdForge’s admin density. Google for Education uses generous whitespace, rounded product frames, soft background panels, and blue/green accents against clean white. The hierarchy is clear: display heading, short explanatory paragraph, card title, body copy, button/link. Empty/loading/error states are less relevant here, but the lesson is consistency and restraint. Motion personality is polished but subtle: reveal/scroll transitions should never compete with content.

## 6. Apple Human Interface Guidelines — color, typography, motion, materials

- Source: <https://developer.apple.com/design/human-interface-guidelines>
- Source: <https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass>
- Source: <https://developer.apple.com/videos/play/wwdc2025/243/>
- Image/source status: public official Apple documentation/video pages.

Apple’s value for EdForge is not visual imitation; it is interaction discipline. Use semantic colors with light/dark variants and test them in context. Typography should rely on a small set of named roles instead of arbitrary sizes. Materials/elevation should communicate hierarchy, not decoration. Motion should be purposeful, short, interruptible, and respectful of reduced-motion settings; use cross-fades or color changes when motion reduction is active. Focus/hover/pressed states should make controls feel responsive without adding clutter.

## 7. Apple School Manager — users/search/operator tables

- Source: <https://support.apple.com/guide/apple-school-manager/intro-to-users-axmf52e4f360/web>
- Source: <https://support.apple.com/guide/apple-school-manager/manually-add-users-axme2e2158c6/web>
- Source: <https://support.apple.com/en-au/guide/apple-school-manager/axm97f9b9301/web>
- Image/source status: public official Apple School Manager user-guide pages.

Apple School Manager’s relevant pattern is calm dense administration: sidebar categories, search/filter first, user lists, selected-detail panels, and bulk actions. Color is mostly neutral; emphasis is stateful rather than decorative. Typography is compact and legible, with role/status metadata secondary to the account name. Spacing density is moderate: lists remain scannable while details breathe. Empty and error states use explanatory copy, not visual noise. Focus and selection states must be unmistakable because the UI supports bulk changes. Motion is restrained and panel-oriented.

## 8. Apple Classroom iPad app — class/student controls

- Source: <https://images.apple.com/education/docs/getting-started-with-classroom-2.0.pdf>
- Source: <https://support.apple.com/en-ca/103275>
- Source: <https://education.apple.com/resource/250014829>
- Image/source status: public official guide/support pages plus Apple Education Community reference.

Apple Classroom is a useful secondary reference for warmth and teacher-facing control surfaces: student cards, screen thumbnails, top controls, and grouped actions. Semantic color is minimal and trust-oriented; monitoring states are explicit because they affect student privacy. Type rhythm is card/list based, with names and current activity foregrounded. Spacing is touch-friendly and more comfortable than EdForge’s admin tables, so EdForge should borrow the clarity and motion restraint, not the tablet density. Focus/pressed states should feel tactile, and motion should emphasize continuity when opening panels or switching groups.
