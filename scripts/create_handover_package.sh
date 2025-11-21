#!/usr/bin/env bash
set -euo pipefail

# StorePulse Handover Package Generator
# Creates a complete, verified package for client delivery

PACKAGE_NAME="StorePulse_v1.0.0_Handover"
PACKAGE_DIR="/tmp/${PACKAGE_NAME}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_ROOT="/Users/shenzc/Desktop/projects/StorePulse"

echo "📦 StorePulse Handover Package Generator"
echo "========================================="
echo "Package: ${PACKAGE_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Clean and create package directory
echo "🧹 Preparing package directory..."
rm -rf "${PACKAGE_DIR}"
mkdir -p "${PACKAGE_DIR}"

# Create package structure
mkdir -p "${PACKAGE_DIR}/application"
mkdir -p "${PACKAGE_DIR}/documentation"
mkdir -p "${PACKAGE_DIR}/artifacts"
mkdir -p "${PACKAGE_DIR}/samples"
mkdir -p "${PACKAGE_DIR}/handover"

echo "   ✅ Package structure created"

# Copy application files
echo ""
echo "📋 Copying application files..."
cd "${PROJECT_ROOT}/storepulse"

# Copy source code
cp -r api "${PACKAGE_DIR}/application/"
cp -r app "${PACKAGE_DIR}/application/"
cp -r ml "${PACKAGE_DIR}/application/"
cp -r data "${PACKAGE_DIR}/application/"
cp -r scripts "${PACKAGE_DIR}/application/"
cp -r tests "${PACKAGE_DIR}/application/"

# Copy configuration files
cp README.md "${PACKAGE_DIR}/application/"
cp CHANGELOG.md "${PACKAGE_DIR}/application/" 2>/dev/null || true
cp CONTRIBUTORS.md "${PACKAGE_DIR}/application/" 2>/dev/null || true
cp pytest.ini "${PACKAGE_DIR}/application/" 2>/dev/null || true

echo "   ✅ Application files copied"

# Copy documentation
echo ""
echo "📚 Copying documentation..."
cp -r docs "${PACKAGE_DIR}/documentation/"
cp "${PROJECT_ROOT}/INSTALLATION.md" "${PACKAGE_DIR}/documentation/"
cp "${PROJECT_ROOT}/ACCEPTANCE.md" "${PACKAGE_DIR}/documentation/"
cp "${PROJECT_ROOT}/RELEASE_NOTES_v1.0.1.md" "${PACKAGE_DIR}/documentation/" 2>/dev/null || true

echo "   ✅ Documentation copied"

# Copy model artifacts with verification
echo ""
echo "🤖 Copying and verifying model artifacts..."

ARTIFACTS_VERIFIED=true

# Lite artifacts
if [ -f ml/artifacts/lite/nb_arx_lite_model.pkl ]; then
    cp -r ml/artifacts/lite "${PACKAGE_DIR}/artifacts/"
    echo "   ✅ Lite artifacts copied"
else
    echo "   ⚠️  WARNING: Lite artifacts missing"
    ARTIFACTS_VERIFIED=false
fi

# Pro artifacts
if [ -f ml/artifacts/pro/nb_arx_pro_model.pkl ]; then
    cp -r ml/artifacts/pro "${PACKAGE_DIR}/artifacts/"
    echo "   ✅ Pro artifacts copied"
else
    echo "   ⚠️  WARNING: Pro artifacts missing"
    ARTIFACTS_VERIFIED=false
fi

