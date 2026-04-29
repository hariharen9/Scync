// scync unlock command

import chalk from 'chalk';
import ora from 'ora';
import { getAuthConfig } from '../auth.js';
import { getValidIdToken } from '../auth.js';
import { getVaultMeta } from '../firestore.js';
import { deriveKey, checkVerifier } from '../crypto.js';
import { promptPassword } from '../prompt.js';
import { createSessionExport } from '../session.js';

export async function unlockCommand(): Promise<void> {
  // Check if logged in
  const authConfig = getAuthConfig();
  if (!authConfig) {
    console.error(chalk.red('✗ Not logged in. Run: scync login'));
    process.exit(1);
  }

  const spinner = ora('Fetching vault metadata...').start();

  try {
    // Get ID token
    const idToken = await getValidIdToken();
    
    // Fetch vault meta
    const vaultMeta = await getVaultMeta(authConfig.uid, idToken);
    spinner.stop();

    // Prompt for password
    const password = await promptPassword();

    spinner.start('Deriving encryption key...');
    
    // Derive key
    const key = await deriveKey(password, authConfig.uid, vaultMeta.salt);
    
    // Check verifier
    const isValid = await checkVerifier(key, vaultMeta.verifier);
    
    if (!isValid) {
      spinner.fail(chalk.red('Incorrect vault password'));
      process.exit(1);
    }

    spinner.succeed(chalk.green('Vault unlocked'));

    // Output session export for eval
    const sessionExport = await createSessionExport(key, authConfig.uid);
    console.log(sessionExport);
    
    // Print usage hint to stderr (won't interfere with eval)
    console.error(chalk.dim('\n💡 Session active for 15 minutes'));
    console.error(chalk.dim('   Run commands like: scync get <name>'));
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to unlock vault'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}
