"""
Ensure all required directories exist for the StorePulse API
Run this before starting the server to avoid file upload errors
"""
from pathlib import Path

# Get the API root directory
API_ROOT = Path(__file__).resolve().parent

# Create required directories
directories = [
    API_ROOT.parent / "data",
    API_ROOT.parent / "data" / "samples",
    API_ROOT.parent / "ml" / "artifacts" / "lite",
    API_ROOT.parent / "ml" / "artifacts" / "pro",
    API_ROOT.parent / "reports" / "backtests",
    API_ROOT.parent / "reports" / "forecasts",
    API_ROOT.parent / "reports" / "exports",
]

def ensure_directories():
    """Create all required directories if they don't exist"""
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"✓ Ensured directory exists: {directory}")
    
    print("\n✅ All directories ready!")

if __name__ == "__main__":
    ensure_directories()
