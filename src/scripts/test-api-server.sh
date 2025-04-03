#!/bin/bash

# Define the user ID to test with
USER_ID="12f71bd2-e9d4-42bd-9951-5179a5ce9378"

# Define endpoints to test
echo "Testing endpoints with user ID: $USER_ID"
echo "---------------------------------"

# Try the learner dashboard endpoint
echo -e "\nTesting: /api/learner/dashboard?userId=$USER_ID"
curl -s "http://localhost:3083/api/learner/dashboard?userId=$USER_ID" | jq 'length'

# Try /api/learner/courses endpoint
echo -e "\nTesting: /api/learner/courses?userId=$USER_ID"
curl -s "http://localhost:3083/api/learner/courses?userId=$USER_ID" | jq 'length'

# Try /api/learner/learning-paths endpoint
echo -e "\nTesting: /api/learner/learning-paths?userId=$USER_ID"
curl -s "http://localhost:3083/api/learner/learning-paths?userId=$USER_ID" | jq 'length'

# Try a direct user profile query
echo -e "\nTesting: /api/learner/profile?userId=$USER_ID"
curl -s "http://localhost:3083/api/learner/profile?userId=$USER_ID" | jq 'length'

echo -e "\nTest complete. If endpoints return mock data, you may need to update the API server code." 