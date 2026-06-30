# IGNITE_APEX CRM - Email Function Setup
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IGNITE_APEX CRM - Email Function Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
try {
    $version = supabase --version 2>&1
    Write-Host "[OK] Supabase CLI installed: $version" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Supabase CLI not installed" -ForegroundColor Red
    Write-Host "Installing now..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host ""
Write-Host "Step 1: Get your tokens" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need TWO tokens:" -ForegroundColor White
Write-Host ""
Write-Host "1. RESEND API KEY" -ForegroundColor Cyan
Write-Host "   - Go to: https://resend.com/api-keys" -ForegroundColor Gray
Write-Host "   - Create new key" -ForegroundColor Gray
Write-Host "   - Copy the key (starts with re_...)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. SUPABASE ACCESS TOKEN" -ForegroundColor Cyan
Write-Host "   - Go to: https://supabase.com/dashboard/account/tokens" -ForegroundColor Gray
Write-Host "   - Generate new token" -ForegroundColor Gray
Write-Host "   - Copy the token (starts with sbp_...)" -ForegroundColor Gray
Write-Host ""

$supabaseToken = Read-Host "Paste Supabase token (sbp_...)"
$resendKey = Read-Host "Paste Resend API key (re_...)"

Write-Host ""
Write-Host "Step 2: Setting environment variables..." -ForegroundColor Yellow
$env:SUPABASE_ACCESS_TOKEN = $supabaseToken
$env:RESEND_API_KEY = $resendKey
Write-Host "[OK] Environment variables set" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref gokslnrvxqledagcwghq
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to link project" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Project linked" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Setting Resend API key as secret..." -ForegroundColor Yellow
supabase secrets set RESEND_API_KEY=$resendKey
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to set secret" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Secret set" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Deploying email function..." -ForegroundColor Yellow
supabase functions deploy send-credentials-email
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Function deployment failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS! Email automation is live!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test it now:" -ForegroundColor Cyan
Write-Host "1. Go to: https://shaamelz.com/app/auth.html#signup" -ForegroundColor White
Write-Host "2. Register with a real email" -ForegroundColor White
Write-Host "3. Check your inbox for credentials" -ForegroundColor White
Write-Host ""
Write-Host "Function URL:" -ForegroundColor Cyan
Write-Host "https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-credentials-email" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
