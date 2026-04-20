# ============================================================================
# ROUNDTRIP ENCRYPTION TEST - PowerShell Best Practices
# Tests full encrypt/decrypt cycle with SHA-256 verification
# ============================================================================

$ErrorActionPreference = 'Stop'

Write-Output 'Step 1: Create test file'
$testContent = @"
This is a test file for encryption round-trip verification.
It contains multiple lines of text to ensure proper UTF-8 handling.
Testing: Special chars: !@#$%^&*() and Unicode: café ñ 中文
"@

# Use proper variable name instead of automatic $pwd
$workingDir = (Get-Location).Path
Write-Output "Working directory: $workingDir"

$testFilePath = Join-Path $workingDir 'test_plain.txt'
Set-Content -Path $testFilePath -Value $testContent -Encoding utf8
Write-Output "✓ Created test file: $testFilePath ($(Get-Item $testFilePath).Length) bytes"

Write-Output ''
Write-Output 'Step 2: Compute original SHA-256 hash'
$originalHash = (Get-FileHash -Algorithm SHA256 $testFilePath).Hash
Write-Output "✓ Original hash: $originalHash"

Write-Output ''
Write-Output 'Step 3: Encrypt file via browser UI'
Write-Output "Instructions:"
Write-Output "  1. Visit: http://localhost:8080"
Write-Output "  2. Sign in with Google"
Write-Output "  3. Go to 'Document' page"
Write-Output "  4. Paste test content in 'Encrypt Text' area"
Write-Output "  5. Click 'Encrypt Text'"
Write-Output "  6. Copy the AES key (64 hex characters)"
Write-Output ""

# Wait for user to complete encryption
$aesKey = Read-Host "Paste the AES key from encryption result"
if ($aesKey.Length -ne 64) {
    Write-Error "Invalid AES key length (expected 64 chars, got $($aesKey.Length))"
    exit 1
}
Write-Output "✓ Received AES key: $($aesKey.Substring(0,16))..."

Write-Output ''
Write-Output 'Step 4: Download encrypted file'
Write-Output "Navigate to Document page and click 'Download Encrypted' button"
$encryptedPath = Read-Host "Enter path to encrypted file"
if ($encryptedPath -and (Test-Path $encryptedPath)) {
    $encSize = (Get-Item $encryptedPath).Length
    Write-Output "✓ Found encrypted file: $encryptedPath ($encSize bytes)"
} else {
    Write-Error "Encrypted file not found"
    exit 1
}

Write-Output ''
Write-Output 'Step 5: Decrypt via browser UI'
Write-Output "Instructions:"
Write-Output "  1. Go to 'Decrypt' page on http://localhost:8080"
Write-Output "  2. Upload the encrypted file"
Write-Output "  3. Paste AES key: $($aesKey.Substring(0,16))..."
Write-Output "  4. Click 'Decrypt'"
Write-Output "  5. Copy the plaintext result"

$decryptedText = Read-Host "Paste the decrypted plaintext here"
if ([string]::IsNullOrWhiteSpace($decryptedText)) {
    Write-Error "No decrypted text provided"
    exit 1
}

# Strip UTF-8 BOM if present
if ($decryptedText.Length -gt 0 -and $decryptedText[0] -eq ([char]0xFEFF)) {
    $decryptedText = $decryptedText.Substring(1)
    Write-Output "✓ Removed UTF-8 BOM"
}

Write-Output ''
Write-Output 'Step 6: Save decrypted text and verify'
$decryptedPath = Join-Path $workingDir 'test_decrypted.txt'
Set-Content -Path $decryptedPath -Value $decryptedText -Encoding utf8
$decryptedHash = (Get-FileHash -Algorithm SHA256 $decryptedPath).Hash
Write-Output "✓ Saved decrypted text: $decryptedPath"
Write-Output "✓ Decrypted hash: $decryptedHash"

Write-Output ''
Write-Output '=' * 70
Write-Output 'FINAL VERIFICATION'
Write-Output '=' * 70
if ($originalHash -eq $decryptedHash) {
    Write-Output "✅ SUCCESS! Round-trip encryption/decryption verified!"
    Write-Output "   Original and decrypted files are identical (same SHA-256)"
    Write-Output ""
    Write-Output "   Original:  $originalHash"
    Write-Output "   Decrypted: $decryptedHash"
} else {
    Write-Output "❌ FAILURE! Hash mismatch detected"
    Write-Output ""
    Write-Output "   Original:  $originalHash"
    Write-Output "   Decrypted: $decryptedHash"
    Write-Output ""
    Write-Output "Possible causes:"
    Write-Output "  - Text encoding mismatch (UTF-8 vs UTF-16)"
    Write-Output "  - Line ending differences (CRLF vs LF)"
    Write-Output "  - BOM (Byte Order Mark) issues"
    Write-Output "  - Encryption/decryption error"
    exit 1
}

Write-Output ''
Write-Output "Test files saved:"
Write-Output "  - Original:  $testFilePath"
Write-Output "  - Decrypted: $decryptedPath"
