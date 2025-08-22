#\!/bin/bash

echo '🔍 Testing Claude Models via ForgetAPI...'
echo '======================================'

# ForgetAPI endpoint
API_URL='https://forgetapi.ru/v1'
API_KEY='fgt-mBjIbBSBETuzCmDkyDmmSikm2mYOzf0O'

# Claude models to test
CLAUDE_MODELS=(
    'claude-3-5-sonnet-20241022'
    'claude-3-7-sonnet-20250219'
    'claude-3-7-sonnet-20250219-thinking'
)

# Test each Claude model
for MODEL in "${CLAUDE_MODELS[@]}"; do
    echo -e "\n📝 Testing model: $MODEL"
    echo '----------------------------------------'
    
    # Make API request
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/chat/completions"         -H "Content-Type: application/json"         -H "Authorization: Bearer $API_KEY"         -d '{
            "model": "'"$MODEL"'",
            "messages": [
                {
                    "role": "user",
                    "content": "Reply with just: Model working"
                }
            ],
            "max_tokens": 50,
            "temperature": 0.7
        }')
    
    # Extract HTTP status code (last line)
    HTTP_CODE=$(echo "$RESPONSE"  < /dev/null |  tail -n 1)
    # Extract response body (all but last line)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Check response
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ $MODEL - WORKING\!"
        echo "Response: $(echo "$BODY" | jq -r '.choices[0].message.content' 2>/dev/null | head -c 100)"
    else
        echo "❌ $MODEL - FAILED\! (HTTP $HTTP_CODE)"
        ERROR_MSG=$(echo "$BODY" | jq -r '.error.message' 2>/dev/null)
        if [ "$ERROR_MSG" \!= "null" ] && [ -n "$ERROR_MSG" ]; then
            echo "Error: $ERROR_MSG"
        else
            echo "Error: $BODY" | head -c 200
        fi
    fi
    
    # Small delay between requests
    sleep 1
done

echo -e "\n======================================"
echo '📊 Test Summary:'
echo '- If you see ✅ for all models, they are working correctly'
echo '- If you see ❌, those models may have issues with ForgetAPI'
