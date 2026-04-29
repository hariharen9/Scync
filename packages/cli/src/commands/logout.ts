// scync logout command

import chalk from 'chalk';
import { deleteAuthConfig, readAuthConfig } from '../config.js';

export async function logoutCommand(): Promise<void> {
  const config = readAuthConfig();
  
  if (!config) {
    console.log(chalk.yellow('Not logged in'));
    return;
  }
  
  deleteAuthConfig();
  console.log(chalk.green('✓ Signed out'));
}
