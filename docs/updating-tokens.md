# Updating the tokens

> Status: Current · Last checked: 2026-11-19, after the exporter learned to
> export typography from Figma's text styles (option (i) in
> `scripts/TOKEN-EXPORT-CONVENTIONS.md`).
> How a change made in Figma reaches the JSON in this repo and then the app.
> Read the whole page before running `--write`.

## The source of truth

Figma file `Ytr6Ux4bYZYRUBpgNsSVml` ("CodeTracer Design System"): its
**variables** (collections `brand`, `alias`, `mapped`, `space`, each to
`<collection>/<collection>.json`) and its **text styles** (to
`typography/typography.json`). Variable **descriptions** become `$description`.
The JSON here is a copy of that, nothing more. A change starts in Figma unless the
section "When a hand edit is allowed" below applies.

## The procedure

1. **Change Figma.** Edit the variables in Figma. Set both Dark and Light
   values when you touch a `mapped` colour.
2. **Dump.** Run `scripts/figma-dump.js` through a Figma MCP client
   (`use_figma`) and save the result as `dump.json`, outside the repo. If the
   answer is too large, dump one collection at a time (prepend
   `const ONLY=["mapped"];`) and pass every file: `--dump brand.json
   --dump alias.json …`.
3. **Compare.** `node scripts/export-tokens.mjs --dump dump.json`. This prints
   added (`+`), removed (`-`) and changed (`~`) tokens, in every mode, and
   description-only changes marked `[description]`. It writes nothing.
4. **Check the app before removing or renaming anything.** If step 3 shows a
   `-`:
   ```
   node scripts/check-token-refs.mjs --removed <removed-var-names> \
        --src ../codetracer/src/frontend --src ../codetracer/src/tui
   ```
   It fails with `file:line` when the app still uses the token. Rename those
   uses in the app in the same change, or keep the token.
5. **Write.** `node scripts/export-tokens.mjs --dump dump.json --write`
   replaces each file whole with what Figma holds. Nothing needs repairing
   afterwards.
6. **Confirm.** `node scripts/validate-collection.mjs <file>` per file; the
   numbers must equal the ones the same check gives inside Figma.
7. **Commit here,** in `metacraft-labs/codetracer-design-system`.
8. **Update the app** (`codetracer`), in one pull request:
   - move the submodule `libs/codetracer-design-system` to the new commit;
   - run `scripts/tokens-to-styl.sh` to rebuild `src/frontend/styles/generated/`;
   - run `ci/test/design-tokens-fresh.sh` and
     `python3 ci/test/ui-design-decisions.py`. Both must pass.

`design-tokens-fresh.sh` rebuilds `generated/` from the **pinned** commit of
this repo. Edits that aren't committed here make the app's check fail, so steps
7 and 8 always go together.

## When a hand edit is allowed

Practically never: the exporter now writes every file faithfully. If you must
(for example Figma is unreachable), make the same change in Figma first, edit
the JSON to match it exactly, say in the commit message that it was a hand
edit, and run the export at the next chance to confirm the two agree.

Never hand-edit the app's `src/frontend/styles/generated/`. Rebuild it.

## History

Until 19 Nov 2026 the comparison ignored Light mode, `--write` deleted the
Tokens Studio typography sets kept in `brand.json`, and descriptions written in
Figma never reached the repo. Light-theme rework D-44 was copied by hand for
that reason. All three are fixed; typography now comes from Figma's text styles.
