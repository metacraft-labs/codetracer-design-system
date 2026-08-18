## The Metacraft docs token layer -- shipped BY the design system, imported by
## every docs site so no consumer re-implements it.
##
## This is the DATA half of the shared docs theme: it binds every `--docs-*`
## CSS custom property the isonim-docs framework components consume to its
## WebFlow-faithful light + dark value, using the framework's `DocsTokenLayer`
## machinery (`core/docs_tokens`). The RULES half -- the structural CSS that
## USES these variables -- is the framework's bundled `assets/style.css`.
##
## Every docs consumer previously copied a ~60-line `theme_tokens.nim` whose
## ONLY per-site variation was a hardcoded `../../../codetracer-design-system`
## relative path. That path is the one thing this repo already knows about
## itself, so the helper lives HERE and resolves its own `brand/`, `alias/`,
## `mapped/`, and `docs/` files via `currentSourcePath()` -- identical whether
## the design system is a workspace sibling or a pinned flake input in the Nix
## store. A consumer's `theme_tokens.nim` collapses to `import
## metacraft_docs_theme; export metacraft_docs_theme` (or the module is imported
## directly), so editing the tokens happens in ONE place: this repo (or the
## live design-system editor).
##
## Requires the framework (`isonim-docs/src`) on the Nim path -- every docs
## consumer already has it (see the shared consumer `config.nims`).

import std/os
import core/[tokens, docs_tokens]

export docs_tokens.emitTokensCss

const dsRoot = currentSourcePath().parentDir().parentDir()
  ## `.../codetracer-design-system` (this module lives in its `nim/` dir).

proc designSystemTokens*(): TokenSet =
  ## Loads the canonical Metacraft brand/alias/mapped DTCG token set so the
  ## layer's `bkToken` bindings resolve to concrete primitives.
  loadTokens(
    dsRoot / "brand" / "brand.json",
    dsRoot / "alias" / "alias.json",
    dsRoot / "mapped" / "mapped.json")

const docsDesignSystemJson = staticRead(
  dsRoot / "docs" / "codetracer-docs.tokens.json")
  ## The shared docs design system, embedded at compile time -- the SINGLE
  ## source of truth for the `--docs-*` tokens, consumed identically by every
  ## Metacraft docs site and the design-system editor. Edit the tokens HERE (or
  ## via the editor), not in a consumer. See this repo's DESIGN-DIVERGENCES.md.

proc metacraftDocsTokenLayer*(): DocsTokenLayer =
  ## The docs token layer, loaded from the shared design system
  ## (`docs/codetracer-docs.tokens.json`).
  loadDocsTokenLayer(docsDesignSystemJson)

const docsDesignSystemPath* = dsRoot / "docs" / "codetracer-docs.tokens.json"
  ## Runtime path to the shared token file -- the dev server WATCHES it so
  ## design-system edits hot-reload with no rebuild.

proc docsTokensCssLive*(): string =
  ## Re-reads the shared design system FROM DISK and emits its token CSS -- the
  ## dev server calls this per request + on file change, so editing the tokens
  ## updates the running site live (unlike the compile-time-embedded layer the
  ## production build uses).
  emitTokensCss(loadDocsTokenLayer(readFile(docsDesignSystemPath)),
                designSystemTokens())

proc metacraftDocsTokensCss*(): string =
  ## One-call convenience for the BUILD path: the compile-time-embedded layer
  ## resolved to CSS. A consumer's `build.nim` passes this straight to
  ## `buildSite(docsTokensCss = ...)` / the `buildDocsSite` scaffold.
  emitTokensCss(metacraftDocsTokenLayer(), designSystemTokens())
