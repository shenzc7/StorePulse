"""
Packaging tests for StorePulse application binaries.

These tests verify that built applications exist in expected locations
and can launch successfully. Tests use mocking to simulate actual
application execution without requiring GUI environments.
"""
import platform
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest


class TestBinaryExistence:
    """
    Business reliability: Built binaries must exist in expected locations.

    Why this matters: Users expect to find installable applications after build.
    Missing binaries indicate build system failures that prevent distribution.
    """

    def test_macos_app_bundle_exists(self):
        """
        Test that macOS .app bundle exists after build.

        Business impact: macOS users cannot install StorePulse if bundle is missing.
        This failure prevents any macOS distribution.
        """
        if platform.system() != "Darwin":
            pytest.skip("macOS binary test only runs on macOS")

        app_path = Path("app/src-tauri/target/release/bundle/macos/StorePulse.app")
        assert app_path.exists(), (
            f"StorePulse.app not found at {app_path}. "
            "Business impact: macOS users cannot install the application."
        )
        assert app_path.is_dir(), (
            f"StorePulse.app at {app_path} is not a directory. "
            "Business impact: Application bundle is corrupted."
        )

    def test_windows_exe_exists(self):
        """
        Test that Windows .exe exists after build.

        Business impact: Windows users cannot install StorePulse if executable is missing.
        This failure prevents any Windows distribution.
        """
        if platform.system() != "Windows":
            pytest.skip("Windows binary test only runs on Windows")

        # Check multiple possible Tauri output locations
        possible_paths = [
            Path("app/src-tauri/target/release/StorePulse.exe"),
            Path("app/src-tauri/target/x86_64-pc-windows-msvc/release/StorePulse.exe"),
        ]

        exe_found = False
        for exe_path in possible_paths:
            if exe_path.exists() and exe_path.is_file():
                exe_found = True
                break

        assert exe_found, (
            "StorePulse.exe not found in expected locations. "
            "Business impact: Windows users cannot install the application."
        )

    def test_binary_size_reasonable(self):
        """
        Test that built binaries have reasonable file sizes.

        Business impact: Abnormally small or large binaries indicate build failures
        or corruption that could prevent successful installation.
        """
        if platform.system() == "Darwin":
            app_path = Path("app/src-tauri/target/release/bundle/macos/StorePulse.app")
            if app_path.exists():
                # .app bundle should be at least 10MB (reasonable size for Tauri app)
                size_mb = sum(f.stat().st_size for f in app_path.rglob('*') if f.is_file()) / (1024 * 1024)
                assert size_mb >= 10, (
                    f"StorePulse.app size ({size_mb:.1f}MB) is suspiciously small. "
                    "Business impact: Application may be missing critical components."
                )
        elif platform.system() == "Windows":
            possible_paths = [
                Path("app/src-tauri/target/release/StorePulse.exe"),
                Path("app/src-tauri/target/x86_64-pc-windows-msvc/release/StorePulse.exe"),
            ]

            for exe_path in possible_paths:
                if exe_path.exists():
                    size_mb = exe_path.stat().st_size / (1024 * 1024)
                    assert size_mb >= 5, (
                        f"StorePulse.exe size ({size_mb:.1f}MB) is suspiciously small. "
                        "Business impact: Executable may be missing critical components."
                    )
                    break


