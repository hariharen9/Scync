// scync login command
// Firebase OAuth device flow with local HTTP server

import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { writeAuthConfig, readAuthConfig, FIREBASE_API_KEY } from '../config.js';

const REDIRECT_PORT = 9876;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

// OAuth 2.0 credentials from Google Cloud Console
// Get these from: https://console.cloud.google.com/apis/credentials
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Replace with your Client ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE'; // Replace with your Client Secret

export async function loginCommand(): Promise<void> {
  // Check if already logged in
  const existing = readAuthConfig();
  if (existing) {
    console.log(chalk.yellow(`Already logged in as ${existing.email}`));
    console.log(chalk.dim('Run `scync logout` first to sign in with a different account'));
    return;
  }

  console.log(chalk.cyan('🔐 Scync CLI Login'));
  console.log(chalk.dim('Opening browser for Google Sign-In...\n'));

  const spinner = ora('Waiting for authentication...').start();

  try {
    // Start local HTTP server to capture OAuth callback
    const authCode = await startAuthServer(spinner);
    
    spinner.text = 'Exchanging authorization code for tokens...';
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(authCode);
    
    spinner.text = 'Fetching user info...';
    
    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);
    
    // Save auth config
    writeAuthConfig({
      refreshToken: tokens.refresh_token,
      uid: userInfo.id,
      email: userInfo.email,
    });
    
    spinner.succeed(chalk.green(`✓ Signed in as ${userInfo.email}`));
    console.log(chalk.dim('\nRun `scync unlock` to access your vault'));
    
  } catch (error) {
    spinner.fail(chalk.red('Authentication failed'));
    
    if ((error as Error).message.includes('OAuth')) {
      console.error(chalk.red('\n⚠️  OAuth 2.0 credentials not configured'));
      console.error(chalk.dim('The CLI requires OAuth 2.0 credentials from Google Cloud Console.'));
      console.error(chalk.dim('For now, you can use the web app at https://scync.app'));
    } else {
      console.error(chalk.red((error as Error).message));
    }
    
    process.exit(1);
  }
}

// Start local HTTP server to capture OAuth callback
function startAuthServer(spinner: ReturnType<typeof ora>): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '', `http://localhost:${REDIRECT_PORT}`);
      
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #ef4444;">❌ Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p style="color: #666;">You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #10b981;">✓ Authentication Successful</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);
          server.close();
          resolve(code);
          return;
        }
      }
      
      res.writeHead(404);
      res.end('Not found');
    });
    
    server.listen(REDIRECT_PORT, () => {
      // Open browser to Google OAuth
      const authUrl = buildAuthUrl();
      open(authUrl).catch(() => {
        spinner.stop();
        console.log(chalk.yellow('\n⚠️  Could not open browser automatically'));
        console.log(chalk.cyan('Please open this URL manually:\n'));
        console.log(chalk.underline(authUrl));
        console.log('');
        spinner.start('Waiting for authentication...');
      });
    });
    
    server.on('error', (err) => {
      reject(new Error(`Failed to start local server: ${err.message}`));
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout'));
    }, 5 * 60 * 1000);
  });
}

// Build Google OAuth URL
function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  id_token: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange authorization code: ${error}`);
  }
  
  return await response.json() as {
    access_token: string;
    refresh_token: string;
    id_token: string;
  };
}

// Get user info from Google
async function getUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
}> {
  const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  
  return await response.json() as { id: string; email: string };
}
