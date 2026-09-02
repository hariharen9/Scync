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
        #vault-view { display: none; max-width: 860px; width: 94%; margin: 40px auto; }
        .header-box { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .header-box button { width: auto; padding: 6px 12px; font-size: 11px; }
        .search { margin-bottom: 20px; }
        .section-title {
            font-family: 'Syne', sans-serif;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--text-muted);
            margin: 28px 0 10px 0;
        }
        .item {
            background: var(--surface);
            border: 1px solid var(--border);
            padding: 14px 16px;
            margin-bottom: 10px;
        }
        .item h3 { margin: 0 0 4px 0; font-size: 14px; font-family: 'Syne', sans-serif; word-break: break-word; }
        .item .meta { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; word-break: break-word; }
        .actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .copy-btn {
            background: var(--border);
            color: var(--text);
            width: auto;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .copy-btn:hover { background: var(--green); color: white; opacity: 1; }
        .copy-btn.primary { background: #10b981; color: #06281d; font-weight: 700; }
        .copy-btn.primary:hover { background: #34d399; }
        .muted { color: var(--text-muted); font-size: 11px; margin: 24px 0 0 0; }
    </style>
</head>
<body>
    <div id="auth-view" class="container">
        <div class="card">
            <h1>Scync Portable</h1>
            <p>Enter master password to decrypt vault. Everything is decrypted locally in memory — nothing is uploaded.</p>
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
            <button onclick="location.reload()">Lock</button>
        </div>

        <input type="text" id="search" class="search" placeholder="Search secrets..." oninput="filterSecrets()">

        <div id="section-secrets">
            <div class="section-title">Secrets (<span id="count-secrets"></span>)</div>
            <div id="secrets-list"></div>
        </div>

        <div id="section-passwords">
            <div class="section-title">Passwords (<span id="count-passwords"></span>)</div>
            <div id="passwords-list"></div>
        </div>

        <div id="section-ssh">
            <div class="section-title">SSH Keys (<span id="count-ssh"></span>)</div>
            <div id="ssh-list"></div>
        </div>

        <div id="section-totp">
            <div class="section-title">Authenticator / TOTP (<span id="count-totp"></span>)</div>
            <div id="totp-list"></div>
        </div>

        <div id="section-certs">
            <div class="section-title">Certificates (<span id="count-certs"></span>)</div>
            <div id="certs-list"></div>
        </div>

        <p class="muted">Tip: keep this file offline. Re-import it into Scync on a new device to restore your vault.</p>
    </div>

    <script>
        var vaultData = JSON.parse(decodeURIComponent(escape(atob("${base64Data}"))));
        var uid = "${uid}";
        var vaultItems = { secrets: [], passwords: [], sshKeys: [], totpTokens: [], certificates: [] };

        function esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function fmtDate(d) {
            if (!d) return '';
            var date = new Date(d);
            if (isNaN(date.getTime())) return String(d);
            return date.toISOString().slice(0, 10);
        }

        async function deriveKey(password, uid, saltBase64) {
            var inputMaterial = password + uid;
            var encoder = new TextEncoder();
            var keyMaterial = await crypto.subtle.importKey(
                "raw",
                encoder.encode(inputMaterial),
                "PBKDF2",
                false,
                ["deriveKey"]
            );
            var salt = Uint8Array.from(atob(saltBase64), function (c) { return c.charCodeAt(0); });
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
            var iv = Uint8Array.from(atob(ivBase64), function (c) { return c.charCodeAt(0); });
            var ciphertext = Uint8Array.from(atob(ciphertextBase64), function (c) { return c.charCodeAt(0); });
            var decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        }

        async function unlock() {
            var pass = document.getElementById('password').value;
            var btn = document.getElementById('unlock-btn');
            var error = document.getElementById('error');

            btn.disabled = true;
            btn.innerText = 'Decrypting...';
            error.style.display = 'none';

            try {
                var key = await deriveKey(pass, uid, vaultData.meta.salt);

                // Verify the vault password by decrypting the verifier constant
                var verifier = await decrypt(key, vaultData.meta.verifier.iv, vaultData.meta.verifier.ciphertext);
                if (verifier !== 'Scync_VALID_v1') {
                    throw new Error('Invalid password');
                }

                var secrets = await Promise.all((vaultData.secrets || []).map(async function (s) {
                    var value = await decrypt(key, s.encValue.iv, s.encValue.ciphertext);
                    var notes = s.encNotes ? await decrypt(key, s.encNotes.iv, s.encNotes.ciphertext) : '';
                    var project = (vaultData.projects || []).find(function (p) { return p.id === s.projectId; });
                    return { name: s.name, type: s.type, environment: s.environment, service: s.service, projectName: project ? project.name : 'Unknown', value: value, notes: notes };
                }));

                var sshKeys = await Promise.all((vaultData.sshKeys || []).map(async function (k) {
                    var privateKey = k.encPrivateKey ? await decrypt(key, k.encPrivateKey.iv, k.encPrivateKey.ciphertext) : '';
                    return { name: k.name, type: k.type, fingerprint: k.fingerprint, hosts: k.hosts || [], publicKey: k.publicKey || '', privateKey: privateKey };
                }));

                var totpTokens = await Promise.all((vaultData.totpTokens || []).map(async function (t) {
                    var secret = await decrypt(key, t.encSecret.iv, t.encSecret.ciphertext);
                    return { issuer: t.issuer, label: t.label, algorithm: t.algorithm, digits: t.digits, period: t.period, secret: secret };
                }));

                var certificates = await Promise.all((vaultData.certificates || []).map(async function (c) {
                    var certPem = await decrypt(key, c.encCertPem.iv, c.encCertPem.ciphertext);
                    var keyPem = c.encKeyPem ? await decrypt(key, c.encKeyPem.iv, c.encKeyPem.ciphertext) : '';
                    return { name: c.name, subject: c.subject, issuer: c.issuer, validFrom: c.validFrom, validTo: c.validTo, certPem: certPem, keyPem: keyPem };
                }));

                var passwords = await Promise.all((vaultData.passwords || []).map(async function (p) {
                    var password = await decrypt(key, p.encPassword.iv, p.encPassword.ciphertext);
                    var notes = p.encNotes ? await decrypt(key, p.encNotes.iv, p.encNotes.ciphertext) : '';
                    return { name: p.name, username: p.username, url: p.url, category: p.category, password: password, notes: notes };
                }));

                vaultItems.secrets = secrets;
                vaultItems.passwords = passwords;
                vaultItems.sshKeys = sshKeys;
                vaultItems.totpTokens = totpTokens;
                vaultItems.certificates = certificates;

                document.getElementById('auth-view').style.display = 'none';
                document.getElementById('vault-view').style.display = 'block';
                renderAll();
            } catch (e) {
                console.error(e);
                error.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Unlock Vault';
            }
        }

        function copyField(kind, index, field) {
            var items = vaultItems[kind];
            if (!items || !items[index]) return;
            var text = items[index][field];
            if (text == null) return;
            navigator.clipboard.writeText(String(text));
            var btn = event.target;
            var original = btn.innerText;
            btn.innerText = 'Copied!';
            setTimeout(function () {
                btn.innerText = original;
            }, 2000);
        }

        function createItem(kind, index, title, metaText, buttons) {
            var div = document.createElement('div');
            div.className = 'item';
            div.innerHTML =
                '<h3>' + esc(title) + '</h3>' +
                '<div class="meta">' + esc(metaText) + '</div>';

            var acts = document.createElement('div');
            acts.className = 'actions';
            buttons.forEach(function (b) {
                var btn = document.createElement('button');
                btn.className = 'copy-btn' + (b.primary ? ' primary' : '');
                btn.innerText = b.label;
                btn.onclick = function () { copyField(kind, index, b.field); };
                acts.appendChild(btn);
            });
            div.appendChild(acts);
            return div;
        }

        function renderSecrets(filter) {
            var list = document.getElementById('secrets-list');
            list.innerHTML = '';
            var q = (filter || '').toLowerCase();
            var filtered = vaultItems.secrets
                .map(function (s, i) { return { item: s, index: i }; })
                .filter(function (e) {
                    return !q ||
                        e.item.name.toLowerCase().indexOf(q) !== -1 ||
                        (e.item.projectName || '').toLowerCase().indexOf(q) !== -1 ||
                        (e.item.service || '').toLowerCase().indexOf(q) !== -1 ||
                        (e.item.environment || '').toLowerCase().indexOf(q) !== -1;
                });

            if (filtered.length === 0) {
                list.innerHTML = '<p class="muted">No matching secrets.</p>';
                return;
            }
            filtered.forEach(function (e) {
                var s = e.item;
                var meta = [s.projectName, s.environment, s.service, s.type].filter(Boolean).join(' • ');
                var buttons = [{ field: 'value', label: 'Copy Value', primary: true }];
                if (s.notes) buttons.push({ field: 'notes', label: 'Copy Notes' });
                list.appendChild(createItem('secrets', e.index, s.name, meta, buttons));
            });
        }

        function renderPasswords() {
            var list = document.getElementById('passwords-list');
            list.innerHTML = '';
            vaultItems.passwords.forEach(function (p, i) {
                var meta = [p.username, p.url, p.category].filter(Boolean).join(' • ');
                var buttons = [];
                if (p.username) buttons.push({ field: 'username', label: 'Copy Username' });
                buttons.push({ field: 'password', label: 'Copy Password', primary: true });
                if (p.notes) buttons.push({ field: 'notes', label: 'Copy Notes' });
                list.appendChild(createItem('passwords', i, p.name, meta || '—', buttons));
            });
        }

        function renderSSH() {
            var list = document.getElementById('ssh-list');
            list.innerHTML = '';
            vaultItems.sshKeys.forEach(function (k, i) {
                var meta = [k.type, k.fingerprint, (k.hosts && k.hosts.length ? 'hosts: ' + k.hosts.join(', ') : 'no hosts')].filter(Boolean).join(' • ');
                var buttons = [{ field: 'publicKey', label: 'Copy Public Key' }];
                if (k.privateKey) buttons.push({ field: 'privateKey', label: 'Copy Private Key', primary: true });
                list.appendChild(createItem('sshKeys', i, k.name, meta, buttons));
            });
        }

        function renderTOTP() {
            var list = document.getElementById('totp-list');
            list.innerHTML = '';
            vaultItems.totpTokens.forEach(function (t, i) {
                var meta = [t.issuer || t.label, 'algorithm: ' + t.algorithm, t.digits + ' digits', t.period + 's'].filter(Boolean).join(' • ');
                list.appendChild(createItem('totpTokens', i, t.label || t.issuer || 'Authenticator', meta, [{ field: 'secret', label: 'Copy Base32 Secret', primary: true }]));
            });
        }

        function renderCerts() {
            var list = document.getElementById('certs-list');
            list.innerHTML = '';
            vaultItems.certificates.forEach(function (c, i) {
                var meta = [c.subject, 'by ' + c.issuer, 'valid until ' + fmtDate(c.validTo)].filter(Boolean).join(' • ');
                var buttons = [{ field: 'certPem', label: 'Copy Certificate', primary: true }];
                if (c.keyPem) buttons.push({ field: 'keyPem', label: 'Copy Private Key' });
                list.appendChild(createItem('certs', i, c.name, meta, buttons));
            });
        }

        function renderAll() {
            document.getElementById('count-secrets').innerText = vaultItems.secrets.length;
            document.getElementById('count-passwords').innerText = vaultItems.passwords.length;
            document.getElementById('count-ssh').innerText = vaultItems.sshKeys.length;
            document.getElementById('count-totp').innerText = vaultItems.totpTokens.length;
            document.getElementById('count-certs').innerText = vaultItems.certificates.length;

            document.getElementById('section-passwords').style.display = vaultItems.passwords.length ? '' : 'none';
            document.getElementById('section-ssh').style.display = vaultItems.sshKeys.length ? '' : 'none';
            document.getElementById('section-totp').style.display = vaultItems.totpTokens.length ? '' : 'none';
            document.getElementById('section-certs').style.display = vaultItems.certificates.length ? '' : 'none';

            renderSecrets(document.getElementById('search').value);
            renderPasswords();
            renderSSH();
            renderTOTP();
            renderCerts();
        }

        function filterSecrets() {
            renderSecrets(document.getElementById('search').value);
        }

        document.getElementById('unlock-btn').onclick = unlock;
        document.getElementById('password').onkeypress = function (e) { if (e.key === 'Enter') unlock(); };
    </script>
</body>
</html>`;
};
