## Recent
[chat] When Figma gap/spacing values don't match any theme CSS variable (e.g. 64px vs --gap-xl=20px), use the raw Figma value directly — don't force-fit the nearest variable. "Prefer variables" only applies when the variable actually matches the design value.
[chat] Horizon header menu spacing: overflow-menu::part(list) sets gap:0, actual menu item spacing comes from .menu-list__link-title padding-inline — not from gap. Change --menu-horizontal-gap and ensure padding-inline references it (not --gap-xl directly).
[pipeline] Setting 'unknown' uses 'placeholders.product_title' value
[chat] Horizon: image blocks in a flex row don't get group-block--width-fill class (no flex:1), so they dominate the space. Always wrap image blocks inside a group block with width:"fill" when used alongside other blocks in a row layout.
