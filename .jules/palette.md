## 2024-06-25 - Contact Form Input Accessibility
**Learning:** Placeholders are not a substitute for explicit labels in screen readers. Relying solely on placeholders for form fields degrades the experience for users dependent on assistive technologies, as the accessible name may be missing or lost when the user types.
**Action:** Always provide explicit `<label>` elements linked via `id` to their respective inputs. If a visual label disrupts the design, use the `.sr-only` utility class to ensure accessibility without compromising aesthetics.