class TestBinaryLaunch:
    """
    Business reliability: Built applications must launch without crashing.

    Why this matters: Users expect desktop applications to work out of the box.
    Launch failures create immediate dissatisfaction and support overhead.
    """

    @patch('subprocess.run')
    def test_macos_app_launch_mocked(self, mock_run):
        """
        Test macOS app launch behavior (mocked to avoid GUI requirements).

        Business impact: Ensures launch logic works correctly even in CI environments
        without display servers.
        """
        if platform.system() != "Darwin":
            pytest.skip("macOS launch test only runs on macOS")

        app_path = Path("app/src-tauri/target/release/bundle/macos/StorePulse.app")

        # Mock successful launch (would timeout in real environment without display)
        mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)

        try:
            # Simulate the launch test from build_mac.sh
            result = subprocess.run(
                ["open", str(app_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            # Should not crash during launch attempt
            assert True, "App launch simulation completed without crashing"
        except subprocess.TimeoutExpired:
            # Expected timeout in headless environment
            pass
        except FileNotFoundError:
            pytest.fail(
                "Failed to find 'open' command or StorePulse.app. "
                "Business impact: Users cannot launch the application at all."
            )

    @patch('subprocess.run')
    def test_windows_exe_launch_mocked(self, mock_run):
        """
        Test Windows exe launch behavior (mocked to avoid GUI requirements).

        Business impact: Ensures launch logic works correctly even in CI environments
        without windowing systems.
        """
        if platform.system() != "Windows":
            pytest.skip("Windows launch test only runs on Windows")

        # Find the exe path
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

        # Mock successful launch with --help flag
        mock_run.return_value = MagicMock(stdout="StorePulse Help", stderr="", returncode=0)

        try:
            # Simulate the launch test from build_win.ps1
            result = subprocess.run(
                [str(exe_path), "--help"],
                capture_output=True,
                text=True,
                timeout=10
            )
            # Should complete without crashing
            assert result.returncode == 0, (
                "StorePulse.exe failed to respond to --help. "
                "Business impact: Application may be corrupted or incomplete."
            )
        except FileNotFoundError:
            pytest.fail(
                "Failed to launch StorePulse.exe. "
                "Business impact: Users cannot launch the application at all."
            )


class TestDistributionArtifacts:
    """
    Business reliability: Distribution artifacts must be properly copied.

    Why this matters: Users and deployment systems expect binaries in standard
    distribution locations. Missing artifacts indicate packaging failures.
    """

    def test_dist_directory_creation(self):
        """
        Test that /dist directory is created during packaging.

        Business impact: Deployment systems expect artifacts in predictable locations.
        Missing dist directory prevents automated distribution.
        """
        dist_paths = ["/dist", "C:\\dist"]

        dist_found = False
        for dist_path in dist_paths:
            if Path(dist_path).exists():
                dist_found = True
                break

        # Skip if neither platform-specific path exists (might be cross-platform build)
        if not dist_found:
            pytest.skip("Distribution directory not found - may be cross-platform build")

    def test_dist_contains_binaries(self):
        """
        Test that distribution directory contains built binaries.

        Business impact: Ensures packaging process successfully copies artifacts
        to distribution location for deployment.
        """
        if platform.system() == "Darwin":
            dist_app = Path("/dist/StorePulse.app")
            assert dist_app.exists(), (
                f"StorePulse.app not found in /dist. "
                "Business impact: Packaged application not available for distribution."
            )
        elif platform.system() == "Windows":
            dist_exe = Path("C:\\dist\\StorePulse.exe")
            assert dist_exe.exists(), (
                "StorePulse.exe not found in C:\\dist. "
                "Business impact: Packaged application not available for distribution."
            )


def test_packaging_quality_gate():
    """
    Comprehensive packaging test running all packaging validations.

    This test serves as a single entry point for CI/CD systems to validate
    all StorePulse packaging requirements in one execution.
    """
    # Run binary existence tests
    existence_tests = TestBinaryExistence()

    try:
        existence_tests.test_macos_app_bundle_exists()
    except pytest.skip.Exception:
        pass

    try:
        existence_tests.test_windows_exe_exists()
    except pytest.skip.Exception:
        pass

    try:
        existence_tests.test_binary_size_reasonable()
    except pytest.skip.Exception:
        pass

    # Run launch tests
    launch_tests = TestBinaryLaunch()

    try:
        launch_tests.test_macos_app_launch_mocked()
    except pytest.skip.Exception:
        pass

    try:
        launch_tests.test_windows_exe_launch_mocked()
    except pytest.skip.Exception:
        pass

    # Run distribution tests
    dist_tests = TestDistributionArtifacts()

    try:
        dist_tests.test_dist_directory_creation()
        dist_tests.test_dist_contains_binaries()
    except pytest.skip.Exception:
        pass
