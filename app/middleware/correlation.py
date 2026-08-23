"""Correlation middleware."""
import time
import uuid
from typing import Any, Awaitable, Callable
from contextvars import ContextVar

# Define context variable for correlation ID
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="")

class CorrelationIdMiddleware:
    """Pure ASGI middleware that injects X-Correlation-ID and X-Process-Time headers."""
    def __init__(self, app: Callable[[dict[str, Any], Callable[..., Awaitable[None]], Callable[..., Awaitable[None]]], Awaitable[None]]):
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Callable[..., Awaitable[None]], send: Callable[..., Awaitable[None]]) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        # Decode headers and try to get X-Correlation-ID
        corr_id = b""
        for k, v in headers.items():
            if k.lower() == b"x-correlation-id":
                corr_id = v
                break
        
        if corr_id:
            correlation_id = corr_id.decode("latin-1")
        else:
            correlation_id = str(uuid.uuid4())
            
        correlation_id_ctx.set(correlation_id)

        start_time = time.perf_counter()

        async def send_wrapper(message: dict[str, Any]) -> None:
            if message["type"] == "http.response.start":
                process_time = time.perf_counter() - start_time
                headers = list(message.get("headers", []))
                headers.append((b"x-correlation-id", correlation_id.encode("latin-1")))
                headers.append((b"x-process-time", str(process_time).encode("latin-1")))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)
