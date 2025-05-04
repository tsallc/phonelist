# Change Detection Failures & Lessons Learned

This document outlines critical failure modes encountered during the development of the `phonelist-canonicalizer` update logic (`--update-from-csv`) and the lessons learned.

## 1. Brittle Change Detection with `JSON.stringify()`

*   **Failure Mode:** Using `JSON.stringify()` to compare complex objects or arrays for changes is unreliable. It is sensitive to:
    *   **Object Key Order:** Different environments or operations might produce objects with the same keys/values but different key ordering, leading to different JSON strings and false positive changes.
    *   **Array Element Order:** Reordering elements within nested arrays (like `contactPoints` or `roles`) results in different JSON strings, even if the underlying data is semantically unchanged (or if order shouldn't matter).
*   **Lesson:** Use robust deep equality comparison libraries (e.g., `lodash.isEqual`) or carefully implemented custom deep comparison logic. For array comparisons where order *doesn't* matter, compare sorted copies or use set-based comparisons.

## 2. Inconsistent CSV Header Normalization / Key Mismatch

*   **Failure Mode:** Multiple points of failure arose from inconsistencies between how CSV headers were read, normalized (lowercase, trim, space handling), mapped to canonical keys, and accessed later in the code.
    *   Initial `fast-csv` options (`headers: normalizeFunc`, `renameHeaders: true`) had unexpected behavior regarding the keys available in the `data` event.
    *   Manual key transformation loops incorrectly assumed the format of keys after parsing.
    *   Lookup maps (`canonicalHeaderMap`) did not consistently use the *same normalized form* for both the map keys and the lookup keys.
*   **Lesson:** Establish a **single source of truth** for header normalization. Define an explicit **Header Contract**. Implement a robust `normalizeKey` function (handling whitespace, BOM, case, etc.) and apply it *consistently* when building mapping structures *and* when looking up incoming keys.

## 3. False Confidence from Passing Schema Validation

*   **Failure Mode:** Code successfully passed structural schema validation (`zod`) but failed to correctly detect or apply semantic updates. Validation confirmed shape, not behavior.
*   **Lesson:** Schema validation is necessary but not sufficient. Functional tests verifying the *behavior* (detecting specific changes, handling edge cases) are crucial.

## 4. Logic Errors Masked by `changed` Flag Misuse

*   **Failure Mode:** The `mergeEntry` function correctly identified changes and set a `changed` flag to `true`, but a subsequent logic error (related to validating the merged result) caused the function to return the *updated object* instead of `null` even when the `changed` flag indicated no changes should have been returned (or vice-versa). This led to the calling function (`updateFromCsv`) incorrectly logging `no_change` despite `mergeEntry` having detected one.
*   **Lesson:** Ensure return logic precisely matches the intended contract. If a function signals change via a boolean flag, the final return value must correctly reflect that flag's state *after* all intermediate steps (like validation) are complete.

## 5. Insufficient Hash Determinism

*   **Failure Mode:** The initial `computeHash` function stringified sorted top-level arrays but did not sort nested arrays (`contactPoints`, `roles`). Changes that only reordered elements within these nested arrays were not detected by the hash comparison, leading to false negatives (`✅ No changes detected` printed by the CLI despite actual changes).
*   **Lesson:** Hash functions for complex objects must ensure full determinism. This often requires recursively sorting all nested arrays by a stable property or using a stable stringification library (`json-stable-stringify`) that handles key ordering consistently.

## 6. Over-reliance on Brittle Integration Test Assertions

*   **Failure Mode:** Integration tests relied heavily on exact `stdout` string matching (`toContain`). Minor changes to log messages, formatting, or even timing issues in `execa` output capture caused tests to fail unexpectedly, masking the underlying logic's correctness (or lack thereof).
*   **Lesson:** Integration tests should focus on verifying *functional outcomes* and *key state changes* where possible (e.g., checking exit codes, asserting on file contents/existence, validating the structure/content of output JSON) rather than exact log strings. Use stdout checks sparingly for critical signals only.

## 7. Debugging Blind: Not Inspecting Source Data

*   **Failure Mode:** Significant time was spent debugging parsing issues based on assumptions about CSV header formats (spaces vs. no spaces) present in *test data* without sufficiently verifying the format in the *actual source CSV files* (`test-update.csv`, `users_5_3_2025...csv`).
*   **Lesson:** When integrating external data sources, always inspect the *real data* at the byte/character level (using tools like `hexdump` or detailed char code logging) to confirm exact formats, encodings, and potential hidden characters. Do not rely solely on assumptions or mock data. 