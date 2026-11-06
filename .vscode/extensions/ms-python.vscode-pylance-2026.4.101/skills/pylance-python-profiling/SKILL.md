---
name: pylance-python-profiling
description: 'Use when investigating or optimizing Python performance with Pylance: capture CPU time (Tachyon), trace calls (sys.monitoring), or memory (Memray); profile a whole run or a specific region between two source locations; add sub-region markers; and explore saved profiles (hot functions, call trees, time slices). Also use for the Python 3.15.0b3+ CPU sampling requirement and related error guidance.'
---

# Pylance Python Profiling

Use this skill to drive the `pylancePythonProfiling` capture tool and the `pylancePythonProfileExplorer`
analysis tool. Capture produces artifacts on disk plus a sidecar metadata JSON; the explorer loads that
metadata and answers paged queries (hot functions, call tree, time-sliced views).

## Tools

-   `pylancePythonProfiling` — start/stop captures and inspect sessions. One `action` per call.
-   `pylancePythonProfileExplorer` — load a capture's metadata JSON and query it.

Run `{"action":"help"}` on either tool to print its full surface.

## Verified Tool Facts

-   Backends: CPU = `profiling.sampling` (Tachyon), Trace = `sys.monitoring`, Memory = Memray.
-   **CPU sampling requires Python 3.15.0b3+ with `profiling.sampling`.** The tool resolves the
    workspace-selected interpreter (same resolution as the other Pylance MCP tools). An unsupported
    interpreter returns a structured error naming the selected version. Select a compatible interpreter
    or pass `pythonPath` explicitly. Explorer queries analyze saved artifacts and do not require an
    active capture or a Python 3.15 interpreter.
-   Trace and Memory work on older interpreters (Trace needs 3.12+ for `sys.monitoring`).
-   Every capture returns a `profilingSessionId` immediately and writes artifacts under an `artifactsDir`,
    including a `*.metadata.json` sidecar. Pass that metadata path to the explorer, not the raw binary.
-   Captures own their own session lifecycle; they do not require `pylancePythonDebug`.
-   The injected handshake and sampler wrapper are code **we add on the fly** — the user's source is never
    edited. Region boundaries and markers are expressed as `file:line`.

## Actions (`pylancePythonProfiling`)

| `action`           | Purpose                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| `list`             | Show active/completed sessions.                                        |
| `status`           | Inspect one session (`profilingSessionId`).                            |
| `startCpu`         | CPU capture. `mode:"launch"` (script/module) or `mode:"attach"` (pid). |
| `startCpuRegion`   | CPU capture of one region only (launch mode). See below.               |
| `stopCpu`          | Stop/finalize a CPU session; returns saved artifact paths.             |
| `startTracing`     | `sys.monitoring` trace of a script/module (launch only).               |
| `stopTracing`      | Cooperative stop for a trace session.                                  |
| `takeHeapSnapshot` | One-shot Memray capture.                                               |
| `stop`             | Terminate a session and drop it from the in-memory list.               |
| `help`             | Print full help.                                                       |

CPU sampling options (apply to `startCpu` and `startCpuRegion`): `samplingRate` (e.g. `"1khz"`),
`duration` (seconds), `samplingMode` (`wall|cpu|gil|exception`, default `cpu`), `allThreads`, `native`,
`noGc`, `opcodes`, `blocking`, `subprocesses`.

## Scenario 1 — Profile a whole run

Launch a script under the CPU sampler, then load the result:

```json
{
    "action": "startCpu",
    "mode": "launch",
    "script": "/path/to/app.py",
    "pythonPath": "/path/to/python",
    "samplingRate": "1khz"
}
```

Attach to an already-running process instead:

```json
{ "action": "startCpu", "mode": "attach", "pid": 12345, "pythonPath": "/path/to/python" }
```

Bound an attach by wall-clock time:

```json
{ "action": "startCpu", "mode": "attach", "pid": 12345, "samplingMode": "wall", "duration": 30 }
```

When done (launch captures finalize on their own; attach/duration captures too), retrieve artifacts:

```json
{ "action": "stopCpu", "profilingSessionId": "pyprof-..." }
```

## Scenario 2 — Profile a specific region (`startCpuRegion`)

Use this when only part of a run matters, such as a hot function or request handler, and the target
should remain parked during sampler startup. Launch mode only.

