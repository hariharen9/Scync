#!/usr/bin/env node
// Scync CLI - Zero-knowledge secrets vault for your terminal

import { Command } from 'commander';
import chalk from 'chalk';
import { unlockCommand } from './commands/unlock.js';
import { listCommand } from './commands/list.js';
import { getCommand } from './commands/get.js';
import { copyCommand } from './commands/copy.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { envCommand } from './commands/env.js';

const program = new Command();

program
  .name('scync')
  .description('Zero-knowledge secrets vault for your terminal')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Sign in with Google (opens browser)')
  .action(async () => {
    try {
      await loginCommand();
    } catch (error) {
      console.error(chalk.red('✗ Login failed'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// Logout command
program
  .command('logout')
  .description('Sign out and remove stored credentials')
  .action(async () => {
    try {
      await logoutCommand();
    } catch (error) {
      console.error(chalk.red('✗ Logout failed'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// Unlock command
program
  .command('unlock')
  .description('Unlock your vault (prompts for vault password)')
  .action(async () => {
    await unlockCommand();
  });

// List command
program
  .command('list')
  .description('List all secrets (metadata only, no values)')
  .option('--project <name>', 'Filter by project name')
  .option('--type <type>', 'Filter by secret type')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    await listCommand(options);
  });

// Get command
program
  .command('get <name>')
  .description('Print a secret value to stdout')
  .option('--show', 'Show value with warning (instead of raw output)')
  .option('--json', 'Output as JSON')
  .action(async (name, options) => {
    await getCommand(name, options);
  });

// Copy command
program
  .command('copy <name>')
  .description('Copy a secret value to clipboard')
  .action(async (name) => {
    await copyCommand(name);
  });

// Env command
program
  .command('env')
  .description('Output all secrets as shell exports')
  .option('--project <name>', 'Filter by project name')
  .option('--format <format>', 'Output format: export, dotenv, json', 'export')
  .action(async (options) => {
    await envCommand(options);
  });

// Custom help
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ eval $(scync unlock)');
  console.log('  $ scync get OPENAI_KEY');
  console.log('  $ OPENAI_KEY=$(scync get OPENAI_KEY) node script.js');
  console.log('  $ eval $(scync env --project "Side Project")');
  console.log('  $ scync env --format dotenv > .env');
  console.log('');
  console.log('Documentation: https://github.com/hariharen9/Scync');
});

// Check Node version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0] || '0');
if (majorVersion < 18) {
  console.error(chalk.red(`✗ Scync CLI requires Node.js 18 or higher. Current: ${nodeVersion}`));
  process.exit(1);
}

program.parse();
