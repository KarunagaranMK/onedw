"""
Global exception handlers for consistent, structured error responses.
"""
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("onedw.errors")


async def http_exception_handler(request: Request, exc: Exception):
    """Handle raised HTTPExceptions with a consistent JSON shape."""
    if not isinstance(exc, StarletteHTTPException):
        exc = StarletteHTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "detail": exc.detail, "path": str(request.url)},
    )


async def validation_exception_handler(request: Request, exc: Exception):
    """Handle Pydantic validation errors with clear field-level details."""
    if not isinstance(exc, RequestValidationError):
        return await unhandled_exception_handler(request, exc)

    error_messages = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        msg = err.get("msg", "Invalid value")
        error_messages.append(f"{field}: {msg}" if field else msg)

    readable_detail = "; ".join(error_messages) or "Validation error"

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": readable_detail,
            "detail": readable_detail,
            "errors": exc.errors(),
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected server errors — logs full traceback."""
    logger.exception("Unhandled exception on %s: %s", request.url, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error", "detail": "Internal server error"},
    )