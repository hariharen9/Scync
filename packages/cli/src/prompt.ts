// Secure password prompt utility

import prompts from 'prompts';

export async function promptPassword(message: string = 'Vault password:'): Promise<string> {
  const response = await prompts({
    type: 'password',
    name: 'password',
    message,
  });
  
  if (!response.password) {
    process.exit(0); // User cancelled
  }
  
  return response.password;
}

export async function promptConfirm(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: false,
  });
  
  return response.confirmed || false;
}

export async function promptSelect<T extends string>(
  message: string,
  choices: Array<{ title: string; value: T }>
): Promise<T | null> {
  const response = await prompts({
    type: 'select',
    name: 'value',
    message,
    choices,
  });
  
  return response.value || null;
}
