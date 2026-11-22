# Section catalogue

Changing the kinds of sections changes how a page feels more than any amount of polish on the standard ones. The AI default is the same eight sections in the same order:

> hero → logo wall → three feature cards → how it works (1-2-3) → testimonials (three quote cards) → pricing (three columns) → FAQ accordion → CTA band → mega footer

Each of those jobs can be done by a section nobody expects. This catalogue was built by scrolling the full pages of the tier-A references (`refs.image(id, { view: 'full', top, height })`) and studio sites with the motion probe. Open the cited reference before using a section.

## By job

### Show what the product is
- **Product canvas that bleeds off the edge.** A two-line title left, a paragraph right, then a wide real UI canvas running off the right edge, with a four-column list of sub-features as links under it. Repeat with a different canvas per chapter. `linear-app`
- **Figure plates.** Three line illustrations captioned like a technical book ("FIG 0.1 Purpose-built"), no cards, no icons. `linear-app`
- **Unequal product mosaic.** Tiles of different sizes, each holding a real piece of UI for one capability, one with a photo of the physical product. Only when weights are truly unequal. `stripe-com`, `increase-com`
- **Sticky object, swapping states.** One device or document stays put while an accordion or list beside it changes what it shows. `apple-com-iphone` ("Significant others")
- **Numbered spec list over macro photo.** Capabilities set as a numbered list in display type over a blurred close-up of the product. `teenage-engineering`
- **Code or document as the hero object.** A real code block with language tabs, a real invoice, a real contract, typeset properly. `resend-com`, `ramp-com`

### Explain how it works
- **The mess, then the order.** First a collage of the chaos the customer lives with (spreadsheets, emails, receipts, five tools wired together), then the same items tidied by the product, ideally as a scroll scene. `ramp-com` ("Systems that never spoke")
- **Architecture diagram as the visual.** Flow diagrams, state machines, ledgers drawn in clean lines next to short text and a quote. `increase-com`
- **Horizontal track of steps.** The process runs sideways while the page is pinned; each step is a full panel, not a numbered card.
- **One worked example.** Follow one real case end to end (one invoice from photo to books), with the real numbers.

### Prove it
- **Live metric.** A counter or ticker tied to something true and sourced. `stripe-com`, `ramp-com`
- **Customer story with documentary photo and facts row.** One large photograph of the customer's world, then three facts in a row, then other stories as a plain list of one-liners with logos. `stripe-com`
- **Quote as a callout, not a card.** One quote on a tinted field with a mono attribution and one number from that customer. `increase-com`
- **Logo grid as a ruled table.** Client marks in a strict grid with hairlines, like a register. `basement-studio`
- **Depth cloud of people.** Photos scattered at different depths around one sentence. `landonorris-com`
- **Video testimonial frame.** One person talking, shot well, with the quote overlaid. `mercury-com`

### Show range or catalogue
- **Index with images inside the type.** A huge serif list of names with small thumbnails set inside the lines. `locomotive-ca-en`
- **Lineup strip.** The whole range as one horizontal row, working as navigation. `apple-com-iphone`, `becaneparis-com`
- **Collection grid on black.** Objects photographed alike, with year and name, like a museum drawer. `landonorris-com` helmets
- **Category photo tiles with filter chips.** Values or categories as chips that swap the content. `faire-com`

### Interrupt and reset the eye
- **Full-bleed photograph or video.** Edge to edge, no text or one line. `heartaerospace-com`, `stripe-com` (event banner)
- **Drenched color band.** A whole section in one brand color with a single statement. `faire-com`, `cloudflare-com`
- **Diptych.** Two photographs side by side, edge to edge, no gap. `teenage-engineering`
- **Statement paragraph.** One sentence at display size with the second half in grey. `linear-app`, `anthropic-com`

### Price
- **Pricing as a price list or menu.** Set like a café menu, a hardware spec table, or a receipt, matching the concept, not three floating cards.
- **Calculator.** The visitor enters their size and sees their price. Useful when plans depend on volume.
- **Comparison table with one recommended column drenched.** Only if the feature differences matter.

### Answer questions
- **Two-column Q&A in prose.** Questions as bold lead-ins, answers as short paragraphs; no accordion when there are fewer than eight.
- **Conversation.** Questions and answers set as a chat transcript or a letter, when that fits the voice.
- **Accordion paired with an image that changes per question.** `apple-com-iphone`

### Close
- **Giant wordmark footer.** The brand name across the full width, links tiny beneath. `basement-studio`, `tines-com`
- **Scattered photo collage around one sentence and one link.** `faire-com`
- **Signature statement.** A short line and a mark with lots of space, nothing else. `teenage-engineering` ("designed and engineered by…"), `claude-com`
- **Rounded frame rising from the bottom.** The last section arrives as a framed panel with the hero object returning. `landonorris-com`

## Composing the page

1. List the jobs this page must do (from the brief), then pick one section per job from this catalogue. At least half of the sections must come from outside the AI-default list above.
2. **No two neighbors share a container type** (full-bleed, narrow column, wide grid, offset, pinned scene, horizontal track).
3. **At most one card grid** on the whole page.
4. **One section is the signature scroll scene** (see motion.md), and it sits where the product's core verb is explained, usually second or third.
5. Section openings vary: some start with the object, some with one line, some with a number, some with no heading at all (lesson L016).
6. Say for each section why its form fits its content. "A list because services are names, not features" is a reason; "looks premium" is not.