```json
{
    "action": "startCpuRegion",
    "mode": "launch",
    "script": "/path/to/app.py",
    "pythonPath": "/path/to/python",
    "regionStartLocation": "app.py:42",
    "regionStopLocation": "app.py:88"
}
```

How it works (no user code edits):

1. The target launches under an injected handshake. When execution first reaches `regionStartLocation`
   the target parks.
2. Tachyon starts against the parked target. After the sampler survives the attach settle interval, the
   target is released. This is a bounded startup check, not a backend readiness acknowledgement; sampler
   output is not a readiness signal.
3. When execution reaches `regionStopLocation`, the sampler is detached and its data flushed before the
   target resumes its tail.

Region bounds are recorded in metadata as `region.startTimeMs`/`region.endTimeMs`. Use
`startTimeMs`/`endTimeMs` to restrict Explorer queries to those recorded bounds.

Guidance:

-   Locations are `file:line`; relative paths resolve against the target's working directory.
-   Read the numbered source before choosing bounds. Both lines must execute for the supplied arguments;
    an `else:` label, closing delimiter, or line inside an untaken branch is not a usable boundary.
    Start before the intended operation and stop at the first executable line after it, not around
    adjacent setup, copying, warm-up, or validation.
-   A started session does not mean the target has entered the region. Let the intended operation reach
    its bounds before finalizing; `stopCpu` on a still-running session is an early stop, not a wait.
-   Use `stopCpu` to fetch artifacts or to stop early.

## Scenario 3 — Sub-region markers

Markers label points **inside** the region without parking or re-attaching. Use them to break one attach
into several labeled sub-regions (cheaper than many tiny `startCpuRegion` calls) and to annotate phases.

Pass `regionMarkers` as `"label@file:line"` (or just `"file:line"`):

```json
{
    "action": "startCpuRegion",
    "mode": "launch",
    "script": "/path/to/app.py",
    "pythonPath": "/path/to/python",
    "regionStartLocation": "app.py:42",
    "regionStopLocation": "app.py:88",
    "regionMarkers": ["load@app.py:50", "compute@app.py:64", "render@app.py:80"]
}
```

Each time execution reaches a marker line inside the region, a labeled timestamp (ms from region start) is
recorded. The explorer surfaces them under `region.markers`; use adjacent marker times as
`startTimeMs`/`endTimeMs` to slice a sub-region.

## Scenario 4 — Trace and memory

```json
{"action":"startTracing","mode":"launch","module":"mypackage.app","pythonPath":"/path/to/python"}
{"action":"stopTracing","profilingSessionId":"pyprof-..."}
```

```json
{
    "action": "takeHeapSnapshot",
    "mode": "launch",
    "script": "/path/to/app.py",
    "pythonPath": "/path/to/python",
    "traceNativeMemory": true
}
```

## Exploring results (`pylancePythonProfileExplorer`)

Load the capture's metadata JSON, then query views with the returned `profileId`:

```json
{"action":"loadCpuProfile","filePath":"/path/to/artifactsDir/cpu.metadata.json"}
{"action":"query","profileId":"cpu-...","view":"summary"}
{"action":"query","profileId":"cpu-...","view":"functionStats","sortBy":"observedEntries","limit":20}
{"action":"query","profileId":"cpu-...","view":"bottomUp","limit":20}
{"action":"query","profileId":"cpu-...","view":"search","queryText":"compute"}
```

-   CPU views: `summary | callTree | bottomUp | functionStats | eventLog | search | nodeContext`.
-   `functionStats` provides a cProfile-style function overview from the same sampled capture:
    self/inclusive time, percentages, sample counts and `observedEntries`. It merges executing lines
    and caller contexts. Consecutive stack changes reveal separated activations: `a -> b -> d`, `a -> b`,
    `a -> b -> d` gives two observed entries to `d`, not three calls or a count of its samples.
    `boundaryEntries` identifies included frames already active at capture/window start or after
    an unknown stack. Unobserved short calls are missed; generator/coroutine resumptions can look
    like entries. These are useful frequency observations, not exact `ncalls` or per-call times.
    Recursion counts separate entries but inclusive time/samples only once per function.
    Sort by `observedEntries`, `selfTimeMs` or `totalTimeMs`, then use the row's `nodeId` with
    `nodeContext` for one sampled caller path. `coverage` reports the analyzed window, sampled
    population and unknown stacks; `hitLimits: ["maxItems"]` means the sample scan is incomplete.
