// scync list command

import chalk from 'chalk';
import ora from 'ora';
import { getValidIdToken } from '../auth.js';
import { getAllSecrets, getAllProjects } from '../firestore.js';
import { getSession, isSessionValid } from '../session.js';
import type { StoredSecret, Project } from '../types.js';

interface ListOptions {
  project?: string;
  type?: string;
  json?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  // Check session
  if (!isSessionValid()) {
    console.error(chalk.red('✗ Vault is locked. Run: eval $(scync unlock)'));
    process.exit(1);
  }

  const session = getSession();
  if (!session) {
    console.error(chalk.red('✗ Session not found'));
    process.exit(1);
  }

  const spinner = ora('Fetching secrets...').start();

  try {
    const idToken = await getValidIdToken();
    
    // Fetch secrets and projects in parallel
    const [secrets, projects] = await Promise.all([
      getAllSecrets(session.uid, idToken),
      getAllProjects(session.uid, idToken),
    ]);

    spinner.stop();

    // Filter secrets
    let filtered = secrets;
    
    if (options.project) {
      const project = projects.find(p => 
        p.name.toLowerCase() === options.project!.toLowerCase()
      );
      if (project) {
        filtered = filtered.filter(s => s.projectId === project.id);
      } else {
        console.error(chalk.yellow(`⚠ Project "${options.project}" not found`));
      }
    }
    
    if (options.type) {
      filtered = filtered.filter(s => 
        s.type.toLowerCase() === options.type!.toLowerCase()
      );
    }

    if (filtered.length === 0) {
      console.log(chalk.dim('No secrets found'));
      return;
    }

    // Output
    if (options.json) {
      // JSON output (no encrypted fields)
      const output = filtered.map(s => ({
        id: s.id,
        name: s.name,
        service: s.service,
        type: s.type,
        environment: s.environment,
        status: s.status,
        projectId: s.projectId,
        expiresOn: s.expiresOn,
        lastRotated: s.lastRotated,
        createdAt: s.createdAt,
      }));
      console.log(JSON.stringify(output, null, 2));
    } else {
      // Table output
      printTable(filtered, projects);
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to fetch secrets'));
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

function printTable(secrets: StoredSecret[], projects: Project[]): void {
  // Header
  console.log(
    chalk.bold(
      padRight('NAME', 30) +
      padRight('SERVICE', 15) +
      padRight('TYPE', 18) +
      padRight('ENVIRONMENT', 14) +
      padRight('STATUS', 10) +
      'EXPIRES'
    )
  );

  // Rows
  for (const secret of secrets) {
    const projectName = secret.projectId
      ? projects.find(p => p.id === secret.projectId)?.name || ''
      : '';
    
    const name = projectName ? `${chalk.green(projectName)}/${secret.name}` : secret.name;
    const expires = secret.expiresOn
      ? new Date(secret.expiresOn).toISOString().split('T')[0]
      : '—';
    
    const statusColor = secret.status === 'Active' ? chalk.green : chalk.yellow;
    
    console.log(
      padRight(name, 30) +
      padRight(secret.service, 15) +
      padRight(secret.type, 18) +
      padRight(secret.environment, 14) +
      padRight(statusColor(secret.status), 10) +
      expires
    );
  }
  
  console.log(chalk.dim(`\n${secrets.length} secret${secrets.length === 1 ? '' : 's'}`));
}

function padRight(str: string, width: number): string {
  // Strip ANSI codes for length calculation
  const plainStr = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, width - plainStr.length);
  return str + ' '.repeat(padding);
}
