export interface ImportedPassword {
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  category?: string;
}

export function parseGooglePasswordsCsv(csvText: string): ImportedPassword[] {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) return [];
  
  const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().trim());
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const urlIdx = headers.findIndex(h => h.includes('url'));
  const userIdx = headers.findIndex(h => h.includes('username'));
  const passIdx = headers.findIndex(h => h.includes('password'));
  const noteIdx = headers.findIndex(h => h.includes('note'));
  
  if (nameIdx === -1 || userIdx === -1 || passIdx === -1) {
    throw new Error('Invalid Google Passwords CSV format');
  }

  const results: ImportedPassword[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length < 4) continue; // Basic validation
    
    const password = row[passIdx] || '';
    if (!password) continue;

    results.push({
      name: row[nameIdx] || 'Unnamed',
      url: urlIdx !== -1 ? row[urlIdx] : '',
      username: row[userIdx] || '',
      password,
      notes: noteIdx !== -1 ? row[noteIdx] : '',
    });
  }
  
  return results;
}

export function parseBitwardenCsv(csvText: string): ImportedPassword[] {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) return [];

  const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().trim());
  const typeIdx = headers.findIndex(h => h === 'type');
  const nameIdx = headers.findIndex(h => h === 'name');
  const urlIdx = headers.findIndex(h => h === 'login_uri');
  const userIdx = headers.findIndex(h => h === 'login_username');
  const passIdx = headers.findIndex(h => h === 'login_password');
  const noteIdx = headers.findIndex(h => h === 'notes');
  const folderIdx = headers.findIndex(h => h === 'folder');

  if (nameIdx === -1 || userIdx === -1 || passIdx === -1) {
    throw new Error('Invalid Bitwarden CSV format');
  }

  const results: ImportedPassword[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    
    // Only import 'login' types from Bitwarden if type column exists
    if (typeIdx !== -1 && row[typeIdx] !== 'login' && row[typeIdx] !== '') continue; 
    
    const password = row[passIdx] || '';
    if (!password) continue;

    results.push({
      name: row[nameIdx] || 'Unnamed',
      url: urlIdx !== -1 ? row[urlIdx] : '',
      username: row[userIdx] || '',
      password,
      notes: noteIdx !== -1 ? row[noteIdx] : '',
      category: folderIdx !== -1 ? row[folderIdx] : undefined,
    });
  }

  return results;
}

// Handles newlines inside quotes
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++; // skip \n
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  return lines;
}

function parseCsvRow(text: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
