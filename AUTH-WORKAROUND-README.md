# Authentication Workaround

## Overview

This workaround provides a solution for users who cannot log in with their own credentials due to authentication issues. It works by mapping problematic users to a working test user account while maintaining their original identity in the application.

## Files

- `auth-mappings.json`: Contains mappings between original user emails and test user credentials
- `auth-workaround.js`: JavaScript module that handles the authentication logic

## How to Use

1. Import the authentication function in your login component:

```javascript
import { authenticateUser } from './auth-workaround';
```

2. Replace your existing authentication logic:

```javascript
// Before
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// After
const { data, error, method } = await authenticateUser(email, password);
```

3. To get user data, use the helper function:

```javascript
import { getUserByEmail } from './auth-workaround';

// Get the user with their original email
const { data: userData } = await getUserByEmail(email);
```

## How It Works

1. The workaround first tries normal authentication
2. If normal authentication fails, it checks for a mapping
3. If a mapping exists, it authenticates with the test user
4. It then wraps the session to maintain the original user's identity

## Additional Features

- `isUsingTestAccount(user)`: Checks if a user is authenticated via a test account
- `getOriginalEmail(user)`: Gets the original email for users using test accounts

## Adding More Users

To add more users to the workaround, run:

```
node simple-workaround.js [email-to-map]
```
