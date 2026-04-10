## Proposed Plan
1. Add `*:focus-visible` pseudo-class to `css/main.css` to enforce global keyboard focus visibility with a gold outline (`var(--accent-gold)`).
2. Enhance `.project-card-header` in `index.html` by adding `role="button"`, `tabindex="0"`, and `aria-expanded="false"` for screen readers and keyboard navigation.
3. Update `js/main.js` to manage the `aria-expanded` state dynamically when expanding/collapsing project cards, and add a `keydown` listener for 'Enter' and 'Space' to make the headers keyboard-activatable.
4. Complete pre-commit steps to make sure proper testing, verifications, reviews, and reflections are done.
5. Create a `.jules/palette.md` entry if necessary to record this finding.
6. Verify locally and then present the PR.