-   `bottomUp` ranks functions by descending self CPU time by default, before applying `offset`/`limit`.
    Self time is sampled work attributed directly to a frame; inclusive time includes its descendants.
    Use self time first to locate expensive operations, then `callTree` or `nodeContext` to understand
    their callers. Use `sortBy:"totalTimeMs"` (or `"total"`) to locate expensive call paths, not to rank
    direct work: an entrypoint or wrapper can have high inclusive time and zero self time. Inclusive
    totals overlap across callers and callees; do not add them together. Other accepted keys are `selfTimeMs`
    (or `"self"`), `selfSamples`, `totalSamples`, `functionName`, `location`, and `key`; use
    `sortDirection:"asc"` for ascending order. Unsupported `bottomUp` keys return a structured error.
-   Trace views: `summary | events | byCategory | byProcessThread | timelineSlices | search`.
-   Heap views: `summary | allocations | search`.
-   For region captures, `loadCpuProfile` returns a `region` block (bounds + markers). Slice a CPU view to
    the region or a sub-region with `startTimeMs`/`endTimeMs` (both are ms from start).
-   `search` `queryText` syntax: space-separated terms OR; `+term` AND; `/regex/`; `"phrase"` exact.
-   `/regex/` format — a common, safe subset, always case-insensitive:
    -   Supported: literals and escaped metacharacters; `.`; character classes `[...]`/`[^...]`/ranges and `\d \D \w \W \s \S`; anchors `^` `$`; groups `( )` and `(?: )`; alternation `|`; quantifiers `* + ? {m} {m,} {m,n}` (a trailing lazy `?` is accepted); control escapes `\n \r \t \f \v \0`.
    -   Not supported (the term degrades to a literal substring match): word boundaries `\b` `\B`, named groups, back-references, look-around `(?=) (?!) (?<=) (?<!)`, hex/Unicode escapes `\xHH`/`\uHHHH`, Unicode property escapes `\p{...}`, and all flags (`i s m g u y`).
-   Use `loadTrace` / `loadHeapSnapshot` for the other backends.

## Investigate and verify a performance fix

Preserve correctness first and compare candidate fixes on representative workloads. Keep the best
verified version within the user's scope and resource limits.

1. Keep unchanged source and define required values, effects, precision, mutation and lifetime
   guarantees. Record unprofiled CPU and wall time separately, matching interpreter, dependencies,
   inputs, warm-up and boundaries. A smaller reproduction must retain the full workload's costly
   mechanism.
2. Start with `functionStats`: compare `selfTimeMs`, `totalTimeMs` and `observedEntries` from one
   capture to locate expensive and repeatedly observed work. Check thread/window coverage and scan
   limits, then follow a row's `nodeId` with `nodeContext`; use `search` for other caller contexts and
   `bottomUp` for executing-line detail. Read the source and callers to distinguish data volume,
   invocation frequency, fanout and unnecessary results. Do not dismiss observed entries merely
   because sampling misses some calls. If exact frequency remains important and uncertain, use
   `cProfile`/`pstats` (`cumulative`, `tottime`, `calls`, callers/callees) or bounded counters.
   Match workload windows and rediscover IDs in each capture. Zero needs verified coverage; resolve
   disagreement through boundaries, threads, short calls, native work and instrumentation overhead.
3. Predict what a candidate removes and what would disprove it. Consider less input, fewer calls,
   batching, representation changes and invariant setup before cheaper individual calls.
   **After removing a hotspot, recount remaining work per item.** Follow wrappers into constructors,
   validation, copying and metadata: a batched outer loop may still rebuild invariant state each time.
   Inspect existing helpers; reuse known-valid data and metadata only under proved preconditions.
   Keep measured useful caches. Share storage only with proved ownership, immutability and lifetime;
   report retained-memory tradeoffs rather than copying to imitate incidental allocations.
