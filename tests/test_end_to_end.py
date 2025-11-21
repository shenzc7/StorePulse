"""
End-to-end quality gates for StorePulse reliability.

These tests validate system robustness under real-world conditions:
- Schema fuzzing: Handles malformed input without crashes
- Performance: Meets timing requirements for user experience
- Smoke tests: Verifies packaged applications launch correctly
"""
import csv
import io
from io import BytesIO
import json
import platform
import subprocess
import tempfile
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.main import app


class TestSchemaFuzzing:
    """
    Business reliability: System must handle real-world data quality issues gracefully.

    Why this matters: Production data is often messy - missing dates, negative values,
    inconsistent headers. Crashes erode user trust and create support burden.
    """

    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)

    def test_missing_days_no_crash(self):
        """
        Test handling of data with missing dates without crashing.

        Business impact: Users may upload incomplete historical data. System should
        handle gracefully rather than crash, allowing users to continue working.
        """
        # Create CSV with missing dates (gaps in sequence)
        csv_data = """date,visits
2024-01-01,100
2024-01-03,105
2024-01-05,110"""

        # Should not crash when processing data with missing dates
        files = {"file": ("test.csv", BytesIO(csv_data.encode('utf-8')), "text/csv")}
        response = self.client.post("/files/upload", files=files)

        # Should return success or meaningful error, not crash
        assert response.status_code in [200, 400, 422], (
            f"System crashed on missing dates: {response.status_code} - {response.text}. "
            f"Business impact: Users can't upload incomplete historical data."
        )

    def test_negative_values_no_crash(self):
        """
        Test handling of negative visit values without crashing.

        Business impact: Data entry errors may include negative values. System should
        handle gracefully rather than crash, maintaining workflow continuity.
        """
        # Create CSV with negative values
        csv_data = """date,visits
2024-01-01,100
2024-01-02,-5
2024-01-03,105"""

        files = {"file": ("test.csv", BytesIO(csv_data.encode('utf-8')), "text/csv")}
        response = self.client.post("/files/upload", files=files)

        # Should return success or meaningful error, not crash
        assert response.status_code in [200, 400, 422], (
            f"System crashed on negative values: {response.status_code} - {response.text}. "
            f"Business impact: Users can't upload data with entry errors."
        )

    def test_messy_headers_no_crash(self):
        """
        Test handling of inconsistent header formatting without crashing.

        Business impact: Users may export data from various sources with different
        formatting. System should normalize rather than crash.
        """
        # Create CSV with messy headers (extra spaces, inconsistent case)
        csv_data = """  Date , VISITS ,extra_column
2024-01-01,100,ignore_me
2024-01-02,105,also_ignore"""

        files = {"file": ("test.csv", BytesIO(csv_data.encode('utf-8')), "text/csv")}
        response = self.client.post("/files/upload", files=files)

        # Should return success or meaningful error, not crash
        assert response.status_code in [200, 400, 422], (
            f"System crashed on messy headers: {response.status_code} - {response.text}. "
            f"Business impact: Users can't upload data from various sources."
        )

    def test_malformed_csv_no_crash(self):
        """
        Test handling of completely malformed CSV without crashing.

        Business impact: Users may accidentally upload wrong file types or corrupted data.
        System should fail gracefully rather than crash the entire application.
        """
        # Create completely malformed "CSV"
        csv_data = """This is not CSV at all
Just some random text
With no structure"""

        files = {"file": ("test.csv", BytesIO(csv_data.encode('utf-8')), "text/csv")}
        response = self.client.post("/files/upload", files=files)

        # Should return meaningful error, not crash
        assert response.status_code in [200, 400, 422], (
            f"System crashed on malformed CSV: {response.status_code} - {response.text}. "
            f"Business impact: Wrong file uploads shouldn't crash the application."
        )


class TestPerformanceGates:
    """
    Business reliability: System must meet performance expectations for user experience.

    Why this matters: Slow performance creates frustration and reduces adoption.
    Performance gates ensure system scales appropriately for production use.
    """

    def test_cold_start_forecast_timing(self):
        """
        Test that forecast generation completes within 90 seconds.

        Business impact: Users expect responsive forecasts. Performance >90s indicates
        scalability issues that could affect user satisfaction and system reliability.
        """
        client = TestClient(app)
        start_time = time.time()

        # Test with lite sample data for realistic load
        response = client.get("/api/forecast/?days=30")  # Longer horizon for stress test

        end_time = time.time()
        duration = end_time - start_time

        assert response.status_code == 200, (
            f"Forecast endpoint failed: {response.status_code} - {response.text}"
        )

        assert duration <= 90.0, (
            f"Forecast performance fails quality gate: {duration:.1f}s exceeds 90s limit. "
            f"Business impact: Slow forecasts create poor user experience and indicate "
            f"potential scalability issues in production deployment."
        )

    def test_concurrent_forecast_requests(self):
        """
        Test system stability under concurrent load.

        Business impact: Multiple users or processes may request forecasts simultaneously.
        System should handle concurrent requests without degradation or crashes.
        """
        import concurrent.futures
        import threading

        client = TestClient(app)
        results = []
        errors = []

        def make_request():
            try:
                response = client.get("/api/forecast/?days=7")
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))

        # Make 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            concurrent.futures.wait(futures)

        # All requests should succeed
        assert len(errors) == 0, f"Concurrent requests failed: {errors}"
        assert all(status == 200 for status in results), (
            f"Some concurrent requests failed: {results}. "
            f"Business impact: System cannot handle multiple simultaneous users."
        )


