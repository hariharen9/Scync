export const generatePortableVault = (data: any, uid: string) => {
  const jsonStr = JSON.stringify(data);
  const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scync - Portable Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Mono&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #060606;
            --surface: #141414;
            --border: #282828;
            --text: #ececec;
            --text-muted: #888888;
            --green: #10b981;
            --red: #ef4444;
        }
        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'DM Mono', monospace;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 500px;
            padding: 24px;
        }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 32px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        h1 {
            font-family: 'Syne', sans-serif;
            font-size: 24px;
            margin: 0 0 8px 0;
            letter-spacing: -0.02em;
        }
        p { color: var(--text-muted); font-size: 13px; margin: 0 0 24px 0; }
        input {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 12px;
            color: var(--text);
            font-family: inherit;
            font-size: 14px;
            margin-bottom: 16px;
            box-sizing: border-box;
            outline: none;
        }
        input:focus { border-color: var(--green); }
        button {
            width: 100%;
            background: var(--text);
            color: var(--bg);
            border: none;
            padding: 12px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
        }
        button:hover { opacity: 0.9; }
        #error { color: var(--red); font-size: 12px; margin-top: 12px; display: none; }
        
        /* Decrypted View */
        #vault-view { display: none; max-width: 800px; width: 90%; margin: 40px auto; }
        .secret-item {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .secret-info h3 { margin: 0; font-size: 14px; }
        .secret-info span { font-size: 11px; color: var(--text-muted); }
        .copy-btn {
            background: var(--border);
            color: var(--text);
            border: none;
            padding: 6px 12px;
            font-size: 11px;
            cursor: pointer;
        }
        .copy-btn:hover { background: var(--green); color: white; }
        .header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .search { margin-bottom: 20px; }
    </style>
</head>
<body>
    <div id="auth-view" class="container">
        <div class="card">
            <h1>Scync Portable</h1>
            <p>Enter master password to decrypt vault.</p>
            <input type="password" id="password" placeholder="Master Password" autofocus>
            <button id="unlock-btn">Unlock Vault</button>
            <div id="error">Incorrect password or corrupted vault.</div>
        </div>
    </div>

    <div id="vault-view">
        <div class="header-box">
            <div>
                <h1 style="margin:0">Scync Vault</h1>
                <p style="margin:0">Offline Backup • Decrypted in memory</p>
            </div>
            <button onclick="location.reload()" style="width: auto; padding: 6px 12px; font-size: 11px;">Lock</button>
        </div>
        
        <input type="text" id="search" class="search" placeholder="Search secrets..." oninput="filterSecrets()">
        
        <div id="secrets-list"></div>
    </div>

    <script>
        const vaultData = JSON.parse(decodeURIComponent(escape(atob("${base64Data}"))));
        const uid = "${uid}";
        let decryptedSecrets = [];

        async function deriveKey(password, uid, saltBase64) {
            const inputMaterial = password + uid;
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                encoder.encode(inputMaterial),
                "PBKDF2",
                false,
                ["deriveKey"]
            );

            const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

            return crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: 310000,
                    hash: "SHA-256"
                },
                keyMaterial,
                { name: "AES-GCM", length: 256 },
                false,
                ["decrypt"]
            );
        }

        async function decrypt(key, ivBase64, ciphertextBase64) {
            const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
            const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
            
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            
            return new TextDecoder().decode(decrypted);
        }

        async function unlock() {
            const pass = document.getElementById('password').value;
            const btn = document.getElementById('unlock-btn');
            const error = document.getElementById('error');
            
            btn.disabled = true;
            btn.innerText = 'Decrypting...';
            error.style.display = 'none';

            try {
                const key = await deriveKey(pass, uid, vaultData.meta.salt);
                
                // Check verifier
                try {
                    await decrypt(key, vaultData.meta.verifier.iv, vaultData.meta.verifier.ciphertext);
                } catch {
                    throw new Error('Invalid password');
                }

                // Decrypt all
                decryptedSecrets = await Promise.all(vaultData.secrets.map(async s => {
                    const value = await decrypt(key, s.encValue.iv, s.encValue.ciphertext);
                    const notes = s.encNotes ? await decrypt(key, s.encNotes.iv, s.encNotes.ciphertext) : '';
                    const project = vaultData.projects.find(p => p.id === s.projectId);
                    return { ...s, value, notes, projectName: project ? project.name : 'Unknown' };
                }));

                document.getElementById('auth-view').style.display = 'none';
                document.getElementById('vault-view').style.display = 'block';
                renderSecrets();
            } catch (e) {
                console.error(e);
                error.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Unlock Vault';
            }
        }

        function renderSecrets(filter = '') {
            const list = document.getElementById('secrets-list');
            list.innerHTML = '';
            
            const filtered = decryptedSecrets.filter(s => 
                s.name.toLowerCase().includes(filter.toLowerCase()) || 
                s.projectName.toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach(s => {
                const div = document.createElement('div');
                div.className = 'secret-item';
                div.innerHTML = \`
                    <div class="secret-info">
                        <h3>\${s.name}</h3>
                        <span>\${s.projectName} • \${s.environment}</span>
                    </div>
                    <button class="copy-btn" onclick="copyToClipboard('\${s.value.replace(/'/g, "\\\\'")}')">Copy Value</button>
                \`;
                list.appendChild(div);
            });
        }

        function filterSecrets() {
            renderSecrets(document.getElementById('search').value);
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            const btn = event.target;
            const original = btn.innerText;
            btn.innerText = 'Copied!';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerText = original;
                btn.style.background = '#282828';
            }, 2000);
        }

        document.getElementById('unlock-btn').onclick = unlock;
        document.getElementById('password').onkeypress = (e) => { if(e.key === 'Enter') unlock(); };
    </script>
</body>
</html>`;
};
