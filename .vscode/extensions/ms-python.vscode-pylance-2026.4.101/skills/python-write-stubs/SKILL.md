---
name: python-write-stubs
description: 'Use when the user explicitly asks for the Python stub-writing skill, wants to create or improve `.pyi` type stubs for a third-party Python package, or needs partial stubs under a workspace `typings/` directory without modifying installed package source. Generates stubs through Pylance, resolves uncertain types with the Python type-inference skill, and validates public API, diagnostics, runtime compatibility, and type completeness.'
---

# Python Write Stubs

Create or improve `.pyi` files for Python code the user does not own, especially installed third-party
packages. Write only to the workspace stub path, normally `typings/`. Never edit `site-packages`.

Use `python-type-inference` for every non-trivial type decision. Pass `allowHelperDeclarations=true` only when a
private type-only helper such as a `Protocol` can be declared without inventing or exporting a runtime symbol;
otherwise pass `false` and leave helper-dependent results unresolved. A stub is correct only when it describes
the runtime API without inventing symbols, changing signatures, or hiding unresolved types behind `Any`.

## Scope the requested outcome

Distinguish a workspace-only overlay from a distributable or upstream typing contribution before following the
workflow. For a workspace overlay, use the selected interpreter, installed package version and workspace's supported
Python versions. Keep the entire replaced module faithful, including required private cross-module helpers, but
do not expand a request for selected modules into package-wide type completeness.

Publication-only checks about upstream authentication, release overlap and current-main distribution layouts apply
when preparing a contribution, not when authoring a local overlay. Contract, syntax, semantic, caller and runtime
checks still apply to the selected module. VerifyTypes measures completeness when that is the requested goal; it
does not determine whether a local partial stub is consumed. A requested private helper need not be an unknown
public export to require authoring work.

When another workflow requests stubs, return the refined contents, typing evidence and unresolved obligations to
that workflow. Performance candidate selection, ranking, timing, iterative retention and final disposition belong
to the requesting performance workflow, not this skill. Do not substitute a completeness score for its measurements
or require package-wide completeness for a selected-module request.

## Preserve known types and module bindings

A partial package still replaces each authored module in full, not just its selected symbol. Preserve public
bindings and reexports, members of locally declared classes, existing annotations and required private cross-module
helpers. A source/stub type difference, an uncertain call or missing caller coverage is not by itself evidence that
an annotation is wrong. Resolve the actual contract through `python-type-inference` and distinguish source
uncertainty from a newly introduced loss.

A supported known type becoming `Any` or `Unknown` is a concrete typing regression, not merely missing evidence.
Omitting a return annotation can cause this loss: a generated `# -> T` comment does not preserve the source's
inferred return `T` in an ellipsis-body stub. Preserve known branches of partly-unknown unions and known components
inside containers, nested tuples and generators; an unknown component does not justify erasing the others.
Preserve type-variable relationships and exact nominal identities rather than substituting a same-named class,
duplicate declaration or structural stand-in. Compare recorded baseline types with consumed candidate types,
including observed method returns outside the measured entry point. Unchanged diagnostics, runtime checks or
the main workload's hover do not establish that those types survived. Correct the loss through the inference
workflow or restore this attempt's pre-candidate state; do not retain it by relabeling the loss as an unresolved
type or a reporting defect.

## Save and restore only this authoring attempt

Save the contents or absence of every path the attempt changes. Refine a retained stub in place, preserving its
annotations, imports and helper declarations; do not overwrite it with an unrefined generated seed.
If the attempt is rejected, restore only its changes to that immediate baseline, not the original state of the
whole requesting workflow. Delete only files created by this attempt. Preserve a pre-existing shared `py.typed`
marker and sibling stubs. An additional module must coexist with existing stubs, not replace their typing package.

## Workflow

1. **Resolve the package and output roots.**

    - Call `pylanceWorkspaceRoots` to identify the project that will own the stubs.
    - Use the selected Python environment and import resolution to locate the installed package.
    - Read `stubPath` from `pyrightconfig.json`; when absent, use `<projectRoot>/typings`.
    - Keep full stubs under `<stubPath>/<topLevelPackage>/` and partial stubs under
      `<stubPath>/<topLevelPackage>-stubs/`. Reject any plan that writes into the installed package or outside the
      selected workspace.

