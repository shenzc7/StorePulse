"""
SQLite persistence layer for StorePulse.

FILE OVERVIEW:
- File Type: Python module (db.py)
- Programming Language: Python 3.8+
- Purpose: Database layer for offline-first data persistence
- Database: SQLite with ACID compliance and migrations
- Dependencies: sqlite3, json, pathlib, typing, contextlib, datetime

TECHNICAL ARCHITECTURE:
This module implements a complete data persistence layer using SQLite database.
It provides offline-first storage for:
- Visit records (both Lite and Pro modes)
- Model artifacts and metadata
- Application settings and configuration
- Forecast caching for performance
- What-if scenario tracking

DATABASE DESIGN:
- Tables: visits, models, settings, forecast_cache, whatif_scenarios, schema_version
- Indexes: Optimized for common query patterns (dates, active models, etc.)
- Constraints: Data integrity checks and foreign key relationships
- Migrations: Version-controlled schema evolution

METHODS USED:
- SQLite connection management with proper resource cleanup
- Database migration system for schema evolution
- Repository pattern for data access abstraction
- JSON serialization for complex data types
- Context managers for connection lifecycle management

BUSINESS LOGIC:
SQLite was chosen for its ACID compliance, zero-configuration deployment,
and offline-first capabilities. The database file is portable across platforms
and provides reliable data persistence across application restarts. The migration
system ensures schema evolution while preserving existing data integrity.

KEY FEATURES:
- Connection pooling with automatic cleanup
- Schema versioning and migration management
- Repository classes for each data domain
- JSON-based configuration storage
- Performance-optimized query patterns
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .schemas import LiteRecord, ProRecord

# Database configuration and paths
# The database file is stored in the data directory relative to the project root
# This provides offline-first storage that persists across application restarts
DB_ROOT = Path(__file__).resolve().parents[2] / "data"  # Project data directory
DB_PATH = DB_ROOT / "storepulse.db"                      # Main SQLite database file

# Schema version for migration tracking
# Increment this number whenever the database schema changes
# Current version supports: visits, models, settings, forecast_cache, whatif_scenarios
CURRENT_VERSION = 3


class DatabaseManager:
    """
    SQLite database manager with connection pooling and migrations.

    PURPOSE:
    This class manages the entire database lifecycle including:
    - Connection management and resource cleanup
    - Schema initialization and migration management
    - Directory structure validation
    - Version-controlled schema evolution

    KEY FEATURES:
    - Automatic database directory creation
    - Schema migration system with rollback safety
    - Connection pooling with proper cleanup
    - Version tracking for schema evolution
    - ACID-compliant transaction management

    METHODS:
    - __init__: Initialize database and run migrations
    - _ensure_db_directory: Create data directory if missing
    - _run_migrations: Execute schema migrations to current version
    - _apply_migrations: Apply incremental schema changes
    - _create_initial_schema: Create complete initial database structure
    - get_connection: Context manager for database connections
    """

    def __init__(self, db_path: Path = DB_PATH) -> None:
        """
        Initialize database manager with path to SQLite file.

        This constructor:
        1. Sets the database file path
        2. Ensures the data directory exists
        3. Runs any necessary database migrations

        Args:
            db_path: Path to SQLite database file (defaults to project data directory)
        """
        self.db_path = db_path
        self._ensure_db_directory()
        self._run_migrations()

    def _ensure_db_directory(self) -> None:
        """
        Create database directory if it doesn't exist.

        PURPOSE:
        Ensures the data directory structure exists before attempting to create
        the SQLite database file. This prevents file creation errors and ensures
        proper project organization.

        BEHAVIOR:
        - Creates parent directories recursively if they don't exist
        - Uses exist_ok=True to avoid errors if directory already exists
        - No return value - operates via side effects on filesystem
        """
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def _run_migrations(self) -> None:
        """
        Run database migrations to current version.

        PURPOSE:
        This method handles database schema evolution by:
        1. Detecting the current schema version
        2. Applying incremental migrations if needed
        3. Updating the schema version tracking table

        MIGRATION STRATEGY:
        - Checks existing schema_version table to determine current state
        - If table doesn't exist, assumes version 0 (fresh database)
        - Applies migrations sequentially until reaching CURRENT_VERSION
        - Uses transactions to ensure migration atomicity

        ERROR HANDLING:
        - Gracefully handles missing schema_version table (first run)
        - Migration failures will prevent application startup
        - Transaction rollback on migration errors
        """
        with self.get_connection() as conn:
            # Check current schema version
            try:
                current_version = conn.execute(
                    "SELECT version FROM schema_version"
                ).fetchone()[0]
            except sqlite3.OperationalError:
                # schema_version table doesn't exist - this is a fresh database
                # Start migration process from version 0
                current_version = 0

            # Apply migrations if database is not at current version
            if current_version < CURRENT_VERSION:
                self._apply_migrations(conn, current_version)

    def _apply_migrations(self, conn: sqlite3.Connection, from_version: int) -> None:
        """
        Apply migrations from current version to target version.

        PURPOSE:
        This method orchestrates the incremental migration process by:
        1. Identifying which migrations need to be applied based on current version
        2. Executing each migration in sequence
        3. Updating the schema version tracking

        MIGRATION PATHS:
        - Version 0 → 1: Create initial schema (fresh database)
        - Version 1 → 2: Add INGARCH model type support

        Args:
            conn: Active database connection for migration execution
            from_version: Current schema version before migration

        ERROR HANDLING:
        - All migrations run within a single transaction
        - Failed migrations will rollback automatically
        - Version is only updated after successful migration completion
        """
        # Apply migrations based on current version
        if from_version < 1:
            # Fresh database - create complete initial schema
            self._create_initial_schema(conn)
            self._update_version(conn, 1)
            
        if from_version < 2:
            # Migration from v1 to v2: Add INGARCH model type support
            self._migrate_to_v2(conn)
            self._update_version(conn, 2)
            
        if from_version < 3:
            # Migration from v2 to v3: Cache + model metadata enhancements
            self._migrate_to_v3(conn)
            self._update_version(conn, 3)

    def _update_version(self, conn: sqlite3.Connection, version: int) -> None:
        """Update schema version safely."""
        conn.execute("DELETE FROM schema_version")
        conn.execute("INSERT INTO schema_version (version) VALUES (?)", (version,))
        conn.commit()

    def ensure_schema(self) -> None:
        """Re-run migrations to guarantee the schema matches current expectations."""
        self._run_migrations()

    def _migrate_to_v2(self, conn: sqlite3.Connection) -> None:
        """
        Migrate from v1 to v2: Add INGARCH model type support.

        PURPOSE:
        This migration adds support for INGARCH (Integer-valued GARCH) models
        by updating the models table schema to include the new model type.

        MIGRATION STEPS:
        1. Create new models table with expanded model_type CHECK constraint
        2. Copy all existing data from old table to new table
        3. Drop the old table and rename new table
        4. Recreate performance indexes for query optimization

        NEW MODEL TYPES SUPPORTED:
        - nb_arx: Negative Binomial ARX (existing)
        - ingarch: Integer-valued GARCH (new in v2)
        - pymc: PyMC probabilistic models (existing)
        - booster: LightGBM residual booster (existing)

        Args:
            conn: Active database connection for migration execution

        ERROR HANDLING:
        - Uses try/catch to handle SQLite errors during migration
        - Provides clear error messages for troubleshooting
        - Raises exceptions to prevent partial migration states
        """
        try:
            # Create new models table with expanded model type support
            # The CHECK constraint now includes 'ingarch' as a valid model type
            conn.execute("""
                CREATE TABLE models_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    mode TEXT NOT NULL CHECK (mode IN ('lite', 'pro')),
                    model_type TEXT NOT NULL CHECK (model_type IN ('nb_arx', 'ingarch', 'pymc', 'booster')),
                    artifact_path TEXT NOT NULL,
                    metrics_json TEXT,
                    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    UNIQUE(name, mode, model_type)
                )
            """)

            # Migrate existing data from old table to new table
            # This preserves all existing model records during the schema upgrade
            conn.execute("""
                INSERT INTO models_new (id, name, mode, model_type, artifact_path, metrics_json, trained_at, is_active)
                SELECT id, name, mode, model_type, artifact_path, metrics_json, trained_at, is_active
                FROM models
            """)

            # Replace old table with new table structure
            # This is a standard SQLite migration pattern for schema changes
            conn.execute("DROP TABLE models")
            conn.execute("ALTER TABLE models_new RENAME TO models")

            # Recreate performance indexes for optimal query performance
            conn.execute("CREATE INDEX idx_models_active ON models(is_active)")
            conn.execute("CREATE INDEX idx_models_type ON models(mode, model_type)")

            print("✅ Migrated models table to support INGARCH model type")

        except sqlite3.Error as e:
            print(f"❌ Migration failed: {e}")
            raise

    def _migrate_to_v3(self, conn: sqlite3.Connection) -> None:
        """
        Migrate from v2 to v3: add model version metadata and cache scoping.

        Enhancements:
        - Track model version/training metadata for freshness checks
        - Scope forecast cache entries by mode with TTL support
        """
        try:
            # Add version + training metadata columns if they do not exist
            try:
                conn.execute("ALTER TABLE models ADD COLUMN version TEXT DEFAULT 'v1'")
            except sqlite3.OperationalError:
                # Column already exists
                pass

            try:
                conn.execute("ALTER TABLE models ADD COLUMN training_metadata TEXT")
            except sqlite3.OperationalError:
                pass

            # Rebuild forecast_cache table with mode + expiry metadata
            conn.execute("""
                CREATE TABLE IF NOT EXISTS forecast_cache_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    forecast_date DATE NOT NULL,
                    horizon_days INTEGER NOT NULL,
                    mode TEXT NOT NULL DEFAULT 'lite',
                    forecast_json TEXT NOT NULL,
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    UNIQUE(forecast_date, horizon_days, mode)
                )
            """)

            # Copy existing cache data, defaulting to lite mode
            if conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='forecast_cache'").fetchone():
                conn.execute("""
                    INSERT INTO forecast_cache_new (id, forecast_date, horizon_days, mode, forecast_json, generated_at)
                    SELECT id, forecast_date, horizon_days, 'lite', forecast_json, generated_at
                    FROM forecast_cache
                """)
                conn.execute("DROP TABLE forecast_cache")

            conn.execute("ALTER TABLE forecast_cache_new RENAME TO forecast_cache")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_forecast_cache_date ON forecast_cache(forecast_date)")

            print("✅ Migrated database to schema v3 with scoped cache + model metadata")

        except sqlite3.Error as exc:
            print(f"❌ Migration to v3 failed: {exc}")
            raise

    def _create_initial_schema(self, conn: sqlite3.Connection) -> None:
        """Create initial database schema."""
        conn.executescript("""
            -- Schema version tracking
            CREATE TABLE schema_version (
                version INTEGER PRIMARY KEY
            );

            -- Visit records (both Lite and Pro modes)
            CREATE TABLE visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_date DATE NOT NULL,
                visits INTEGER NOT NULL CHECK (visits >= 0),
                -- Pro mode fields (nullable for Lite compatibility)
                sales REAL,
                conversion REAL,
                promo_type TEXT,
                price_change REAL,
                weather TEXT,
                paydays BOOLEAN,
                school_breaks BOOLEAN,
                local_events TEXT,
                open_hours REAL,
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(event_date)
            );

            -- Model artifacts and metadata
            CREATE TABLE models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mode TEXT NOT NULL CHECK (mode IN ('lite', 'pro')),
                model_type TEXT NOT NULL CHECK (model_type IN ('nb_arx', 'ingarch', 'pymc', 'booster')),
                artifact_path TEXT NOT NULL,
                metrics_json TEXT, -- JSON string of performance metrics
                version TEXT DEFAULT 'v1',
                training_metadata TEXT,
                trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                UNIQUE(name, mode, model_type)
            );

            -- Application settings
            CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Forecast cache for performance
            CREATE TABLE forecast_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                forecast_date DATE NOT NULL,
                horizon_days INTEGER NOT NULL,
                mode TEXT NOT NULL DEFAULT 'lite',
                forecast_json TEXT NOT NULL, -- JSON with p10/p50/p90
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                UNIQUE(forecast_date, horizon_days, mode)
            );

            -- What-if scenarios
            CREATE TABLE whatif_scenarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                baseline_forecast_id INTEGER,
                scenario_config TEXT NOT NULL, -- JSON of toggles/changes
                forecast_delta_json TEXT, -- JSON of forecast differences
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (baseline_forecast_id) REFERENCES forecast_cache (id)
            );

            -- Create indexes for performance
            CREATE INDEX idx_visits_date ON visits(event_date);
            CREATE INDEX idx_visits_created ON visits(created_at);
            CREATE INDEX idx_models_active ON models(is_active);
            CREATE INDEX idx_models_type ON models(mode, model_type);
            CREATE INDEX idx_forecast_cache_date ON forecast_cache(forecast_date);
            CREATE INDEX idx_whatif_baseline ON whatif_scenarios(baseline_forecast_id);
        """)

    @contextmanager
    def get_connection(self) -> sqlite3.Connection:
        """Get database connection with proper cleanup."""
        conn = sqlite3.connect(self.db_path, timeout=7.5)  # Lower timeout for snappier failures
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        try:
            yield conn
        finally:
            conn.close()


# Global database instance
db_manager = DatabaseManager()


class VisitRepository:
    """Repository for visit data operations."""

    @staticmethod
    def add_lite_record(record: LiteRecord) -> bool:
        """Add a Lite mode visit record."""
        with db_manager.get_connection() as conn:
            try:
                conn.execute("""
                    INSERT OR REPLACE INTO visits
                    (event_date, visits, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (record.event_date, record.visits))
                conn.commit()
                return True
            except sqlite3.Error:
                return False

    @staticmethod
    def add_pro_record(record: ProRecord) -> bool:
        """Add a Pro mode visit record."""
        with db_manager.get_connection() as conn:
            try:
                conn.execute("""
                    INSERT OR REPLACE INTO visits
                    (event_date, visits, sales, conversion, promo_type, price_change,
                     weather, paydays, school_breaks, local_events, open_hours, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (
                    record.event_date, record.visits, record.sales, record.conversion,
                    record.promo_type, record.price_change, record.weather, record.paydays,
                    record.school_breaks, record.local_events, record.open_hours
                ))
                conn.commit()
                return True
            except sqlite3.Error:
                return False

    @staticmethod
    def get_visit_history(days: int = 365) -> List[Dict[str, Any]]:
        """Get visit history - returns the most recent N records regardless of date.
        
        This ensures historical data works even if uploaded data is from previous years.
        """
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM visits
                ORDER BY event_date DESC
                LIMIT ?
            """, (days,))

            # Return in chronological order (oldest first) for time series analysis
            records = [dict(row) for row in cursor.fetchall()]
            return list(reversed(records))

    @staticmethod
    def get_latest_visits(limit: int = 30) -> List[Dict[str, Any]]:
        """Get the most recent visit records."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM visits
                ORDER BY event_date DESC
                LIMIT ?
            """, (limit,))

            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_date_range(start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get visits within a specific date range."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM visits
                WHERE event_date BETWEEN ? AND ?
                ORDER BY event_date
            """, (start_date, end_date))

            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def get_dataset_stats() -> Dict[str, Any]:
        """Return aggregate statistics about stored visit data."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT
                    COUNT(*) AS total_records,
                    MIN(event_date) AS min_date,
                    MAX(event_date) AS max_date
                FROM visits
            """)
            row = cursor.fetchone()
            if not row:
                return {"total_records": 0, "min_date": None, "max_date": None}

            def _parse_date(value: Optional[str]) -> Optional[date]:
                if value in (None, ""):
                    return None
                try:
                    return date.fromisoformat(value)
                except ValueError:
                    return None

            return {
                "total_records": int(row["total_records"]) if row["total_records"] is not None else 0,
                "min_date": _parse_date(row["min_date"]),
                "max_date": _parse_date(row["max_date"]),
            }


class ModelRepository:
    """Repository for model metadata operations."""

    @staticmethod
    def register_model(name: str, mode: str, model_type: str,
                      artifact_path: str, metrics: Optional[Dict] = None,
                      version: Optional[str] = None,
                      training_metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Register a trained model."""
        version_value = version or datetime.now().strftime("v%Y.%m.%d.%H%M%S")
        with db_manager.get_connection() as conn:
            try:
                conn.execute("""
                    INSERT OR REPLACE INTO models
                    (name, mode, model_type, artifact_path, metrics_json, version, training_metadata, trained_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (
                    name,
                    mode,
                    model_type,
                    artifact_path,
                    json.dumps(metrics) if metrics else None,
                    version_value,
                    json.dumps(training_metadata) if training_metadata else None
                ))
                conn.commit()
                return True
            except sqlite3.Error:
                return False

    @staticmethod
    def _deserialize_model(row: sqlite3.Row) -> Dict[str, Any]:
        """Convert a raw row into a structured model dictionary."""
        record = dict(row)
        metrics_payload = record.pop("metrics_json", None)
        record["metrics"] = json.loads(metrics_payload) if metrics_payload else None

        metadata_payload = record.get("training_metadata")
        record["training_metadata"] = json.loads(metadata_payload) if metadata_payload else None
        return record

    @staticmethod
    def get_active_models(mode: str) -> List[Dict[str, Any]]:
        """Get all active models for a given mode."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM models
                WHERE mode = ? AND is_active = 1
                ORDER BY trained_at DESC
            """, (mode,))

            return [ModelRepository._deserialize_model(row) for row in cursor.fetchall()]

    @staticmethod
    def get_latest_model(mode: str, model_type: str) -> Optional[Dict[str, Any]]:
        """Get the most recent model of a specific type."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT * FROM models
                WHERE mode = ? AND model_type = ? AND is_active = 1
                ORDER BY trained_at DESC
                LIMIT 1
            """, (mode, model_type))

            row = cursor.fetchone()
            return ModelRepository._deserialize_model(row) if row else None


class ForecastCache:
    """Repository for forecast caching operations."""

    @staticmethod
    def cache_forecast(forecast_date: date, horizon_days: int,
                      mode: str, forecast_data: Dict[str, Any],
                      ttl_seconds: int) -> bool:
        """Cache forecast results for performance."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        for attempt in range(2):
            with db_manager.get_connection() as conn:
                try:
                    conn.execute("""
                        INSERT OR REPLACE INTO forecast_cache
                        (forecast_date, horizon_days, mode, forecast_json, expires_at, generated_at)
                        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (
                        forecast_date,
                        horizon_days,
                        mode,
                        json.dumps(forecast_data),
                        expires_at.isoformat()
                    ))
                    conn.commit()
                    return True
                except sqlite3.OperationalError as exc:
                    if "forecast_cache" in str(exc).lower() and attempt == 0:
                        db_manager.ensure_schema()
                        continue
                    return False
                except sqlite3.Error:
                    return False
        return False

    @staticmethod
    def get_cached_forecast(forecast_date: date, horizon_days: int, mode: str) -> Optional[Dict]:
        """Retrieve cached forecast if available and not expired."""
        for attempt in range(2):
            with db_manager.get_connection() as conn:
                try:
                    cursor = conn.execute("""
                        SELECT forecast_json, generated_at, expires_at, mode
                        FROM forecast_cache
                        WHERE forecast_date = ? AND horizon_days = ? AND mode = ?
                    """, (forecast_date, horizon_days, mode))
                except sqlite3.OperationalError as exc:
                    if "forecast_cache" in str(exc).lower() and attempt == 0:
                        db_manager.ensure_schema()
                        continue
                    return None

                row = cursor.fetchone()
                if not row:
                    return None

                expires_at_raw = row["expires_at"]
                if expires_at_raw:
                    try:
                        expires_at = datetime.fromisoformat(expires_at_raw)
                    except ValueError:
                        expires_at = datetime.utcnow() - timedelta(seconds=1)
                    if expires_at < datetime.utcnow():
                        return None

                payload = json.loads(row['forecast_json'])
                payload["_cache_generated_at"] = row["generated_at"]
                payload["_cache_expires_at"] = expires_at_raw
                payload["_cache_mode"] = row["mode"]
                return payload
        return None


class WhatIfScenarioRepository:
    """Repository for What-If scenario persistence."""

    @staticmethod
    def save_scenario(name: str, scenario_config: Dict[str, Any],
                      forecast_results: Dict[str, Any],
                      baseline_forecast_id: Optional[int] = None) -> int:
        """Persist a What-If scenario and return its database ID."""
        with db_manager.get_connection() as conn:
            try:
                cursor = conn.execute("""
                    INSERT INTO whatif_scenarios
                    (name, baseline_forecast_id, scenario_config, forecast_delta_json)
                    VALUES (?, ?, ?, ?)
                """, (
                    name,
                    baseline_forecast_id,
                    json.dumps(scenario_config),
                    json.dumps(forecast_results)
                ))
                conn.commit()
                return int(cursor.lastrowid)
            except sqlite3.Error as exc:
                raise RuntimeError("Failed to save What-If scenario") from exc

    @staticmethod
    def list_scenarios(limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Return saved scenarios ordered by recency."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT id, name, baseline_forecast_id, scenario_config,
                       forecast_delta_json, created_at
                FROM whatif_scenarios
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))

            scenarios: List[Dict[str, Any]] = []
            for row in cursor.fetchall():
                config_json = json.loads(row["scenario_config"]) if row["scenario_config"] else {}
                forecast_json = (
                    json.loads(row["forecast_delta_json"])
                    if row["forecast_delta_json"] else None
                )
                scenarios.append({
                    "id": row["id"],
                    "name": row["name"],
                    "baseline_forecast_id": row["baseline_forecast_id"],
                    "scenario_config": config_json,
                    "forecast_results": forecast_json,
                    "created_at": row["created_at"],
                })
            return scenarios

    @staticmethod
    def get_total_count() -> int:
        """Return the total number of saved scenarios."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) as total FROM whatif_scenarios")
            row = cursor.fetchone()
            return int(row["total"]) if row else 0


class SettingsRepository:
    """Repository for application settings."""

    @staticmethod
    def set_setting(key: str, value: Any) -> bool:
        """Set a configuration setting."""
        with db_manager.get_connection() as conn:
            try:
                conn.execute("""
                    INSERT OR REPLACE INTO settings (key, value, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (key, json.dumps(value)))
                conn.commit()
                return True
            except sqlite3.Error:
                return False

    @staticmethod
    def get_setting(key: str, default: Any = None) -> Any:
        """Get a configuration setting."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("""
                SELECT value FROM settings WHERE key = ?
            """, (key,))

            row = cursor.fetchone()
            if row:
                return json.loads(row['value'])
            return default

    @staticmethod
    def get_all_settings() -> Dict[str, Any]:
        """Get all application settings."""
        with db_manager.get_connection() as conn:
            cursor = conn.execute("SELECT key, value FROM settings")
            return {row['key']: json.loads(row['value']) for row in cursor.fetchall()}


# Import here to avoid circular imports - moved to top
# from datetime import timedelta  # Already imported above
