"""Exception handlers for FastAPI."""
from typing import Any
from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    """Base exception class for application errors."""
    def __init__(self, message: str, status_code: int = 400, details: dict[str, Any] | None = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class EntityNotFoundException(AppException):
    """Exception raised when an entity is not found."""
    def __init__(self, entity: str, identifier: str = ""):
        msg = f"{entity} with ID '{identifier}' not found" if identifier else entity
        super().__init__(msg, status_code=404)

class ValidationException(AppException):
    """Exception raised when validation fails."""
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status_code=422, details=details or {})

class DuplicateEntityException(AppException):
    """Exception raised when an entity already exists."""
    def __init__(self, entity: str, field: str = "", value: str = ""):
        msg = f"{entity} with {field} '{value}' already exists" if (field and value) else entity
        super().__init__(msg, status_code=409)

class AgentProcessingException(AppException):
    """Exception raised when AI agent processing fails."""
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(f"AI agent processing error: {message}", status_code=500, details=details or {})

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle AppException and return JSONResponse."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "code": exc.__class__.__name__,
                "details": exc.details
            }
        }
    )
