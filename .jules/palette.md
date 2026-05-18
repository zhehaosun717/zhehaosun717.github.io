## 2024-05-15 - Visually Hidden Form Labels
**Learning:** The contact form relies on placeholders for visual design, causing screen readers to lack explicit form context. Adding standard labels breaks the layout.
**Action:** Apply `.sr-only` to explicit `<label>` tags and link them to input IDs (`contact-name`, `contact-email`, `contact-message`) to ensure screen reader support without disrupting visual design.
