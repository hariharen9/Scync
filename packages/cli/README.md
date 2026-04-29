# scync-cli

Zero-knowledge secrets vault for your terminal. Access your [Scync](https://github.com/hariharen9/Scync) vault directly from the command line.

## Install

```bash
npm install -g scync-cli
```

## Quick Start

```bash
# Sign in with Google (opens browser)
scync login

# Unlock your vault
eval $(scync unlock)

# Print a secret to stdout
scync get OPENAI_KEY

# Inject into a command
OPENAI=$(scync get OPENAI_KEY) npm start

# Load all project secrets into shell
eval $(scync env --project "my-app")

# Copy to clipboard (clears in 30s)
scync copy GITHUB_PAT

# Export as dotenv file
scync env --format dotenv > .env
```

## Commands

### `scync login`
Sign in with Google. Opens your browser for authentication.

### `scync logout`
Sign out and remove stored credentials.

### `scync unlock`
Unlock your vault by entering your vault password. Outputs shell exports for use with `eval`:

```bash
eval $(scync unlock)
```

Session lasts 15 minutes.

### `scync list`
List all secrets (metadata only, values not decrypted):

```bash
scync list
scync list --project "Side Project"
scync list --type "API Key"
scync list --json
```

### `scync get <name>`
Get a secret value. Prints to stdout for piping:

```bash
# Raw output (for piping)
scync get OPENAI_KEY

# With warning box
scync get OPENAI_KEY --show

# As JSON
scync get OPENAI_KEY --json

# Use in commands
STRIPE_KEY=$(scync get STRIPE_SECRET) node server.js
```

### `scync copy <name>`
Copy a secret to clipboard. Auto-clears after 30 seconds:

```bash
scync copy GITHUB_PAT
```

### `scync env`
Export secrets as environment variables:

```bash
# Shell exports (for eval)
eval $(scync env)
eval $(scync env --project "Client X")

# Dotenv format
scync env --format dotenv > .env

# JSON format
scync env --format json | jq -r '.OPENAI_KEY'
```

## Zero-Knowledge Architecture

Your vault password never leaves your machine. Secrets are:
1. Fetched from Firestore as encrypted blobs
2. Decrypted locally using Node's native `crypto.subtle` API
3. Never sent to any server in plaintext

The Scync server only ever sees encrypted data. Even with full database access, your secrets remain secure without your vault password.

## Session Management

The CLI uses an `eval` pattern for session persistence:

```bash
eval $(scync unlock)
```

This exports environment variables that subsequent commands read:
- `SCYNC_SESSION_KEY` - Base64-encoded encryption key
- `SCYNC_SESSION_UID` - Your user ID
- `SCYNC_SESSION_EXPIRES` - Session expiry timestamp

Sessions last 15 minutes. After expiry, run `scync unlock` again.

## Requirements

- Node.js 18 or higher
- A Scync account (create one at [scync.app](https://scync.app))

## Security Notes

- The refresh token is stored in `~/.scync/auth.json` with `chmod 600`
- This token grants access to your encrypted vault data only
- Without your vault password, the token cannot decrypt any secrets
- Session keys are held in memory and environment variables only
- Never commit `.env` files containing secrets to version control

## Examples

```bash
# Inject OpenAI key into a script
OPENAI_API_KEY=$(scync get OPENAI_KEY) node my-script.js

# Load all secrets for a project
eval $(scync env --project "Side Project")
npm run dev

# Create a .env file for local development
scync env --format dotenv > .env.local

# Copy a secret for pasting elsewhere
scync copy AWS_SECRET_ACCESS_KEY

# List all API keys
scync list --type "API Key"

# Get secret as JSON for parsing
scync get STRIPE_SECRET --json | jq -r '.value'
```

## Troubleshooting

**"Not logged in"**
Run `scync login` first.

**"Vault is locked"**
Run `eval $(scync unlock)` to unlock your vault.

**"Session expired"**
Sessions last 15 minutes. Run `eval $(scync unlock)` again.

**"Secret not found"**
Run `scync list` to see all available secrets. Secret names are case-insensitive.

## Documentation

Full documentation: [github.com/hariharen9/Scync](https://github.com/hariharen9/Scync)

## License

MIT
