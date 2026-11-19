# Updating the tokens

> Status: Current · Last checked: 2026-11-19 against `d7219c3` and
> `scripts/export-tokens.mjs` at that revision.
> How a change made in Figma reaches the JSON in this repo and then the app.
> Read the whole page before running `--write`.

## The source of truth

Figma file `Ytr6Ux4bYZYRUBpgNsSVml` ("CodeTracer Design System"): its
**variables** (collections `brand`, `alias`, `mapped`, `space`) and its **text
styles**. The JSON here is a copy of that. A change starts in Figma unless the
section "When a hand edit is allowed" below applies.

## The procedure

1. **Change Figma.** Edit the variables in Figma. Set both Dark and Light
   values when you touch a `mapped` colour.
2. **Dump.** Run `scripts/figma-dump.js` through a Figma MCP client
   (`use_figma`) and save the result as `dump.json`, outside the repo. If the
   answer is too large, dump one collection at a time (prepend
   `const ONLY=["mapped"];`).
3. **Compare.** `node scripts/export-tokens.mjs --dump dump.json`. This prints
   added (`+`), removed (`-`) and changed (`~`) tokens. It writes nothing.
4. **Compare Light mode yourself.** The comparison in step 3 drops
   `$extensions`, where the Light values live, so **a Light-only change shows
   as "0 differences"**. Compare `$extensions.modes` between the dump output
   and the repo file by hand or with a small script before you trust step 3.
5. **Check the app before removing or renaming anything.** If step 3 shows a
   `-`:
   ```
   node scripts/check-token-refs.mjs --removed <removed-var-names> \
        --src ../codetracer/src/frontend/styles
   ```
   It fails with `file:line` when the app still uses the token. Rename those
   uses in the app in the same change, or keep the token.
6. **Write, then repair what `--write` breaks.**
   `node scripts/export-tokens.mjs --dump dump.json --write` replaces each
   `<collection>/<collection>.json` **whole**. Afterwards, before committing:
   - **brand.json:** put back the 54 typography sets (`fontSize`,
     `lineHeights`, `typography/…` and friends). They come from Tokens Studio,
     not from variables, so the dump doesn't contain them and `--write` deletes
     them. Commit `3be59c6` shows the right result: variables re-exported,
     typography sets kept as they were.
   - **mapped.json:** delete the stray `Label` token if it reappears (a junk
     variable in Figma).
   - Run `git diff --stat`. A drop of hundreds of lines in `brand.json` means
     the typography sets were lost.
7. **Commit here,** in `metacraft-labs/codetracer-design-system`.
8. **Update the app** (`codetracer`), in one pull request:
   - move the submodule `libs/codetracer-design-system` to the new commit;
   - run `scripts/tokens-to-styl.sh` to rebuild `src/frontend/styles/generated/`;
   - in `generated/brand.styl`, change `paragraphindent-0 = 0px` back to
     `paragraphindent-0 = 0` (the app bans px; the generator still writes it);
   - run `ci/test/design-tokens-fresh.sh` and
     `python3 ci/test/ui-design-decisions.py`. Both must pass.

`design-tokens-fresh.sh` rebuilds `generated/` from the **pinned** commit of
this repo. Edits that aren't committed here make the app's check fail, so steps
7 and 8 always go together.

## When a hand edit is allowed

Editing `brand`/`alias`/`mapped` JSON by hand is allowed only when the exporter
would damage the file, for example a large Light-mode change that step 4
can't confirm. Then:

- make **the same change in Figma first**, so Figma and the JSON agree;
- edit the JSON so it matches Figma exactly;
- say in the commit message that it was a hand edit, and which Figma change it
  copies (the light-theme rework D-44 was done this way, Nov 2026);
- keep a rollback file of the old values until the change has shipped.

Never hand-edit the app's `src/frontend/styles/generated/`. Rebuild it.

## Known exporter problems (fix these and this page gets shorter)

| Problem | Effect | Workaround |
|---|---|---|
| Comparison strips `$extensions` | Light-mode changes are invisible in step 3 | step 4 |
| `--write` replaces the whole file | Tokens Studio typography sets in `brand.json` are deleted | step 6 |
| Stray `Label` variable in Figma | appears in `mapped.json` | step 6, or delete it in Figma |
| Generator writes `0px` for `paragraphIndent.0` | breaks the app's px ban | step 8 |
