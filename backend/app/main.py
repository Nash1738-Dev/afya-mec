from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import engine, Base
from app.routers import clients, visits, export, sms, dhis2, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AfyaMEC - Kenya Family Planning Platform",
    version="1.0.0"
)

# CORS - allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(visits.router, prefix="/api/visits", tags=["Visits"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(sms.router, prefix="/api/sms", tags=["SMS"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(dhis2.router, prefix="/api/dhis2", tags=["DHIS2"])

@app.get("/")
def root():
    return {"message": "AfyaMEC API is running", "version": "1.0.0"}