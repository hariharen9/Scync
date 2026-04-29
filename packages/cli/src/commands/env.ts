// scync env command
// Export secrets as shell exports, dotenv, or JSON

import chalk from 'chalk';
import ora from 'ora';
import { getSessionKey, getSessionUid, isSessionValid } from '../session.js';
import { getValidIdToken } from '../auth.js';
import { getAllSecrets, getProjects } from '../firestore.js';
import { decrypt } from '../crypto.js';
import type { StoredSecret, Project } from '../types.js';

interface EnvOptions {
  project?: string;
  format: 'export' | 'dotenv' | 'json';
}

export async function envCommand(options: EnvOptions): Promise<void> {
  // Check session
  if (!isSessionValid()) {
    console.error(chalk.red('✗ Vault is locked. Run: eval $(scync unlock)'));
    process.exit(1);
  }

  const key = await getSessionKey();
  const uid = getSessionUid();

  if (!key || !uid) {
    console.error(chalk.red('✗ Invalid session. Run: eval $(scync unlock)'));
    process.exit(1);
  }

  const spinner = ora('Fetching secrets...').start();

  try {
    const idToken = await getValidIdToken();
    let secrets = await getAllSecrets(uid, idToken);

    // Filter by project if specified
    if (options.project) {
      const projects = await getProjects(uid, idToken);
      const project = projects.find(
        (p: Project) => p.name.toLowerCase() === options.project!.toLowerCase()
      );

      if (!project) {
        spinner.fail(chalk.red(`Project "${options.project}" not found`));
        process.exit(1);
      }

      secrets = secrets.filter((s: StoredSecret) => s.projectId === project.id);
    }

    if (secrets.length === 0) {
      spinner.warn(chalk.yellow('No secrets found'));
      return;
    }

    spinner.text = `Decrypting ${secrets.length} secrets...`;

    // Warn if loading many secrets
    if (secrets.length > 20 && options.format === 'export') {
      spinner.warn(chalk.yellow(`⚠️  Loading ${secrets.length} secrets into environment`));
      console.error(chalk.dim('   All child processes will inherit these values'));
    }

    // Decrypt all secrets in parallel
    const decrypted = await Promise.all(
      secrets.map(async (secret: StoredSecret) => {
        try {
          const value = await decrypt(key, secret.encValue);
          return { name: secret.name, value };
        } catch {
          return null;
        }
      })
    );

    const validSecrets = decrypted.filter((s): s is { name: string; value: string } => s !== null);

    spinner.succeed(chalk.green(`✓ Decrypted ${validSecrets.length} secrets`));

    // Output in requested format
    switch (options.format) {
      case 'export':
        outputAsExport(validSecrets);
        break;
      case 'dotenv':
        outputAsDotenv(validSecrets);
        break;
      case 'json':
        outputAsJson(validSecrets);
        break;
    }

  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch secrets'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

function outputAsExport(secrets: Array<{ name: string; value: string }>): void {
  for (const secret of secrets) {
    // Escape double quotes and backslashes in value
    const escapedValue = secret.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    console.log(`export ${secret.name}="${escapedValue}"`);
  }
}

function outputAsDotenv(secrets: Array<{ name: string; value: string }>): void {
  for (const secret of secrets) {
    // Check if value needs quoting (contains spaces, special chars, etc.)
    const needsQuotes = /[\s"'$`\\]/.test(secret.value);
    if (needsQuotes) {
      const escapedValue = secret.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      console.log(`${secret.name}="${escapedValue}"`);
    } else {
      console.log(`${secret.name}=${secret.value}`);
    }
  }
}

function outputAsJson(secrets: Array<{ name: string; value: string }>): void {
  const obj: Record<string, string> = {};
  for (const secret of secrets) {
    obj[secret.name] = secret.value;
  }
  console.log(JSON.stringify(obj, null, 2));
}