2. **Prove semantic viability before measuring completeness.**

    - Distinguish the installed distribution name and discovered import package. For a contribution, also resolve
      the authoritative typeshed path and possible `types-*` distribution names. Use the installed wheel and current
      default-branch source as primary contribution evidence; package-coverage datasets and released sdists are
      discovery inputs only. Re-run live issue, pull-request, branch, typeshed, and PyPI stub-package overlap checks
      before selecting a contribution candidate.
    - Use the workspace's supported Python versions for a local overlay and validate with Pylance and the workspace's
      other configured checkers. For a contribution, require strict Pyright and strict mypy at the oldest supported
      version from the current default branch. In the required checkers, import every required public stdlib, `typing`,
      `typing_extensions`, and external nominal identity in the smallest representative stub. Use an interpreter at
      that version when runtime availability differs from a checker's synthetic target. Reject the candidate when
      exact typing requires private `_typeshed` identities, an undeclared optional dependency, a duplicate nominal or
      structural stand-in, or a name unavailable to a required checker.
    - For a contribution, probe the full runtime domain before drafting the module. For a local overlay, select
      relevant runtime and negative-input probes for the changed contracts without expanding to an exhaustive
      package-wide runtime proof. Relevant cases can include arbitrary accepted
      values; buffer, path, numeric-conversion and callback inputs; actual MRO and mutable inherited fields;
      override substitutability; descriptors and function attributes; monkeypatches; callable arity or introspection;
      generated aliases; and native or external nominal objects. Compile the smallest relevant inheritance,
      callback and overload skeleton plus structurally plausible but behaviorally invalid values. Reject before
      marker creation when the contract requires `Any` or `object` erasure, suppression, false inheritance, omitted
      visible names, or a runtime redesign.
    - For a local overlay, resolve its import root from the installed package layout before creating `py.typed`.
      For a contribution, freeze the current-main wheel and sdist layouts and discover every import root.
      Account for bundled tests, vendored and generated modules, namespace packages, and single-file distributions.
      Do not place a marker under a distribution-name guess or convert a module into a package merely to publish
      PEP 561 metadata.
    - Treat syntactic annotation percentages as candidate-discovery signals, not semantic completeness evidence.
      Results produced with `--ignoreexternal`, filtered tests, or omitted public modules cannot prove a candidate
      viable. A benchmark cannot replace required checker, stubtest, surface or runtime validation.

