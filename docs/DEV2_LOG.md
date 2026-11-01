# NIRMAAN -- Dev 2 Work Log

**Role:** ML / Model Development\
**Branch:** `feature/dev2-ml-intelligence`\
**Working directory:** `backend/`\
**Last updated:** 1 November 2026

------------------------------------------------------------------------

## 31 October 2026 -- Environment Setup

### Completed

1.  Accessed the private NIRMAAN GitHub repository.
2.  Verified the upstream repository: `NIRMAAN108/NIRMAAN`.
3.  Created/used the feature branch `feature/dev2-ml-intelligence`.
4.  Checked the installed Python versions.
5.  Created and activated the project virtual environment.
6.  Located the backend dependency file.

### Issues / observations

-   Initially worked from an extracted ZIP folder without Git metadata.
-   Switched to the Git repository.
-   The virtual environment must remain excluded from Git using
    `.gitignore`.

## 31 October 2026 -- Backend Inspection

### Dependency inspection

Inspected `backend/requirements.txt`. The existing dependencies
included:

-   `fastapi>=0.111.0`
-   `uvicorn>=0.29.0`
-   `networkx>=3.3`
-   `httpx>=0.27.0`
-   `pydantic>=2.7.0`

### Backend architecture inspection

Reviewed the backend structure and identified the main components:

-   `app/main.py` -- FastAPI application entry point
-   `app/core/tracer.py` -- blockchain transaction tracing
-   `app/core/legal_notice.py` -- legal notice generation
-   `app/models/schemas.py` -- request and response schemas
-   `app/crawlers/` -- chain-specific and multi-chain crawlers
-   `app/data/vasp_directory.json` -- VASP directory data

### Tracer and schema review

Reviewed the existing tracing flow, schemas, and tests to identify
integration points for the ML layer.

Observed that the tracing pipeline needed integration with risk scoring,
graph analytics, peeling-pattern detection, and mixer-directory checks.
The review also identified schema fields needed to carry the resulting
risk and trace metadata.

## 31 October -- 1 November 2026 -- ML Integration

### ML modules added

Added the ML package and the following modules under `backend/app/ml/`:

-   `graph_clustering.py` -- graph construction and graph-based
    analytics
-   `mixer_directory.py` -- mixer-directory lookup and metadata handling
-   `peeling.py` -- peeling-pattern and related transfer-pattern checks
-   `scorer.py` -- node-level heuristic risk scoring
-   `syndicate_classifier.py` -- behavioral typology classification

Added `app/ml/__init__.py` and `app/__init__.py`.

### Tracer integration

Updated `app/core/tracer.py` to connect the tracing flow with the ML and
graph-analysis components.

The integration includes: - Applying node-level risk analysis to traced
graph nodes. - Carrying risk and typology information into the trace
response. - Computing a canonical SHA-256 digest for the trace
evidence. - Returning synthetic/demo-fixture status in the trace
response. - Preserving direct hot-wallet and deposit-to-hot-wallet VASP
matching paths.

### Schema updates

Updated `app/models/schemas.py` to support the fields required by the
integration, including:

-   Node risk score and risk tier
-   Peeling and mixer indicators
-   Node flags, explanation, and feature vector
-   Node typology
-   VASP metadata fields
-   Trace evidence digest
-   Synthetic-data indicator
-   Syndicate typology and ML anomaly score

### Legal notice updates

Updated `app/core/legal_notice.py` to support canonical evidence-digest
generation and include the SHA-256 evidence seal in the generated
notice.

The notice heading was adjusted to include the exact statutory reference
expected by the existing test. The notice is a draft and requires
appropriate legal review before operational use.

### Dependencies

Updated `backend/requirements.txt` while retaining the existing
dependencies. Added:

-   `reportlab>=5.1.0`
-   `numpy>=1.26.4,<2.0`
-   `scipy>=1.11.4`

## Testing and validation -- 1 November 2026

### Tests added

Added the following ML validation tests:

-   `tests/test_ml_graph_clustering_validation.py`
-   `tests/test_ml_mixer_risk.py`
-   `tests/test_ml_peeling_validation.py`

### Issues resolved

-   Resolved a missing canonical evidence-digest helper import.
-   Added the missing trace-response and graph-node schema fields
    required by the integration.
-   Corrected the direct hot-wallet VASP constructor to use the matched
    VASP metadata.
-   Corrected the legal notice heading so the statutory reference is
    present in the expected format.
-   Added the SHA-256 evidence-seal line in the generated notice.
-   Resolved the reported Pylance parameter/schema mismatch issues.
-   Removed trailing whitespace identified by `git diff --check`.

### Final test result

Command executed from `backend/`:

``` powershell
python -m pytest -q
```

Result:

``` text
56 passed, 2 warnings
```

No test failures remained in this run.

The two warnings were deprecation/configuration warnings: -
`pytest-asyncio`: the default fixture event-loop scope is not explicitly
configured. - Starlette: deprecation warnings related to `httpx`
TestClient usage and the HTTP 422 status constant.

Whitespace validation:

``` powershell
git diff --check
```

Result: no output; no whitespace errors reported.

Pylance: the previously reported nine issues in `tracer.py` were checked
and reported resolved.

## Current Git working-tree status

At the last recorded status check, the following files were modified:

-   `app/core/legal_notice.py`
-   `app/core/tracer.py`
-   `app/models/schemas.py`
-   `requirements.txt`

The following entries were untracked:

-   `app/__init__.py`
-   `app/ml/`
-   `tests/test_ml_graph_clustering_validation.py`
-   `tests/test_ml_mixer_risk.py`
-   `tests/test_ml_peeling_validation.py`

The ML directory contains the modules listed in the ML integration
section. Untracked files are not included in the ordinary
`git diff --stat` output until staged.

## Current status

-   Backend test suite: **56 passed, 0 failed**
-   Pylance issues previously reported: **resolved**
-   `git diff --check`: **clean**
-   Development work log: this document
-   Commit/push: **not performed**

## Remaining review items

1.  Review the complete diff, including all untracked ML modules and
    tests.
2.  Confirm the intended files are the only files to be included in the
    change.
3.  Review heuristic risk scores and typology labels to ensure they are
    presented as indicators, not calibrated probabilities or proof of
    criminal activity.
4.  Review VASP directory provenance and verification metadata before
    describing any entity as verified.
5.  Review the hardcoded token-to-USD conversion assumptions in the
    tracing pipeline; these values are not historical market prices.
6.  Confirm the repository's `.gitignore` excludes the virtual
    environment and other local-only files.
7.  Stage and commit only after the review is complete and explicitly
    approved.

------------------------------------------------------------------------

**Note:** This log records the work and test results reported during
development. A passing test suite does not by itself establish the
accuracy of heuristic classifications, external directory data, legal
conclusions, or live blockchain market values.