4. Check behavior before further refinement. Differentially compare the original and candidate on
   the full representative workloads and controls, plus neighboring, odd/non-power-of-two sizes,
   precision limits and fallback paths. Preserve callbacks, exception timing and metadata; follow
   [Python Fact-Grounded Coding](../python-fact-grounded-coding/SKILL.md#verify-performance-changes).
   Changing native parameters, layout or arithmetic order needs demonstrated equivalence:
   mathematically separable operations need not preserve finite-precision rounding.
   Reject incorrect candidates regardless of their apparent speed.
5. Measure correct candidates unprofiled against both the original and current baseline. Repeat
   small gains; measure combined changes, not added savings. Retain the best verified version.
   Reprofile meaningful accepted changes to verify the predicted branch and work removal, then
   inspect remaining costs. A lower total alone does not explain why.

Capture and measure serially. Isolate warmed work with `startCpuRegion` or a known time window when
setup dominates. Each query or capture should answer a concrete question: reuse broad captures,
expand caller views when needed, and recapture only for meaningful changes, unresolved attribution
or variability. Do not require both profilers after every edit. Keep compact before/after evidence
and reference saved artifacts rather than repeating tables.

End a hypothesis when its prediction fails or more probes add no information; consider other measured
costs. Continue while credible correctness-preserving improvements remain, within user-approved limits.

## Working Rules

-   Always pass the `*.metadata.json` sidecar to the explorer loaders, never the raw `.bin`/`.ndjson`.
-   For CPU capture, verify or select Python 3.15.0b3+ with `profiling.sampling` first; surface the
    version error verbatim if it fails rather than guessing.
-   Prefer `startCpuRegion` over `startCpu` + `duration` when the user cares about a specific code range —
    sampler startup occurs while the target is parked rather than inside a guessed whole-run duration.
-   Prefer markers over many tiny region captures when labeling several adjacent phases under one attach.
-   Inspect session status and any returned `error`, including when `stopTracing` returns artifact paths.
    Saved artifacts alone do not establish successful target execution or clean profiler shutdown.
-   Report the `profilingSessionId`, `artifactsDir`, and (for regions) the resolved start/stop/marker
    locations so the user can re-open the capture later.

## Known limitations and quirks

These are current rough edges. Where the tool returns a structured error, surface it verbatim rather than
guessing a fix.

### Capture

-   **Memray (memory) is unsupported on Windows.** `takeHeapSnapshot` returns a platform-aware error on
    win32 — there is no package to install. Capture memory on Linux/WSL or macOS instead.
-   **`blocking:true` is unsupported on Windows.** It returns a structured error before any sampler starts;
    re-run without `blocking:true`, or capture on Linux/WSL.
-   **Attach/region on a Windows `uv venv` interpreter can fail to produce an artifact.** The uv venv
    trampoline-shim `python.exe` re-execs the real interpreter as a child and then exits, so the launched
    PID is gone before Tachyon can sample it. (A stdlib `python -m venv` does not have this problem — attach
    works there.) Use launch mode, attach to the real `python.exe` child PID, or pass the base interpreter as
    `pythonPath`. The tool surfaces this hint when an attach/region capture on a uv venv yields no artifact.
-   **`samplingMode:"gil"` is near-unusable under GIL contention** — it collects very few samples. For
    GIL-bound workloads prefer `cpu` (or `wall`) and read thread behavior from the call tree.
-   **`samplingRate` saturates around 400–500 Hz.** Requesting a higher rate does not raise the effective
    sample frequency; treat ~500 Hz as the practical ceiling and do not infer precision beyond it.
-   **Region markers force per-line `sys.monitoring` while the region is active**, which slows the target.
    Keep markers out of tight hot loops, or accept the slowdown for the measured region only.
-   **A marker on the exact region-start line folds into `t=0`.** Place markers on lines strictly inside the
    region (after the start line) so their timestamps are distinct.

### Exploring

-   **Pass the `*.metadata.json` sidecar to the loaders, never a raw `.bin`.** Loading a raw capture binary
    returns a friendly hint pointing at the metadata sidecar instead of an opaque parse error.
-   **CPU views summarize a single thread.** `loadCpuProfile` reports the analyzed thread under
    `threads.analyzed` (with its sample count); other threads are not aggregated into the same view. State
    this limitation when reporting multi-threaded results.
-   **Trace event views scan all events and honor `startTimeMs`/`endTimeMs`.** `events`, `search`,
    `byCategory`, and `byProcessThread` page over the full event set and reconcile with `summary`; use the
    time window to reach later events rather than expecting one page to cover the whole trace.