3. **Freeze the baseline.**

    - For an upstream contribution, read `CONTRIBUTING`, the pull-request template, and repository automation
      policies before authoring. Establish whether AI-authored code is accepted and whether the proposed typing
      change can truthfully satisfy every mandatory checkbox. Stop before implementation when repository policy
      prohibits the contribution; never misrepresent authorship or scope.
      Before authoring, also verify that the environment has an authenticated fork, push, and
      pull-request path to the actual upstream host. Do not substitute a mirror or spend effort on an unpublished
      candidate when the required host cannot be authenticated.
    - Record the installed package version and supported Python versions.
    - Freeze two separate baselines: the runtime module's public bindings and the active typing surface that
      consumers currently see. Record the exact source and resolved declaration URIs, interpreter, package version,
      and relevant analysis settings. Use `pylanceTypeAuthoring` `command="getPublicSurface"` on the source and active
      stub when applicable, and confirm dynamic exports with runtime or implementation evidence.
      Class/member expansion means missing-entry counts are not counts of distinct module-level exports.
    - Turn those results into a binding inventory before generating the candidate. For each module-level binding,
      record its name, defining module/declaration, local declaration or reexport, known baseline annotations, and
      preservation or inference work still needed. Use document symbols and cross-module references to add required
      private helpers that the public surface omits. Keep an imported class as one identity-preserved binding, not
      hundreds of copied member declarations; retain the members of classes actually defined by the target module.
      Track each obligation as preserved, verified or unresolved, with its supporting evidence. Reconcile this
      inventory after generation, refinement and final validation, rather than relying on aggregate symbol counts.
    - When a shipped or bundled stub is active, retain its known annotations as baseline evidence; generating from
      `.py` alone can lose them. If the user intentionally disabled bundled stubs for source-inference validation,
      do not re-enable or copy those stubs into the candidate. Preserve the selected analysis environment and
      distinguish this baseline from any earlier run with bundled stubs enabled.
    - Capture diagnostics for the consuming workspace with `pylanceLSP`
      `workspace/diagnostic`.
    - When the goal includes public type completeness, run `pyright --verifytypes <package> --outputjson` in the
      selected environment when the package is importable there.
    - Record the owning module for target declarations, including requested private helpers or ambiguous/unknown
      exports. Generate a partial stub only for a module that owns a target declaration; a top-level stub cannot
      improve an incomplete submodule merely by re-exporting it.
    - Before authoring bundled stubs for an untyped distribution, create a disposable package copy with the
      intended `py.typed` marker and run unfiltered VerifyTypes. Freeze the modules and accidental reexports that
      become public under PEP 561. Reject or explicitly scope the candidate before writing stubs if completeness
      would require typing shipped tests, vendored code, or unrelated external-package reexports merely to raise
      the aggregate score.
    - For a contribution whose goal includes package completeness, treat 100% as an aspirational result, not a
      prerequisite for a useful contribution. When one public module or external boundary cannot be represented
      faithfully, select a coherent subset of modules or inline contracts that can. Every authored `.pyi` must still
      preserve the complete visible surface of its corresponding runtime module; never publish a truncated replacement.
      Leave blocked modules unstubbed, document their remaining unknowns, and require a genuine known-export gain
      with no regression. A `py.typed` marker reports typing support; it does not promise a 100% VerifyTypes score.
      Measure each plausible module subset separately and record known, ambiguous, unknown, and total exports.
      Rescope when a broader candidate increases unknown exports without enough public API value. Accept a larger
      denominator only when it comes from faithfully declaring runtime-visible imports or reexports. Reject a
      helper-only gain that leaves the package's documented API untyped, even when its percentage improves.
    - If an upstream maintainer requests direct inline annotations instead of sidecar stubs, stop expanding the
      `.pyi` implementation and switch to `python-add-type-annotations`. Treat the conversion as a fresh semantic
      pass, not a declaration-by-declaration transcription: inline types affect runtime imports, reflection,
      inheritance, and mutable state. Retain only contracts whose complete runtime domain is proven, omit uncertain
      surfaces instead of using `Any`, `object`, broad unions, casts, suppressions, variadic escapes, or invented
      protocols, and remove superseded `.pyi` files. Keep `py.typed` when the package publishes the resulting
      inline PEP 561 typing.
    - Compile a minimal stub skeleton for the riskiest inheritance and overload relationships before filling the
      package. When a contract requires an incompatible override, overlapping overloads with different returns,
      or another representation that needs suppressions, weakened types, omitted APIs, or a runtime redesign,
      exclude that module or coherent unit and search for unaffected useful modules. Reject the whole package only
      when no independently valuable, surface-complete unit remains.
      Include mutable inherited fields in this skeleton. If the runtime subclass replaces a base field with an
      invariant container whose element type is incompatible with the authoritative base stub, omitting the field
      exposes a false inherited type and redeclaring it is also unsound. Exclude that nominal hierarchy rather than
      dropping the real base class or inventing a replacement.
    - Treat permissive callback or method protocols as hypotheses, not proof. A `ParamSpec` can make checker and
      stubtest validation pass while accepting implementations that violate required call arity, argument
      adaptation, or state relationships. Exercise at least one structurally compatible but behaviorally invalid
      implementation and reject the protocol if the checker accepts it; model the real dependency contract or
      exclude the affected unit instead of using variadics to erase it.
      When runtime behavior branches on `inspect.signature`, declared parameter count, or another callable-shape
      detail, test optional-parameter and variadic callbacks explicitly. Static callable compatibility may accept
      values that runtime introspection routes incorrectly; reject the unit when no type accepts exactly the
      runtime-supported callback set.
    - Preserve the nominal identity of public external classes and modules. If the runtime exports or stores an
      actual constructible class or mutated module from an untyped dependency, a local protocol, duplicate nominal
      class, or hand-written replacement is not faithful even when it exposes the same members. Confirm whether an
      authoritative dependency stub exists; otherwise reject complete unfiltered typing when success would require
      vendoring external stubs, omitting the public value, or replacing its runtime identity.
      Do not treat a dependency's `py.typed` marker as evidence that its public nominal types are usable. Measure
      the exact installed dependency with unfiltered VerifyTypes or inspect its shipped declarations; an empty
      marker, sparse type comments, or exported `Any` can still make a derived public class impossible to type
      faithfully.
    - Record hashes of installed package source files. Stub work must not change them.
    - Run a focused import/runtime smoke check for platform-dependent exports and representative public
      objects.

