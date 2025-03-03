# Authentication Workaround Scripts

This repository contains utility scripts to fix authentication issues in the Learnfinity application. These scripts can help debug and resolve various user authentication problems, particularly when there's a mismatch between the Supabase Auth system and the application database.

## Problem Statement

Users may experience authentication issues when:
- They exist in the application database but not in the Supabase Auth system
- Their email in the Auth system doesn't match the email in the database
- Their password needs to be reset but the reset email functionality isn't working

## Available Scripts

### Main Workaround Solution

These files implement the recommended workaround solution:

- **`auth-workaround.js`**: Main implementation file with authentication functions
- **`auth-mappings.json`**: Maps problematic users to working test accounts
- **`AUTH-WORKAROUND-README.md`**: Detailed documentation on using the workaround

### Diagnostic Scripts

- **`check-user-exists.js`**: Checks if a user exists in both Auth and Database
- **`fix-email-mismatch.js`**: Fixes email mismatches between Auth and Database
- **`fix-authentication-final.js`**: Comprehensive script that attempts multiple fixes

### User Management Scripts

- **`create-test-user.js`**: Creates a test user for development purposes
- **`set-direct-password.js`**: Attempts to set a user's password directly
- **`fix-users-password-reset.js`**: Sends password reset emails to users

## How to Use

### Using the Workaround

1. Install the workaround files in your project
2. Add the following code to your authentication logic:

```javascript
import { authenticateUser } from './auth-workaround';

// Replace your existing authentication
const { data, error, method } = await authenticateUser(email, password);

// Check if authentication was successful
if (error) {
  // Handle authentication error
} else {
  // User authenticated successfully
}
```

### Running the Scripts

Most scripts can be run with Node.js and accept email addresses as parameters:

```bash
# Create a test user
node create-test-user.js

# Check if a user exists
node check-user-exists.js user@example.com

# Fix email mismatch
node fix-email-mismatch.js wrong@email.com correct@email.com --update

# Apply authentication workaround
node simple-workaround.js problematic@email.com
```

## Security Considerations

- These scripts contain workarounds that should only be used in development
- For production, properly fix the underlying authentication issues
- Never commit sensitive information like passwords or API keys

## Contributing

Feel free to contribute additional scripts or improvements to the existing ones by creating pull requests.

## License

MIT 