# Quick Fix: Rust/Cargo Installation

## If you see: "failed to run 'cargo metadata' command"

### macOS/Linux:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Restart terminal or run:
source ~/.cargo/env

# Verify
cargo --version
```

### Windows:
1. Download: https://rustup.rs/
2. Run `rustup-init.exe`
3. Restart PowerShell/CMD
4. Verify: `cargo --version`

### After Installing:
```bash
cd StorePulse/src
npm install
npm run tauri-dev
```

See TROUBLESHOOTING.md for more details.