4. **Generate a non-mutating preview first.**

    - For a partial stub of one selected module, call `pylanceInvokeRefactoring` with:
        - `name="module.createPartialStub"`
        - a workspace `fileUri`
        - the target `importName`
        - the installed module's `targetFileUri`
        - `requiredDeclarations` with the selected declaration paths, including requested private functions and
          required cross-module helpers
        - `mode="string"` or `mode="edits"`
    - For a full stub of the selected module or package, call `pylanceInvokeRefactoring` with:
        - `name="module.createTypeStub"`
        - a workspace `fileUri`
        - the target `importName`
        - `mode="string"` or `mode="edits"`
          Use the selected source target and focus symbol supplied by the request to resolve the intended import, but
          preserve the full generated package surface rather than narrowing the output to that symbol.
    - Inspect every returned URI before writing. A partial package must include `py.typed`. Copy its exact
      generated contents from the preview's `files` entry, including the terminating newline, rather than
      reconstructing the marker from a name or label.
    - Treat the preview as a skeleton, not a completed replacement module. Read each file's exact text from
      the partial preview's `files` map; full-stub string previews return the bare URI-to-content map.
      Generated return-type comments are not annotations.
      Check omitted bindings and lost known annotations against both frozen baselines before refining a signature.
      Treat an omitted return annotation as refinement work, not a failed generation. Use generated `# -> ...`
      comments as inference hints: they can omit unknown union members and are not necessarily complete contracts.
    - Partial-stub `string` and `edits` previews return one JSON text item containing `command`, `mode`, `files`,
      `generatedPreview`, and `validation`. In `edits` mode, `edit` contains the unchanged `WorkspaceEdit`.
      Read `files` and `validation.reports` from that same payload. The report identifies missing actual return annotations,
      missing public bindings, local class members or selected private declarations, unresolved imports,
      changed nominal identities and known returns lost to `Any`/`Unknown`, including partly-known nested types.
      Its hints are not binding annotations. A missing selected function in the correct module is authoring work,
      not by itself a reason to reject the skeleton.
      Partial seeds preserve static imports, private declarations and existing source annotations. Constructor
      field annotations can be retained as class declarations; inferred field or return types still need refinement.
    - Use `generatedPreview.moduleCount` and the file inventory to establish generated scope. The count includes
      `.pyi` files only, not `py.typed`. Each `generatedPreview.files` entry records `uri`, `kind`, `utf8Bytes`,
      `lineCount`, and `sha256` for the exact generated text. Physical line counts exclude the empty line after a
      final newline; empty content has zero lines. These are generated-preview measurements, not refined or
      applied sizes, and do not certify correctness. Recompute measurements from the actual saved files after
      refinement rather than reporting preview sizes as applied sizes.
    - Before installation, call `pylanceTypeAuthoring` with `command="validateStubDraft"`, the source `fileUri`,
      intended `stubFileUri`, current `stubContent`, and the same `requiredDeclarations`. This accepts unsaved draft
      text; a physical overlay need not already be analyzed. Keep the source baseline separate from the overlay.
      Resolve findings through `python-type-inference`, edit the draft, and recheck the exact contents after each
      refinement. Deleting a generated comment does not resolve a missing annotation. Attempt supported repairs
      within the agreed budget before rejecting an incomplete seed; if a required contract cannot be represented,
      report its evidence and restore only this attempt.
      Require valid syntax and completed analysis; an error or incomplete report is not a clean result. Read
      `source.semantic.status`, `semantic.status`, both diagnostic lists, `analysisComplete`, findings and limitations.
      Completed analysis means the checks ran, not that the draft passed. Compare source and draft diagnostic
      evidence to distinguish pre-existing errors from draft-caused errors, including invalid imports.
      Match the returned source/draft hashes to the compared contents. `sourceReturnUncertain` limitations remain
      uncertainty, not proof of a regression or a requirement for complete package typing; they do not cancel
      known-component findings on the same return. `typeComparisonUnavailable` and `importResolutionUnavailable`
      mean the corresponding checks did not complete. Report those gaps rather than calling the draft validated.
      Read `typeDifferences` for the affected component and source/draft nominal identities, then repair the actual
      annotation, import, class base, overload or declaration and recheck.
      This focused check does not prove callable-parameter equivalence, dynamic exports, runtime correctness or
      consumed-overlay behavior. Keep the frozen binding inventory and the checks below.
    - A preview string or edit is not an analyzed file. `compareStub` takes file URIs, not unsaved JSON contents.
      Inspect the preview against the frozen inventory first. Semantic comparison requires actual analyzed source
      and stub files; use an approved, restorable validation location and verify those exact files are analyzed.
      If that is unavailable, report the unperformed comparison rather than claiming the preview passed it.
    - Reject a preview whose generated modules do not overlap the modules that own the selected declarations or
      target exports.
    - Treat an auto-generated source module as an ownership boundary. When its incomplete exports are literal
      data tables, do not add annotations to the generated `.py` file; create a stub for that module instead.
      Preserve its complete visible surface, including metadata such as `__version__`, and resolve each table's
      key, value, and nested item types before writing the declarations.
    - Treat native-extension targets (`.pyd`, `.so`, or equivalent) as an explicit boundary. Generation may
      produce a syntactically valid but empty stub because there is no Python parse tree. Never accept that
      output when runtime introspection exposes public names.
    - If a native extension ships a sibling stub package, use it as baseline evidence but do not assume it is
      complete. A workspace overlay replaces that module's stub surface, so preserve every baseline declaration
      and add runtime-public omissions rather than stubbing only the missing name.
    - For a selected-module stub, inspect `getPublicSurface` before investing
      in completion work. Prefer modules with a supported static `__all__` that authoritatively bounds the
      surface. If publicness falls back to runtime-visible imports, reconcile module-level omissions before
      polishing one signature. Reject the module when a surface-complete replacement cannot be authored faithfully;
      do not hide the gap by deleting APIs.
    - For a package that already ships `py.typed`, prove the generated partial stubs are consumed by the
      selected analysis environment before relying on them. Do not assume that bypassing the UI code-action
      gate makes the overlay effective.

