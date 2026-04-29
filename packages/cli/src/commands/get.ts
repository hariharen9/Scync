// scync get command

import chalk from 'chalk';
import ora from 'ora';
import { getValidIdToken } from '../auth.js';
import { getAllSecrets } from '../firestore.js';
import { getSessionKey, isSessionValid } from '../session.js';
import { decrypt } from '../crypto.js';
import { promptSelect } from '../prompt.js';
import type { StoredSecret } from '../types.js';

interface GetOptions {
  show?: boolean;
  json?: boolean;
}

export async function getCommand(name: string, options: GetOptions): Promise<void> {
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
      // Multiple matches - let user choose
      console.error(chalk.yellow(`Multiple secrets match "${name}":\n`));
      
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

    // Output
    if (options.json) {
      console.log(JSON.stringify({
        name: secret.name,
        service: secret.service,
        value,
        environment: secret.environment,
        type: secret.type,
      }, null, 2));
    } else if (options.show) {
      console.error(chalk.yellow(`\n⚠  Revealing: ${secret.name}`));
      console.error(chalk.dim(`   ${value}`));
      console.error(chalk.dim('   (value visible in terminal history — consider using: scync copy)\n'));
    } else {
      // Raw output to stdout (for piping)
      process.stdout.write(value);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to get secret'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
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
