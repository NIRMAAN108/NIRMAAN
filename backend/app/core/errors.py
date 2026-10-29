"""
Comprehensive Error Handling & Fault-Tolerance Subsystem
Categorizes and standardizes all HTTP (400, 404, 422, 429, 500, 504) and Blockchain-specific anomalies.
"""
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import logging

logger = logging.getLogger("nirmaan.errors")

# -------------------------------------------------------------
# 1. DOMAIN SPECIFIC EXCEPTION HIERARCHY
# -------------------------------------------------------------

class ForensicEngineException(Exception):
    """Base exception for all forensic engine failures."""
    def __init__(self, message: str, error_code: str = "FORENSIC_ERROR", status_code: int = 500, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details

class InvalidWalletAddressError(ForensicEngineException):
    def __init__(self, address: str, details: Optional[str] = None):
        super().__init__(
            message=f"The supplied address '{address}' is not a valid TRON, Ethereum, BSC, or Bitcoin address format.",
            error_code="INVALID_WALLET_ADDRESS",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details or "Supported formats: TRON (starts with 'T', 34 chars), EVM (0x..., 42 chars), Bitcoin (1..., 3..., bc1...)."
        )

class UpstreamCrawlerTimeoutError(ForensicEngineException):
    def __init__(self, chain: str, address: str):
        super().__init__(
            message=f"Network timeout while querying public {chain.upper()} blockchain node for address '{address}'.",
            error_code="UPSTREAM_CRAWLER_TIMEOUT",
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            details="The public explorer or RPC node took too long to respond. The system has applied defensive fallback."
        )

class RateLimitExceededError(ForensicEngineException):
    def __init__(self, provider: str, retry_after: int = 2):
        super().__init__(
            message=f"Public rate limit exceeded on {provider} API (HTTP 429).",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=f"Backing off. Retry after {retry_after} seconds."
        )

# -------------------------------------------------------------
# 2. STANDARDIZED ERROR RESPONSE BUILDER
# -------------------------------------------------------------

def build_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Any] = None,
    path: Optional[str] = None
) -> JSONResponse:
    """Builds a uniform, predictable JSON error structure for frontend consumption."""
    payload = {
        "success": False,
        "error": {
            "code": error_code,
            "status_code": status_code,
            "message": message,
            "details": details,
            "timestamp": int(time.time()),
            "path": path
        }
    }
    return JSONResponse(status_code=status_code, content=payload)

# -------------------------------------------------------------
# 3. GLOBAL EXCEPTION HANDLERS FOR FASTAPI
# -------------------------------------------------------------

async def custom_forensic_exception_handler(request: Request, exc: ForensicEngineException):
    logger.error(f"[{exc.error_code}] {exc.message} at {request.url.path}")
    return build_error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        path=request.url.path
    )

async def custom_starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    error_code = {
        400: "BAD_REQUEST",
        404: "RESOURCE_NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
        504: "GATEWAY_TIMEOUT"
    }.get(exc.status_code, "HTTP_ERROR")

    return build_error_response(
        status_code=exc.status_code,
        error_code=error_code,
        message=str(exc.detail),
        path=request.url.path
    )

async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles FastAPI 422 schema validation errors cleanly."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        errors.append(f"{loc}: {err.get('msg')}")

    return build_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        error_code="SCHEMA_VALIDATION_ERROR",
        message="Request body payload failed schema validation.",
        details=errors,
        path=request.url.path
    )

async def generic_unhandled_exception_handler(request: Request, exc: Exception):
    """Catches any unexpected Python exception to prevent 500 crash or leaking traceback."""
    logger.exception(f"Unhandled critical exception at {request.url.path}: {exc}")
    return build_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal error occurred within the forensic engine.",
        details=str(exc) if not isinstance(exc, AssertionError) else "Assertion failed.",
        path=request.url.path
    )
