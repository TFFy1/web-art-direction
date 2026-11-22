# Beyond the home page: product pages and states

Design is judged in the places nobody screenshots for a portfolio: the sign-in, the settings, the error, the empty list, the 404. The best products give these the same care as the hero, in the same voice. A generic one breaks the spell faster than a weak hero does.

Library: every type below has a facet. `refs.search({ facet: 'page-404' })`, `'page-auth'`, `'page-settings'`, `'state-error'` and so on (category `pages` holds most of them). Look at two before designing one.

## Shared rules

- **Same system, quieter.** Same type, color, radius and voice as the marketing page and the app, with less expression: no scroll scenes, at most one owned detail.
- **Say what happened, then what to do,** in the product's words. Never "Something went wrong" alone.
- **Keep the person's work.** No state change throws away what they typed, chose or uploaded.
- **Every page has a way forward.** No dead ends: a next action, a way back, or a way to get help.
- **Real states, not just the happy path:** loading, empty, error, success, permission denied, offline, slow.

## Pages

| Page | What makes it good | Facet |
| --- | --- | --- |
| **404 / 500** | Says plainly that the page isn't here, offers search and the top destinations, and keeps the brand voice. One owned visual or line of wit is allowed; a giant "404" in a gradient is not. A 500 says what failed and that the team knows, offers retry, and shows a status page link and an error ID. Correct HTTP status. | `page-404` |
| **Sign-in and sign-up** | One column, one decision per screen: SSO or email, then the code or password. Show password rules up front. Use autocomplete attributes (`email`, `current-password`, `one-time-code`), show/hide password and passkeys where possible. Errors appear inline after submit, not as a top banner. A split screen with real product proof is fine; marketing noise isn't. | `page-auth` |
| **Settings** | A left list grouped by object (Profile, Workspace, Members, Billing, Notifications, Security, Integrations). Each setting is a label and a one-line description, with its control on the right. Two save models, never mixed in one group: toggles save instantly with a quiet confirmation; forms get a sticky "Unsaved changes · Discard / Save" bar. The danger zone sits last, separated, with a typed confirmation for irreversible actions. Large apps add settings search. | `page-settings` |
| **Pricing** | Plans named by who they're for, one recommended plan, a monthly/annual toggle that states the saving, and a calculator when price depends on usage. A comparison table only when the differences matter, and a billing FAQ in prose. | `page-pricing` |
| **Changelog** | Dated entries with a scannable title, a short what-and-why, real media per entry, and RSS or email. Newest first, with a filter by area when long. | `page-changelog` |
| **Careers** | Values with evidence, real photos of real people, how the process works, salary ranges, and roles you can filter. Not stock photos with "We're a family". | `page-careers` |
| **Docs** | Three columns (navigation, content at 65–75 characters, on-page contents), search on ⌘K, code blocks with copy and language tabs, previous and next links, "edit this page", and the version shown. | `page-docs` |
| **Article / blog post** | Reading type first: 18–21px body, 65–75 characters, generous leading, author and date, figures with captions, and an end that leads somewhere. | `page-article` |
| **Case study** | The customer, the problem, and the result in numbers at the top, one quote, real product shots, then the story. | `page-case-study` |
| **About** | The point of view, the people, and the history as evidence, in the brand's own voice. | `page-about` |
| **Contact** | Routes by intent (sales, support, press, partnerships), each with what happens next and when. Not one generic form. | `page-contact` |
| **Legal** | Readable: a plain-language summary at the top, contents, anchors, a last-updated date and a changelog. Set like an article, not a wall of grey. | `page-legal` |
| **Checkout** | One page, express pay first, address autocomplete, the order summary always visible, the total with tax before the button, trust detail next to the pay button, and errors inline. | `page-checkout` |
| **Onboarding** | Value before work: one question per screen with progress and skip, a sample workspace or data so the first screen is never empty, and the first real action within a minute. | `page-onboarding` |

## States

| State | Rule | Facet |
| --- | --- | --- |
| **Empty, first use** | What this place is for, one primary action, and an option to load sample data. One owned illustration or idle detail at most. | `state-empty` |
| **Empty, no results** | Repeat the query, say why, suggest a fix (clear a filter, check spelling, try a related term). | `state-empty` |
| **Empty, all done** | A quiet acknowledgement ("Inbox zero" with one small detail), not confetti. | `state-empty` |
| **Loading** | Over 300ms: a skeleton that matches the final layout exactly. Spinners only inside buttons. Long tasks show steps and progress, and can run in the background. Optimistic updates for small actions, with a visible rollback if they fail. | `state-loading` |
| **Field errors** | Next to the field, after blur or submit, never on every keystroke. Use icon plus text, not red alone. Name the fix ("Use at least 8 characters"), not the rule broken ("Invalid input"). Keep the value and focus the first error. | `state-error` |
| **System errors** | What failed, what was kept, what to do: "Your changes are saved locally. We couldn't reach the server; we'll retry in 10 s. Retry now". Add an error ID for support. Inline banners for persistent problems, toasts only for transient ones. | `state-error` |
| **Success** | Confirm in place (a check on the button, the row updating) rather than a modal. Offer the next step. Offer undo for reversible actions instead of a confirmation dialog beforehand. | `state-success` |
| **Destructive confirmation** | Name the object and the consequence ("Delete "Q3 plan"? Its 12 documents go too."). The button names the action ("Delete plan"). Red only here. Type-to-confirm for big irreversible actions. | `state-error` |
| **Permission and offline** | Say who can grant access and offer to ask them. Offline: show what still works and queue the rest. | `state-error` |

## Microcopy

- Buttons are verbs that name the result: "Create invoice", "Send reminder", "Delete plan". Never "Submit", "OK" or "Yes".
- Headings state the situation, not the mood: "This link has expired", not "Oops!".
- No exclamation marks in errors, no blame ("You entered…"), no jargon codes without a human sentence.
- Numbers, dates and money in the reader's locale, with units.

## Checking it

Build the states, not just the screens. In the browser, force each one (empty data, a failing request, a slow network, an invalid form, a narrow viewport) and screenshot it. The critic reviews these frames like a hero: does it say what happened, keep the work, and offer a way forward, in the brand's voice?