5. **Write only the approved candidate for refinement and validation.**

    - Use `mode="update"` only after the preview has the correct root and file inventory.
      A fresh generation does not contain Copilot's draft refinements: apply the validated refined contents,
      not an unrefined regeneration. The draft report is feedback, not an automatic apply or acceptance gate.
      Save the prior overlay state before staging a candidate. Do not deploy an incomplete skeleton as a finished
      artifact. If remaining checks expose a concrete regression, correct or restore this attempt's changes.
      Return incomplete contents and specific unresolved obligations honestly to the requesting workflow.
      Preserve the preview's generated-file inventory and metadata, then read back every authored `.pyi` and
      `py.typed`. Call `validateStubDraft` with the original source `fileUri` and actual saved `stubFileUri`,
      omitting `stubContent` to select saved-file validation. Do not re-send the pre-application LF draft:
      saved bytes, including CRLF, can differ from the parameter text.
      Read `draft.input`, `draft.originalUri`, `draft.utf8Bytes`, and `draft.sha256` and match the identity to the
      actual saved artifact. Keep generated-preview measurements separate from saved/refined measurements.
      Read `packaging.status`, `packaging.marker`, and `packaging.findings`. For a partial `-stubs` package
      under the configured stub path, require the saved marker's `isPartiallyTyped` result to be true and resolve
      `missingPartialStubMarker` or `invalidPartialStubMarker` through supported edits. Missing or unreadable
      saved stubs, unreadable markers, and ambiguous source overlays are errors, not clean checks;
      `notApplicable` means this packaging check does not cover the target.
      Edit tools can drop final terminators: seven-byte `partial` is not a valid partial marker. Preserve the
      generated directive and its LF or CRLF terminator; an explicit blank line in the edit can retain that
      terminator. Read back after repair, record the actual bytes/hash, and rerun saved-file validation.
      A completed write or an earlier raw preview report does not validate a later saved artifact. A packaging
      check alone does not prove type correctness or live consumption: verify consumed caller types after
      repair using the validation checks below.
    - Preserve module names, public names, parameter names, parameter kinds, defaults, decorators, overload
      structure, class bases, and generic parameters.
    - Preserve every pre-existing public annotation from the source or shipped stub unless independent API,
      implementation, or compatibility evidence proves a different contract. In particular, do not replace an
      existing `Any` with `object` or a narrower container merely for completeness or style; that can narrow the
      public API without improving VerifyTypes. Choose `object`, `Any`, or a generic for newly resolved types
      from their semantics.
    - Classify every proposed `object` annotation before writing it:
        - **Opaque input**: the runtime accepts every value and only stores, compares, formats, or passes it through.
        - **Opaque output**: the runtime can genuinely return unrelated values and callers must narrow.
        - **Correlated relationship**: input, output, callback, container, or subclass types are related; prefer a
          `TypeVar`, overload, protocol, or finite union when it preserves that relationship.
        - **External unknown**: an untyped dependency hides a nominal type; do not replace that unknown with
          `object`, a duplicate nominal class, or a structural stand-in.
        - **Under-specified**: runtime operations establish a base class, protocol, finite union, `TypedDict`, or
          recursive alias; write that contract instead.
          `object` is not a suppression-free spelling of `Any`. Keep it only when runtime evidence proves the opaque
          contract or when checker experiments prove the useful relationship cannot be expressed faithfully.
    - Before narrowing a mutable generic return, field, or override, test invariance and base-class
      substitutability in each required checker. A runtime value being concrete does not make
      `MutableContainer[Concrete]` a subtype of `MutableContainer[object]`.
    - Validate class-object registries and generated metadata against every runtime member. Prefer an exact
      descriptor union or recursive alias over `object`, but retain a broader class-object contract when
      parameterization disagrees with runtime identity or unflagged stubtest.
    - Treat checker suppressions in source or a shipped stub as uncertainty boundaries. Do not manufacture a
      more precise stub contract solely from a declaration its maintainers explicitly suppressed; require
      independent runtime, documentation, test, or call-site evidence.
    - Treat each generated `.pyi` as a replacement for that module's visible surface. Restore public names
      omitted by generation, including public dunder aliases, before relying on the stub.
      Plain imports in a stub need not be public reexports. For a verified imported class, an explicit same-name
      reexport such as `from dependency import PublicClass as PublicClass` preserves its identity and restores its
      members without duplicating the class declaration. Use the actual owning module, not an invented substitute.
      For renamed or dotted imports, preserve the actual class/module value and loaded child modules. Verify both
      definition identity and consumer member access; matching the root name alone does not preserve a dotted import.
      Resolve the exact nominal import in the analyzed draft even when missing-import diagnostics are disabled;
      a clean parser does not prove that an imported name exists.
    - Do not remove private or public symbols during generation. Public-symbol pruning is a separate,
      explicitly requested operation. Check cross-module imports of private helpers as well as the public inventory;
      a helper omitted from a replacement module can break untouched consumers even when `compareStub` is clean.