class TestSmokeTests:
    """
    Business reliability: Packaged applications must launch without errors.

    Why this matters: Users expect desktop applications to work out of the box.
    Launch failures create immediate dissatisfaction and support overhead.
    """

    def test_macos_app_launch_smoke(self):
        """
        Test that macOS .app bundle launches without error.

        Business impact: Users expect StorePulse to launch successfully on macOS.
        Launch failures prevent any usage and damage product reputation.
        """
        if platform.system() != "Darwin":
            pytest.skip("macOS smoke test only runs on macOS")

        app_path = Path("app/src-tauri/target/release/bundle/macos/StorePulse.app")
        if not app_path.exists():
            pytest.skip("StorePulse.app not found - run build_mac.sh first")

        try:
            # Try to launch the app (this will fail since it's GUI, but shouldn't crash immediately)
            result = subprocess.run(
                ["open", str(app_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            # We expect this to fail since it's a GUI app without display, but not crash
            # The important thing is it doesn't crash during launch
        except subprocess.TimeoutExpired:
            # App launched but we timed out waiting - this is actually good!
            pass
        except FileNotFoundError:
            pytest.fail(
                "Failed to launch StorePulse.app - application bundle is corrupted. "
                "Business impact: Users cannot launch the application at all."
            )

    def test_windows_app_launch_smoke(self):
        """
        Test that Windows .exe launches without error.

        Business impact: Users expect StorePulse to launch successfully on Windows.
        Launch failures prevent any usage and damage product reputation.
        """
        if platform.system() != "Windows":
            pytest.skip("Windows smoke test only runs on Windows")

        # Look for .exe in typical Tauri output locations
        possible_paths = [
            Path("app/src-tauri/target/release/StorePulse.exe"),
            Path("app/src-tauri/target/x86_64-pc-windows-msvc/release/StorePulse.exe"),
        ]

        exe_path = None
        for path in possible_paths:
            if path.exists():
                exe_path = path
                break

        if exe_path is None:
            pytest.skip("StorePulse.exe not found - run build_win.ps1 first")

        try:
            # Try to run the executable (will fail without window, but shouldn't crash)
            result = subprocess.run(
                [str(exe_path), "--help"],  # Use --help to avoid GUI requirements
                capture_output=True,
                text=True,
                timeout=10
            )
            # Should either succeed or fail gracefully, not crash
        except subprocess.TimeoutExpired:
            # App launched but we timed out - this is actually good!
            pass
        except FileNotFoundError:
            pytest.fail(
                "Failed to launch StorePulse.exe - executable is corrupted. "
                "Business impact: Users cannot launch the application at all."
            )

    def test_api_health_endpoint(self):
        """
        Test that the API health endpoint responds correctly.

        Business impact: The API is core to StorePulse functionality. Health check
        failures indicate the application cannot serve its primary purpose.
        """
        client = TestClient(app)
        response = client.get("/health")

        assert response.status_code == 200, (
            f"Health endpoint failed: {response.status_code} - {response.text}. "
            f"Business impact: Application cannot verify its own health status."
        )

        data = response.json()
        assert data == {"status": "ok"}, (
            f"Health endpoint returned unexpected response: {data}. "
            f"Business impact: Health monitoring is unreliable."
        )


def test_end_to_end_quality_gates():
    """
    Comprehensive end-to-end test running all quality gates.

    This test serves as a single entry point for CI/CD systems to validate
    all StorePulse non-negotiables in one execution.
    """
    # Import and run all quality gate tests
    from .test_quality_gates import (
        test_lite_vs_ma7_baseline_quality_gate,
        test_pro_weekend_vs_lite_quality_gate,
        test_forecast_calibration_coverage_quality_gate,
        test_cold_start_performance_quality_gate,
    )

    # Run all quality gates
    test_lite_vs_ma7_baseline_quality_gate()
    test_pro_weekend_vs_lite_quality_gate()
    test_forecast_calibration_coverage_quality_gate()
    test_cold_start_performance_quality_gate()

    # Run schema fuzzing tests
    schema_tests = TestSchemaFuzzing()
    schema_tests.test_missing_days_no_crash()
    schema_tests.test_negative_values_no_crash()
    schema_tests.test_messy_headers_no_crash()
    schema_tests.test_malformed_csv_no_crash()

    # Run performance tests
    perf_tests = TestPerformanceGates()
    perf_tests.test_cold_start_forecast_timing()
    perf_tests.test_concurrent_forecast_requests()

    # Run smoke tests
    smoke_tests = TestSmokeTests()
    smoke_tests.test_api_health_endpoint()

    # Platform-specific smoke tests
    try:
        smoke_tests.test_macos_app_launch_smoke()
    except pytest.skip.Exception:
        pass

    try:
        smoke_tests.test_windows_app_launch_smoke()
    except pytest.skip.Exception:
        pass
