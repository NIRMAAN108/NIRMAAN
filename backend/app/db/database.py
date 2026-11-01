"""
SQLite Case Vault Database Connection & Migration Engine.
Stores investigated cybercrime cases with statutory evidence hashes.
"""

import os
import sqlite3
import json
import logging
from contextlib import contextmanager
from typing import Optional, Generator

logger = logging.getLogger("nirmaan.db")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "data", "case_vault.db")

def get_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with dict-like row factory and WAL mode."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=30000;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager that ensures the SQLite connection is committed and closed."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initializes and runs migrations for the Case Vault database."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cases (
                case_id TEXT PRIMARY KEY,
                fir_number TEXT NOT NULL,
                police_station TEXT NOT NULL,
                investigating_officer TEXT NOT NULL,
                complainant_name TEXT DEFAULT 'Complainant',
                loss_amount_inr REAL DEFAULT 0.0,
                seed_address TEXT NOT NULL,
                chain TEXT NOT NULL,
                destination_vasp TEXT,
                total_routed_usd REAL DEFAULT 0.0,
                evidence_sha256 TEXT,
                trace_data TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_cases_fir ON cases(fir_number);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_cases_seed ON cases(seed_address);
        """)
        conn.commit()
    logger.info("Case Vault SQLite database initialized successfully.")

# Run migration on module import
init_db()
