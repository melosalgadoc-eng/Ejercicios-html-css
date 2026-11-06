---
name: python-third-party-stubs
description: 'Use when a Python dependency lacks usable typing and you need to find, copy, or generate third-party stubs without silently changing the selected environment.'
---

# Third-Party Python Stubs

Follow these steps in order.

1. **Identify the package and environment.**
   Confirm the runtime distribution, import package, selected interpreter, and workspace. A distribution name and an
   import name can differ, so verify both.

2. **Check PyPI first.**
   Look for a maintained `<package>-stubs` or `types-<package>` project. Verify its publisher, project identity,
   import coverage, supported runtime version, Python compatibility, and maintenance state instead of guessing from
   its name.

3. **Ask before installing a PyPI package.**
   Tell the user which verified package you found, why it matches, and which selected interpreter it would change.
   Use the approved package-management method only after the user explicitly agrees.

4. **Find reviewed stubs when PyPI has no suitable package.**
   Call `pylanceTypeStubs` with action `find`, the exact reviewed stub package, and the workspace root. Include an
   explicit stub path only when the user or workspace requires one. This read-only call checks the fixed public
   `microsoft/python-type-stubs` repository and returns the exact package, immutable commit and tree, file count and
   bytes, destination, destination state, and a short-lived copy token.

5. **Show the result and ask before copying.**
   Show the concrete source identity, file summary, destination, and whether the destination is absent, identical, or
   conflicting. If the destination is safe, ask the user to approve that exact copy. After approval, call
   `pylanceTypeStubs` with action `copy`, the same package, workspace root, optional stub path, and the copy token from
   `find`. A changed source, destination, binding, unsafe path, or conflict must stop the copy. An identical
   destination is a no-op.

6. **Use `python-write-stubs` when reviewed content is absent.**
   Follow the existing `python-write-stubs` skill to generate, refine, and validate local stubs under the effective
   configured stub path. Do not invent uncertain types or modify installed package source.
