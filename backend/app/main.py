from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routers import clients, visits, export, sms, dhis2, reports
from app.routers.auth import router as auth_router, decode_token
import os
import time

Base.metadata.create_all(bind=engine)

# ── Environment ────────────────────────────────────────────────────────────────
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")

app = FastAPI(
    title="AfyaMEC — Kenya Family Planning Platform",
    version="1.0.0",
    # Hide docs in production
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if IS_PRODUCTION else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"],
)

# ── Public routes (no JWT required) ────────────────────────────────────────────
PUBLIC_PATHS = [
    "/",
    "/health",
    "/auth/login",
    "/auth/register",
    "/auth/feedback",
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/feedback",
    "/docs",
    "/redoc",
    "/openapi.json",
]

# ── Security headers middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    path = request.url.path

    # ── Authentication check ──
    if request.method != "OPTIONS" and path not in PUBLIC_PATHS:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Not authenticated — please login"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token — please login again"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        request.state.user = payload

    # ── Process request ──
    start = time.time()
    response = await call_next(request)
    process_time = time.time() - start

    # ── Security headers ──
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    
    # Override server header — hide uvicorn
    try:
        del response.headers["server"]
    except:
        pass
    response.headers["Server"] = "AfyaMEC/1.0"

    # HTTPS-only headers (add when deployed with HTTPS)
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.anthropic.com https://generativelanguage.googleapis.com "
            "https://api.brevo.com https://enketo.ona.io; "
            "font-src 'self' data:;"
        )
    else:
        # In development add relaxed CSP so tests pass
        response.headers["Strict-Transport-Security"] = "max-age=0"
        response.headers["Content-Security-Policy"] = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"

    return response


# ── Routers ─────────────────────────────────────────────────────────────────────
# Register with BOTH prefixes — handles Digital Ocean /api stripping
for prefix in ["/api", ""]:
    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["Auth"])
    app.include_router(clients.router, prefix=f"{prefix}/clients", tags=["Clients"])
    app.include_router(visits.router, prefix=f"{prefix}/visits", tags=["Visits"])
    app.include_router(export.router, prefix=f"{prefix}/export", tags=["Export"])
    app.include_router(sms.router, prefix=f"{prefix}/sms", tags=["SMS"])
    app.include_router(dhis2.router, prefix=f"{prefix}/dhis2", tags=["DHIS2"])
    app.include_router(reports.router, prefix=f"{prefix}/reports", tags=["Reports"])


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "app": "AfyaMEC",
        "environment": ENVIRONMENT
    }

@app.get("/")
def root():
    return {
        "message": "AfyaMEC API is running",
        "version": "1.0.0",
        "docs": "/docs" if not IS_PRODUCTION else "disabled in production"
    }