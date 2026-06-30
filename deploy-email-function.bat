@echo off
echo ========================================
echo IGNITE_APEX CRM - Email Function Setup
echo ========================================
echo.

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Supabase CLI not installed
    echo Installing now...
    npm install -g supabase
)

echo.
echo Step 1: Get your tokens
echo ------------------------
echo.
echo You need TWO tokens:
echo.
echo 1. RESEND API KEY
echo    - Go to: https://resend.com/api-keys
echo    - Create new key
echo    - Copy the key (starts with re_...)
echo.
echo 2. SUPABASE ACCESS TOKEN
echo    - Go to: https://supabase.com/dashboard/account/tokens
echo    - Generate new token
echo    - Copy the token (starts with sbp_...)
echo.

set /p SUPABASE_TOKEN="Paste Supabase token (sbp_...): "
set /p RESEND_KEY="Paste Resend API key (re_...): "

echo.
echo Step 2: Setting environment variables...
set SUPABASE_ACCESS_TOKEN=%SUPABASE_TOKEN%
set RESEND_API_KEY=%RESEND_KEY%
echo [OK] Environment variables set

echo.
echo Step 3: Linking to Supabase project...
supabase link --project-ref gokslnrvxqledagcwghq
if %errorlevel% neq 0 (
    echo [ERROR] Failed to link project
    pause
    exit /b 1
)
echo [OK] Project linked

echo.
echo Step 4: Setting Resend API key as secret...
supabase secrets set RESEND_API_KEY=%RESEND_KEY%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to set secret
    pause
    exit /b 1
)
echo [OK] Secret set

echo.
echo Step 5: Deploying email function...
supabase functions deploy send-credentials-email
if %errorlevel% neq 0 (
    echo [ERROR] Function deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Email automation is live!
echo ========================================
echo.
echo Test it now:
echo 1. Go to: https://shaamelz.com/app/auth.html#signup
echo 2. Register with a real email
echo 3. Check your inbox for credentials
echo.
echo Function URL:
echo https://gokslnrvxqledagcwghq.supabase.co/functions/v1/send-credentials-email
echo.

pause
