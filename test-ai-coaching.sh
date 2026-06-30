#!/bin/bash
# Test AI Coaching Edge Function
# Run with: bash test-ai-coaching.sh

echo "🧪 Testing AI Coaching Edge Function"
echo "======================================"
echo ""

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY environment variable not set"
  echo ""
  echo "Set it with:"
  echo "  export ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE"
  echo ""
  exit 1
fi

echo "✓ ANTHROPIC_API_KEY found"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI not installed"
  echo ""
  echo "Install with:"
  echo "  npm install -g supabase"
  echo ""
  exit 1
fi

echo "✓ Supabase CLI installed"
echo ""

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
  echo "❌ Error: Supabase project not linked"
  echo ""
  echo "Link with:"
  echo "  supabase login"
  echo "  supabase link --project-ref gokslnrvxqledagcwghq"
  echo ""
  exit 1
fi

echo "✓ Project linked"
echo ""

# Set secret (this will prompt for confirmation)
echo "📝 Setting ANTHROPIC_API_KEY secret..."
echo "$ANTHROPIC_API_KEY" | supabase secrets set ANTHROPIC_API_KEY --stdin

if [ $? -ne 0 ]; then
  echo "❌ Failed to set secret"
  exit 1
fi

echo "✓ Secret set"
echo ""

# Deploy function
echo "🚀 Deploying ai-coaching function..."
cd supabase/functions
supabase functions deploy ai-coaching --no-verify-jwt

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed"
  exit 1
fi

echo "✓ Function deployed"
echo ""

# Get function URL
FUNCTION_URL="https://gokslnrvxqledagcwghq.supabase.co/functions/v1/ai-coaching"
echo "📍 Function URL: $FUNCTION_URL"
echo ""

echo "✅ AI Coaching deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test in CRM: https://shaamelz.com/crm/opportunity-detail.html?id=YOUR_OPP_ID"
echo "2. Click 'Qualification Roadmap' tab"
echo "3. Click '🤖 Get AI Coaching' on any gate"
echo "4. Verify draft/flags/action appear"
echo ""
echo "Monitor logs:"
echo "  supabase functions logs ai-coaching"
echo ""