6. **Resolve incomplete generated types.**

    - Resolve missing module-level bindings and required private helpers first. Then work breadth-first across
      generated files: clear returns, then parameters, then variables and fields. Preserve existing known annotations
      while resolving uncertainty; a precise signature does not compensate for an incomplete replacement module.
      Use the binding inventory to distinguish a missing declaration, lost reexport identity, unresolved type and
      actual signature mismatch. Do not treat these as interchangeable failures or fix a missing import by inventing
      a replacement class. If a required contract remains unresolved, return that obligation to the requesting
      workflow and restore the prior overlay rather than declaring the module complete.
    - Reconcile each comment-only return before completion. Read the source hover/signature and
      implementation through `python-type-inference`; turn supported inferred returns into actual `-> T`
      annotations with the required imports. Reuse supported known types rather than leaving them only in comments.
      Do not blindly copy a generated hint that omits unknown members or conflicts with the implementation.
      Record a specific unresolved reason for each remaining return, so unfinished refinement is not silently
      presented as a completed stub or mistaken for a generator failure.
      Verify actual binding annotation edits in the `.pyi`, not just inference notes or claims that a return
      is resolved. Disclosure does not excuse a demonstrated loss of a supported known baseline type.
    - Use each `validateStubDraft` finding as a concrete repair obligation. Add a missing declaration from its
      owning source rather than accepting an empty preview or inventing a replacement. Recheck after actual
      annotation/declaration edits. A clean draft report alone does not establish semantic correctness; it clears
      only the reported deterministic checks.
      For `knownReturnTypeLost`, preserve every supported known branch and nested component while investigating
      the uncertain remainder. For `unresolvedImport` or a nominal mismatch, follow the real declaration and fix
      its owning import rather than guessing a constructor's class name. Check overloads individually: another
      overload with the desired return does not repair the one whose signature lost it.
    - Delegate each uncertain symbol to `python-type-inference`.
    - For native extensions, combine runtime `dir`, `inspect.signature` or `__text_signature__`, focused calls,
      package documentation, shipped stubs, and the package's source or tests when available. A C-level argument
      parser or method flag can establish parameter types and positional-only shape that a docstring omits.
      Leave a symbol unresolved when these sources do not establish a faithful contract.
    - For a compatibility wrapper implemented as `*args, **kwargs`, trace the forwarding call. When it forwards
      unchanged to a typed callable, give the stub the wrapped callable's verified parameter names, kinds, and
      defaults, plus the wrapper's actual runtime return type. Do not copy the imprecise variadic implementation
      signature into the stub, and do not rewrite the runtime wrapper. Preserve every other declaration in that
      module because the sibling `.pyi` replaces the module's complete visible surface.
    - Prefer a verified broader type over a guessed narrow type. Leave a type unresolved rather than write
      placeholder `Any`.
    - Never add `type: ignore`, `pyright: ignore`, `noqa`, or another checker suppression to a generated or
      handwritten stub. If a declaration requires suppression, correct or broaden the contract, or leave it
      unresolved.
    - Keep syntax compatible with the oldest supported Python version. Stub syntax may use constructs
      available to the configured type checker only when the project already establishes that convention.