# Copy sample data
echo ""
echo "📊 Copying sample datasets..."
cp data/samples/*.csv "${PACKAGE_DIR}/samples/" 2>/dev/null || true
cp -r "${PROJECT_ROOT}/handover" "${PACKAGE_DIR}/" 2>/dev/null || true

echo "   ✅ Sample data copied"

# Generate file manifest with checksums
echo ""
echo "🔐 Generating checksums and manifest..."
cd "${PACKAGE_DIR}"

find . -type f -exec shasum -a 256 {} \; > CHECKSUMS.txt
echo "   ✅ SHA-256 checksums generated"

# Create file inventory
cat > MANIFEST.txt << 'EOF'
StorePulse v1.0.0 - Delivery Package Manifest
=============================================
Generated: TIMESTAMP_PLACEHOLDER

PACKAGE CONTENTS:

1. APPLICATION FILES (/application)
   - api/              Backend API (FastAPI)
   - app/              Frontend UI (React + Tauri)
   - ml/               Machine learning models and training
   - data/             Sample data and configuration
   - scripts/          Build and deployment scripts
   - tests/            Test suites
   - README.md         Quick start guide
   - CHANGELOG.md      Version history

2. DOCUMENTATION (/documentation)
   - User_Manual.pdf            Complete user guide
   - Methodology.pdf            Technical methodology
   - INSTALLATION.md            Installation instructions
   - ACCEPTANCE.md              Acceptance criteria evidence
   - DemoScript_v2.txt          Demonstration walkthrough
   - VivaDeck.pptx              Presentation deck

3. MODEL ARTIFACTS (/artifacts)
   - lite/             Pre-trained Lite mode models
   - pro/              Pre-trained Pro mode models
   - *.json            Model metadata and reports

4. SAMPLE DATA (/samples)
   - lite_sample.csv   Lite mode sample dataset
   - pro_sample.csv    Pro mode sample dataset

5. HANDOVER MATERIALS (/handover)
   - Quick_Start_1pager.html    Quick reference guide
   - Data_Template_Guide.html   Data format instructions
   - Handover_Checklist.html    Verification checklist

INSTALLATION INSTRUCTIONS:
1. Extract this package to desired location
2. Navigate to application/ directory
3. Follow INSTALLATION.md for setup
4. Run ./scripts/bootstrap_env.sh
5. Execute demo using DemoScript_v2.txt

VERIFICATION:
- Check CHECKSUMS.txt for file integrity
- Run VERIFICATION_REPORT.txt checks
- Execute tests: pytest tests/test_quality_gates.py

SUPPORT:
- Technical documentation in /documentation
- Troubleshooting in INSTALLATION.md
- Test suite for regression checks
EOF

sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$(date)/" MANIFEST.txt
rm MANIFEST.txt.bak
echo "   ✅ Manifest created"

# Create verification report
echo ""
echo "🔍 Running verification checks..."

cat > VERIFICATION_REPORT.txt << 'EOF'
StorePulse v1.0.0 - Package Verification Report
===============================================

This report validates the completeness and integrity of the delivery package.

VERIFICATION CHECKLIST:
EOF

# Check critical files
echo "" >> VERIFICATION_REPORT.txt
echo "1. CRITICAL APPLICATION FILES:" >> VERIFICATION_REPORT.txt

CRITICAL_FILES=(
    "application/api/requirements.txt"
    "application/api/main.py"
    "application/app/package.json"
    "application/README.md"
    "application/scripts/bootstrap_env.sh"
    "application/scripts/build_mac.sh"
)

ALL_CRITICAL_PRESENT=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file" >> VERIFICATION_REPORT.txt
    else
        echo "   ❌ MISSING: $file" >> VERIFICATION_REPORT.txt
        ALL_CRITICAL_PRESENT=false
    fi
done

# Check documentation
echo "" >> VERIFICATION_REPORT.txt
echo "2. DOCUMENTATION FILES:" >> VERIFICATION_REPORT.txt

DOC_FILES=(
    "documentation/INSTALLATION.md"
    "documentation/ACCEPTANCE.md"
    "documentation/docs/User_Manual.pdf"
    "documentation/docs/Methodology.pdf"
)

ALL_DOCS_PRESENT=true
for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo "   ✅ $file ($SIZE)" >> VERIFICATION_REPORT.txt
    else
        echo "   ⚠️  MISSING: $file" >> VERIFICATION_REPORT.txt
        ALL_DOCS_PRESENT=false
    fi
done

# Check model artifacts
echo "" >> VERIFICATION_REPORT.txt
echo "3. MODEL ARTIFACTS:" >> VERIFICATION_REPORT.txt

MODEL_FILES=(
    "artifacts/lite/nb_arx_lite_model.pkl"
    "artifacts/lite/pymc_model.pkl"
    "artifacts/lite/model_metadata.json"
    "artifacts/pro/nb_arx_pro_model.pkl"
    "artifacts/pro/booster_model.txt"
    "artifacts/pro/model_metadata.json"
)

ALL_MODELS_PRESENT=true
for file in "${MODEL_FILES[@]}"; do
    if [ -f "$file" ]; then
        SIZE=$(du -h "$file" | cut -f1)
        echo "   ✅ $file ($SIZE)" >> VERIFICATION_REPORT.txt
    else
        echo "   ❌ MISSING: $file" >> VERIFICATION_REPORT.txt
        ALL_MODELS_PRESENT=false
    fi
done

# Summary
echo "" >> VERIFICATION_REPORT.txt
echo "VERIFICATION SUMMARY:" >> VERIFICATION_REPORT.txt
echo "===================" >> VERIFICATION_REPORT.txt

if [ "$ALL_CRITICAL_PRESENT" = true ] && [ "$ALL_DOCS_PRESENT" = true ] && [ "$ALL_MODELS_PRESENT" = true ]; then
    echo "✅ PACKAGE COMPLETE - All critical components present" >> VERIFICATION_REPORT.txt
    echo "" >> VERIFICATION_REPORT.txt
    echo "Status: READY FOR CLIENT DELIVERY" >> VERIFICATION_REPORT.txt
    PACKAGE_STATUS="READY"
else
    echo "⚠️  PACKAGE INCOMPLETE - Some components missing" >> VERIFICATION_REPORT.txt
    echo "" >> VERIFICATION_REPORT.txt
    echo "Status: REQUIRES ATTENTION" >> VERIFICATION_REPORT.txt
    PACKAGE_STATUS="INCOMPLETE"
fi

echo "" >> VERIFICATION_REPORT.txt
echo "Generated: $(date)" >> VERIFICATION_REPORT.txt
echo "Package: ${PACKAGE_NAME}" >> VERIFICATION_REPORT.txt

cat VERIFICATION_REPORT.txt

# Create installation quick start
cat > QUICK_START.txt << 'EOF'
StorePulse v1.0.0 - Quick Start Guide
====================================

STEP 1: EXTRACT PACKAGE
   Extract this package to your desired location
   
STEP 2: INSTALL DEPENDENCIES
   cd application/
   ./scripts/bootstrap_env.sh
   
   This will:
   - Create Python virtual environment
   - Install all dependencies
   - Set up frontend packages
   
STEP 3: VERIFY INSTALLATION
   source .venv/bin/activate
   pytest tests/test_quality_gates.py -v
   
STEP 4: RUN DEMONSTRATION
   Follow documentation/docs/DemoScript_v2.txt
   
TROUBLESHOOTING:
   - See documentation/INSTALLATION.md for detailed help
   - Check VERIFICATION_REPORT.txt for package integrity
   - Verify checksums: shasum -c CHECKSUMS.txt

SUPPORT:
   All documentation in /documentation folder
   Sample data in /samples folder
   Pre-trained models in /artifacts folder
EOF

echo ""
echo "📄 Package documentation created"

# Create archive
echo ""
echo "🗜️  Creating archive..."
cd /tmp
ARCHIVE_NAME="${PACKAGE_NAME}_${TIMESTAMP}.tar.gz"
tar -czf "${ARCHIVE_NAME}" "${PACKAGE_NAME}"

ARCHIVE_SIZE=$(du -h "${ARCHIVE_NAME}" | cut -f1)
ARCHIVE_SHA=$(shasum -a 256 "${ARCHIVE_NAME}" | awk '{print $1}')

echo "   ✅ Archive created: ${ARCHIVE_NAME}"
echo "   📊 Size: ${ARCHIVE_SIZE}"
echo "   🔐 SHA-256: ${ARCHIVE_SHA}"

# Final summary
echo ""
echo "✅ HANDOVER PACKAGE COMPLETE"
echo "============================"
echo ""
echo "Package Location: /tmp/${ARCHIVE_NAME}"
echo "Package Status: ${PACKAGE_STATUS}"
echo "Size: ${ARCHIVE_SIZE}"
echo ""
echo "Contents:"
echo "  - Application source code"
echo "  - Complete documentation"
echo "  - Pre-trained model artifacts"
echo "  - Sample datasets"
echo "  - Handover materials"
echo "  - Checksums and verification"
echo ""
echo "Next Steps:"
echo "  1. Review VERIFICATION_REPORT.txt in package"
echo "  2. Transfer archive to client"
echo "  3. Provide SHA-256 checksum for verification"
echo "  4. Guide client through QUICK_START.txt"
echo ""

# Save summary to desktop
SUMMARY_FILE="${PROJECT_ROOT}/HANDOVER_PACKAGE_SUMMARY.txt"
cat > "${SUMMARY_FILE}" << EOF
StorePulse v1.0.0 - Handover Package Summary
===========================================

Package: ${ARCHIVE_NAME}
Created: $(date)
Status: ${PACKAGE_STATUS}
Size: ${ARCHIVE_SIZE}
SHA-256: ${ARCHIVE_SHA}

Location: /tmp/${ARCHIVE_NAME}

VERIFICATION:
  Checksum: shasum -a 256 /tmp/${ARCHIVE_NAME}
  Extract: tar -xzf ${ARCHIVE_NAME}

DELIVERY CHECKLIST:
  [ ] Archive created and verified
  [ ] Checksums validated
  [ ] Documentation complete
  [ ] Model artifacts included
  [ ] Sample data included
  [ ] Installation tested on clean system
  
Transfer Instructions:
  1. Copy /tmp/${ARCHIVE_NAME} to delivery location
  2. Provide SHA-256 checksum to client: ${ARCHIVE_SHA}
  3. Client verifies: shasum -a 256 ${ARCHIVE_NAME}
  4. Client extracts and follows QUICK_START.txt

Generated: $(date)
EOF

echo "📝 Summary saved to: ${SUMMARY_FILE}"
echo ""
