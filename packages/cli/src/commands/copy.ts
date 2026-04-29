// scync copy command

import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { getValidIdToken } from '../auth.js';
import { getAllSecrets } from '../firestore.js';
import { getSessionKey, isSessionValid } from '../session.js';
import { decrypt } from '../crypto.js';
import { promptSelect } from '../prompt.js';
import type { StoredSecret } from '../types.js';

export async function copyCommand(name: string): Promise<void> {
  // Check session
  if (!isSessionValid()) {
    console.error(chalk.red('✗ Vault is locked. Run: eval $(scync unlock)'));
    process.exit(1);
  }

  const key = await getSessionKey();
  if (!key) {
    console.error(chalk.red('✗ Session key not found'));
    process.exit(1);
  }

  const spinner = ora('Fetching secrets...').start();

  try {
    const idToken = await getValidIdToken();
    const secrets = await getAllSecrets(process.env.SCYNC_SESSION_UID!, idToken);
    
    spinner.stop();

    // Find matching secrets
    const matches = findMatches(secrets, name);

    if (matches.length === 0) {
      console.error(chalk.red(`✗ Secret "${name}" not found`));
      console.error(chalk.dim('Run scync list to see all secrets'));
      process.exit(1);
    }

    let secret: StoredSecret;

    if (matches.length === 1) {
      secret = matches[0]!;
    } else {
      // Multiple matches
      console.log(chalk.yellow(`Multiple secrets match "${name}":\n`));
      
      const choice = await promptSelect(
        'Select a secret:',
        matches.map(s => ({
          title: `${s.name} (${s.service} - ${s.environment})`,
          value: s.id,
        }))
      );

      if (!choice) {
        process.exit(0);
      }

      secret = matches.find(s => s.id === choice)!;
    }

    // Decrypt value
    spinner.start('Decrypting...');
    const value = await decrypt(key, secret.encValue);
    spinner.stop();

    // Copy to clipboard
    writeToClipboard(value);
    
    console.log(chalk.green(`✓ ${secret.name} copied to clipboard`));
    console.log(chalk.dim('  (clears in 30 seconds)'));

    // Clear clipboard after 30 seconds
    setTimeout(() => {
      try {
        writeToClipboard('');
      } catch {
        // Ignore errors when clearing
      }
    }, 30000);

    // Keep process alive for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to copy secret'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

function writeToClipboard(text: string): void {
  const platform = process.platform;
  
  try {
    if (platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (platform === 'win32') {
      execSync('clip', { input: text });
    } else {
      // Linux - try xclip, then xsel, then wl-clipboard
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        try {
          execSync('xsel --clipboard --input', { input: text });
        } catch {
          execSync('wl-copy', { input: text });
        }
      }
    }
  } catch (error) {
    throw new Error('Failed to access clipboard. Install xclip, xsel, or wl-clipboard.');
  }
}

function findMatches(secrets: StoredSecret[], query: string): StoredSecret[] {
  const lowerQuery = query.toLowerCase();
  
  // Exact match first
  const exact = secrets.filter(s => s.name.toLowerCase() === lowerQuery);
  if (exact.length > 0) return exact;
  
  // Substring match
  return secrets.filter(s => s.name.toLowerCase().includes(lowerQuery));
}
