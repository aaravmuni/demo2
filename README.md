# Unified Online Services Portal — UX Friction Demo

A deliberately **unwieldy, multi-page mock bank application**. It exists to
demonstrate how user-interaction data surfaces common pain points: each step
has *intentionally* awkward UI, fake "server" delays, and planted
(recoverable) bugs. Nothing here is a real financial product — all data is
simulated and stays in your browser tab.

## How to run

Pure static site, no build, no backend, no external dependencies.

```bash
cd bank-ux-friction-demo
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

Or just open `index.html` directly in a browser.

State lives in `sessionStorage` for the tab, so a reload keeps most of your
progress. **Start Over** (left rail) or the final **Begin New Application**
clears it. Some planted bugs latch onto first-attempt flags in the same store.

## The journey (genuinely multiple pages)

| Page | Heading | What it is |
|------|---------|------------|
| `index.html` | Application Module | Disclosure gate + type selection |
| `step1.html` | Form A | Identity / contact fields |
| `step2.html` | Document Test | File uploads + verification |
| `step3.html` | Form B | Categorisation, values, attestations |
| `step4.html` | Validation Test | CAPTCHA + one-time code |
| `step5.html` | Summary Output | Review + submit |
| `done.html`  | Process Complete | Acknowledgement |

Headings/labels are deliberately generic and bureaucratic ("Document Test",
"Field 9", "ATT9C", "Designation Code") — there is no friendly helper copy,
by design.

## Planted friction map (what to point at during the demo)

Every item below is **recoverable** — a frustrated user can still finish.
The "signal" column is what your interaction-analytics layer would light up.

### Cross-cutting
- **Misleading progress bar.** The denominator changes between pages
  (`1 of 4` → `2 of 4` → `2 of 5` → `4 of 5` → `4 of 6` → `5 of 5`) and the
  step number jumps. → *Signal:* confusion / back-navigation, low trust in progress.
- **Fake server delays on every action.** Jittered 1.5–5.5s overlays
  ("Please Wait") on navigation, save, recalculation, upload validation, OTP
  issue, and submit. → *Signal:* time-on-task, wait abandonment, repeated clicks.
- **Inactivity modal interrupts mid-task** (sooner on the Validation page) and
  doesn't actually log you out. → *Signal:* interruption, focus loss.
- **Unhelpful "Logout"/"Save & Exit"** that confirm and then do nothing useful.

### index.html — Application Module
- **Terms gate:** the *I acknowledge* checkbox only enables after you scroll a
  tiny disclosure box all the way to the bottom. → *Signal:* dead time, scroll hunting.
- **Disabled Continue with no explanation** until acknowledged.
- **`-- Select --` trap:** leaving Selection Type unset errors; "Type X" is
  selectable but rejected as restricted. → *Signal:* error rate on first submit.

### step1.html — Form A
- **Phone mask rejects plain digits.** "Contact Sequence" demands
  `(NNN) NNN-NNNN`; valid `5551234567` is rejected. → *Signal:* format errors, edits.
- **Date format contradiction.** Placeholder says `MM/DD/YYYY`, the rule is
  `DD/MM/YYYY`. → *Signal:* validation errors, hesitation.
- **Laggy auto-normalising field.** "Designation Code" uppercases and strips
  spaces ~320ms after you type, yanking the caret. → *Signal:* re-typing, caret churn.
- **Reset-on-error.** Any validation failure clears Primary Identifier and
  Designation Code "for your protection." → *Signal:* rage, repeated entry, drop-off.
- **Scrambled tab order** via `tabindex`. → *Signal:* erratic focus path.
- **Silent data loss:** "Reference Number" is never persisted → shows blank on
  the review page. → *Signal:* surprise at review, back-tracking.

### step2.html — Document Test
- **Document A fails a checksum on the first upload** (`ERR_DOC_0x4`), succeeds
  on re-upload. → *Signal:* retry loops, upload abandonment.
- **"Optional" supplemental is actually required** to enable the action.
  → *Signal:* stuck users, mystery-disabled button.
- **Hint vs. reality mismatch** on accepted file types; cryptic error codes
  (`ERR_DOC_0x2/0x5/0x9`). → *Signal:* error rate, support intent.
- **Long (~4s) "registry validation"** with cycling sub-messages.

### step3.html — Form B
- **Giant unsorted cryptic dropdown** (~58 `CC-XXNNN / 0xNN` codes).
  → *Signal:* long dwell on select, mis-selection.
- **Integer-only money field** rejects commas/decimals/symbols. → *Signal:* errors.
- **Recalculate ignores the first click,** then stalls ~3s. → *Signal:* double-clicks.
- **Required attestation below the fold** (`ATT9C`); the error names the field
  id, not the label, and lives at the top. → *Signal:* scroll hunting, confusion.
- **Back/Next swapped** to the wrong sides vs. every other page. → *Signal:* mis-clicks.

### step4.html — Validation Test
- **Case-sensitive distorted CAPTCHA;** wrong response re-issues a new one.
- **One-time code "delivered" to a tiny note** (and the console) after a ~3s
  send. → *Signal:* hunting for the code.
- **OTP boxes auto-advance but Backspace is disabled** — you must click each box
  to correct. → *Signal:* correction friction.
- **Wrong code regenerates the CAPTCHA** too, compounding the redo.

### step5.html — Summary Output
- **Review shows the dropped Reference Number as "— not on file —".**
- **Edit links** drag you back through the navigation delays.
- **Submit has a hidden dependency:** it needs both the certify checkbox **and**
  a prior "Print Preview" click — the requirement is undocumented.
  → *Signal:* stuck-at-submit, mystery-disabled button.
- **First submission fails** (`ERR_SUBMIT_0x11`); retry succeeds. → *Signal:* retry, anxiety.

## Notes
- Per the project brief, there is **no built-in telemetry/analytics panel** —
  the page only manufactures the friction. Point your own interaction-capture
  tooling at it to record clicks, dwell, errors, rage-clicks, and drop-off.
- All bugs are intentional and recoverable. If you genuinely get stuck, use
  **Start Over** in the left rail.