7. **Prune only when explicitly requested.**

    - Freeze `getPublicSurface` results before deleting anything. Treat supported static `__all__` contents
      as authoritative; otherwise preserve the tool's conservative public surface.
    - Remove a declaration only when it is absent from the frozen public surface and is not required by a
      retained signature, base class, alias, or type expression. Keep private support types when public
      declarations depend on them.
    - After pruning, run `compareStub` against the frozen source copy. Require zero missing, extra, and
      divergent public symbols. Do not widen or weaken faithful annotations merely to suppress a reported
      divergence.
    - Treat pruning as surface reduction, not type-completeness improvement. Never claim a score gain solely
      because symbols were deleted.

8. **Validate the authored module.**

    Report completed, failed, unavailable and unperformed checks separately. Do not describe an incomplete
    selected-module draft as a completed stub package.

    - Re-run `getPublicSurface` and compare the source/runtime surface with the stub. No public export may be
      missing or unexpectedly added, and no baseline-known symbol may become ambiguous or unknown.
    - `compareStub` cannot semantically compare a native binary with a `.pyi`. For that boundary, freeze the
      runtime public-name inventory, compare it with the completed stub's top-level surface, and exercise each
      representative callable or class at runtime. Add a static negative-input check to prove the overlay is
      consumed rather than silently falling back to `Any`.
    - Check parse validity and semantic stub diagnostics separately. Use `pylanceLSP` `textDocument/diagnostic` on
      each analyzed `.pyi` to check imports, overload validity, and annotation errors, then re-run workspace
      diagnostics and reject new stub-caused errors. A syntax-only pass does not establish a valid overload set.
    - For compatibility wrappers, verify a valid forwarded call, verify one invalid argument is rejected
      statically, and confirm `inspect.signature` on the installed runtime wrapper is unchanged.
    - For generated data tables, inspect every runtime key, value, and nested item rather than a representative
      sample. Confirm that all entries satisfy the declared types and that the generated source hash is unchanged.
    - When public type completeness is the goal, re-run `pyright --verifytypes` and require a genuine completeness
      improvement with no known-symbol regression. For a selected-module workspace overlay, verify module
      preservation and supported types rather than imposing a package-wide score.
    - Do not reject an otherwise faithful contribution solely because aggregate VerifyTypes remains below 100%.
      Report both the resolved coherent unit and every unresolved package boundary. Acceptance depends on useful
      checker/API value, full surface fidelity for each touched module, and no regressions—not score perfection.
    - Use workspace analysis to prove that stubs under `stubPath` are consumed. `pyright --verifytypes`
      does not load the workspace `pyrightconfig.json` or its `stubPath`; an unchanged score alone does not
      show that the workspace ignored the stub.
      Check the consumer's resolved declaration/type information and a distinguishing hover, signature, or call
      result. File creation alone is not consumption evidence. Restore the previous overlay and confirm baseline
      diagnostics return when rejecting a candidate; do not leave an incomplete validation overlay active.
    - When a VerifyTypes comparison is required, copy the exact controlled stub package into a disposable
      isolated package-search environment, run the comparison there, and remove the copy. Never stage it in
      the selected user environment or modify the installed package source.
    - Repeat the runtime import smoke check and installed-source hash comparison.
    - Confirm the only created or modified files are inside the controlled stub package.
    - When preparing an upstream contribution, inspect the repository's task configuration and run its exact
      formatter, linter, type-checker, and targeted test commands. Narrower direct commands and locally ignored
      rules are iteration aids, not substitutes for the configured tasks that CI runs. Inspect every failure;
      fix stub-attributable failures and reproduce unrelated failures on the clean baseline before reporting
      them. Distinguish a completed failing check from a fork workflow awaiting maintainer approval:
      `action_required`, skipped approval-gated jobs, and absent checks are not successful validation, but they are
      not code failures to "fix" either.
    - For an overlay requested by `pylance-improve-type-evaluation`, return the validated edits and typing evidence
      to that workflow, or identify an incomplete draft with its unresolved obligations and unavailable checks.
      Leave performance measurements and candidate disposition to that workflow.

9. **Report the result.**
    - List generated files, resolved and unresolved symbols, type-completeness movement when measured, public-surface
      differences, diagnostic movement, runtime checks, and confirmation that installed source was
      unchanged.

## Correctness Rules

-   Never modify installed package source.
-   Never invent exports or implementation-only behavior in a stub.
-   Never change runtime signature shape to make a type easier to express.
-   Never change runtime behavior to make a stub annotation true; record the boundary or leave the module unstubbed.
-   Never use `Any` merely to increase completeness.
-   Never use `object` merely to avoid `Any`, an external unknown, or an unmodeled type relationship.
-   Never rewrite an existing public annotation merely to increase completeness; preserve it unless independent
    contract evidence supports the change.
-   Never add checker suppressions to typing artifacts.
-   Never treat a generated stub as effective until analysis proves it is being consumed.
-   Keep generation, type completion, and public-symbol pruning as separate steps with separate validation.
