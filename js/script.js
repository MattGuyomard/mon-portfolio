function initLoading() {
  const progressEl = document.getElementById('progress');
  const percentageEl = document.getElementById('percentage');
  const loadingOverlay = document.getElementById('loading-overlay');
  const canvas = document.getElementById('tv-static');
  const terminalEl = document.getElementById('terminal');
  const inputEl = document.getElementById('cmd');
  const ctx = canvas.getContext('2d');

  // Loading bar
  let width = 0;
  const duration = 2.8; // secondes
  const steps = 100;
  const intervalTime = (duration * 1000) / steps;

  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      percentageEl.textContent = "100%";

      loadingOverlay.style.opacity = '0';
      loadingOverlay.style.transition = 'opacity 0.45s ease';

      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        terminalEl.style.display = 'block';
        inputEl.focus();
      }, 450);
    } else {
      width += 1;
      progressEl.style.width = width + '%';
      percentageEl.textContent = width + '%';
    }
  }, intervalTime);

  // TV Static (optimisé un minimum)
  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let staticFrame;
  function generateStatic() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const rand = Math.random();
      const value = rand > 0.2 ? Math.floor(rand * 300) - 50 : 0;
      const clamped = Math.max(0, Math.min(255, value));
      pixels[i] = clamped;
      pixels[i + 1] = clamped;
      pixels[i + 2] = clamped;
      pixels[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    staticFrame = requestAnimationFrame(generateStatic);
  }

  generateStatic();
  window.addEventListener('beforeunload', () => cancelAnimationFrame(staticFrame));
}

document.addEventListener('DOMContentLoaded', initLoading);

// ================= Terminal Logic =================

const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const terminal = document.getElementById('terminal');

const commands = {
  help:
`Commandes disponibles:
about     - À propos de moi
projects  - Affiche mes réalisations
skills    - Compétences clés
contact   - Mes coordonnées
clear     - Efface l'écran
help      - Affiche cette aide
cat       - Affiche un chat..`,

  about: `
<h2>Profil</h2>
<p><strong>Matthis GUYOMARD</strong> — <strong>Administrateur Systèmes, Réseaux & Cybersécurité (Junior)</strong><br>
21 ans — Chatou (78400), France</p>

<h2>Disponibilité</h2>
<p><strong>Stage :</strong> du <strong>1 juin</strong> au <strong>23 octobre 2026</strong></p>

<h2>Parcours</h2>
<p>
• <strong>IPSSI</strong> — Bachelor Informatique (2e année) — Depuis janvier 2025<br>
• <strong>42</strong> — Développement C / Shell / GitHub — Juin 2024 → Septembre 2024<br>
• Bac Général — Mention AB (NSI 20/20) — 2020 → 2022
</p>

<h2>Expériences</h2>
<p>
• <strong>Vinci Construction Grands Projets</strong> — Administrateur Systèmes & Réseaux (Stagiaire) — Août 2025 → Octobre 2025<br>
&nbsp;&nbsp;→ Dev outils CMDB, automatisation supervision/inventaire, documentation infra & flux (Windows/Linux/virt/cyber)<br>
• <strong>Bitskins</strong> — Développeur Python (Freelance) — Janvier 2024 → Février 2024<br>
&nbsp;&nbsp;→ Automatisation Python + exploitation d’API, analyse temps réel<br>
• <strong>Carrefour</strong> — Driver — Novembre 2022 → Août 2025
</p>
`,

  skills: `
<h2>Compétences clés</h2>
<p>
<strong>Réseau & sécurité :</strong> CCNA1/2, DHCP, VLAN/VPN, DNS/NAT, SSL/TLS, Reverse Proxy, OSINT, XSS/SQLi, CVE/CVSS<br>
<strong>Systèmes & virtualisation :</strong> Windows Server 2019/2022, Debian/Ubuntu, AD/GPO, VMware, VirtualBox, Hyper-V<br>
<strong>Outils :</strong> Nmap, Hydra, Gobuster, FFUF<br>
<strong>Dev :</strong> Python (avancé), C (avancé), HTML/CSS (avancé), PHP/JS/C# (bon niveau), API REST, client/serveur<br>
<strong>Web/BDD :</strong> Apache2, Nginx, MySQL/MariaDB<br>
<strong>Méthodes :</strong> Agile (avancé), UML, gestion de projet
</p>

<h2>Certifications</h2>
<p>TryHackMe (2025 → 2028) : Jr Penetration Tester, Cyber Security 101, Web Fundamentals, Pre Security</p>
`,

  projects: `
<h2>Mes projets</h2>
<div class="projects-grid">

  <div class="project-card">
    <h3>Refonte sécurisée & modernisation d’infrastructure — DataNova</h3>
    <p>
✓ Maquette complète sur <strong>Proxmox VE</strong> (VM/LXC), avec <strong>RBAC</strong>, accès admin durci (HTTPS only, MFA, restrictions IP/VPN) et <strong>HA cluster</strong>.<br>
✓ Cloisonnement réseau : <strong>Admin / Infra / Prod / DMZ</strong>, filtrage inter-zones, comparaison <strong>Linux natif (nftables)</strong> vs solution type <strong>OPNsense/pfSense</strong> (justifications).<br>
✓ Extension hybride <strong>AWS</strong> : VPN site-à-site, choix services (EC2/RDS/S3/WAF/Auto Scaling) et environnement de test.<br>
✓ Deux refontes : <strong>Microsoft (AD hardening + redondance)</strong> et <strong>Linux/Open Source</strong> (annuaire, DNS, DHCP, updates centralisées).<br>
✓ Bastion / jump host, templates Linux sécurisés (ANSSI/CIS), automatisations (CSV → annuaire, backups DB, déploiement web conteneurs), centralisation logs & conformité.
    </p>
  </div>

  <div class="project-card">
    <h3>API REST Rogue-Lite — Node.js / Express</h3>
    <p>
✓ Conception d’une <strong>API REST</strong> pour un jeu rogue-lite tour par tour (toutes actions via HTTP).<br>
✓ Ressources : User/Auth, Player, Game, Room, Monster (+ Items).<br>
✓ <strong>JWT + rôles</strong> (admin/player), endpoints admin sécurisés (ajout monstres/objets).<br>
✓ Front web minimal (fetch) + documentation <strong>README</strong> + bonus possible : Docker (API + front) + Nginx reverse proxy.
    </p>
  </div>

  <div class="project-card">
    <h3>Outil d’automatisation & d’analyse du marché Bitskins</h3>
    <p>
✓ Développement d’un logiciel exploitant l’API Bitskins pour automatiser des opérations et analyser des tendances en temps réel.<br>
✓ Adaptation et supervision de la traduction FR du site.
    </p>
  </div>

  <div class="project-card">
    <h3>Site de réservation — Hôtel Ezdan Palace</h3>
    <p>
✓ Site vitrine + gestion des réservations (HTML/CSS/PHP/JS) connecté à une base <strong>MySQL</strong>.<br>
✓ Interface responsive : consultation des chambres et enregistrement des réservations.
    </p>
  </div>

  <div class="project-card">
    <h3>Tests switching & routage Cisco</h3>
    <p>
✓ Configurations et tests : LACP, VTP, DTP, STP, DHCP, RIP, OSPF.<br>
✓ Optimisation trafic, stabilité LAN/inter-réseaux.
    </p>
  </div>

  <div class="project-card">
    <h3>Infrastructure sécurisée & centralisée (AD / VLAN / DMZ)</h3>
    <p>
✓ Segmentation VLAN, plages IP dédiées (infra/users/serveurs/DMZ).<br>
✓ Déploiement AD (users/groupes/GPO), partages sécurisés (NTFS).<br>
✓ Pare-feu, cloisonnement inter-VLAN, reverse proxy <strong>NGINX</strong> en DMZ, web HTTPS + PKI interne.
    </p>
  </div>

</div>
`,

  contact: `
<h2>Contact</h2>
<p>
<strong>Email :</strong> <a href="mailto:matthis.guyomard@hotmail.com">matthis.guyomard@hotmail.com</a><br>
<strong>Téléphone :</strong> <a href="tel:+33652217407">06 52 21 74 07</a><br>
<strong>Localisation :</strong> Chatou (78400), France<br>
<strong>LinkedIn :</strong> <a href="https://www.linkedin.com/in/matthis-guyomard/" target="_blank" rel="noopener noreferrer">
linkedin.com/in/matthis-guyomard
</a><br><br>
<a href="ressources/guyomard-matthis-cv.pdf" download="guyomard-matthis-cv.pdf">Télécharger mon CV</a>
</p>
`,

  cat: `
                _                       
                \`*-.                   
                 )  _\`-.                
                .  : \`. .               
                : _   '  \\              
                ; *\` _.   \`*-._         
                \`-.-'          \`-.      
                  ;       \`       \`.    
                  :.       .        \\   
                  . \\  .   :   .-'   .  
                  '  \`+.;  ;  '      :  
                  :  '  |    ;       ;-. 
                  ; '   : :\`-:     _.\`* ;
               .*' /  .*' ; .\`*- +'  \`*'
               \`*-*   \`*-*  \`*-*'       
`,

  clear: () => { output.innerHTML = ''; return ''; }
};

function escapeHtml(s) {
  return s.replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;');
}

function printOutput(text) {
  if (text == null) return;

  // Si ça ressemble à du HTML, on l'injecte tel quel (tes cartes projets, h2, etc.)
  const looksLikeHtml = typeof text === 'string' && /<\/?[a-z][\s\S]*>/i.test(text);

  if (looksLikeHtml) {
    output.innerHTML += `<div class="line">${text}</div>`;
  } else {
    const safe = escapeHtml(String(text)).replace(/\n/g, '<br>');
    output.innerHTML += `<div class="line">${safe}</div>`;
  }

  // ✅ scroll dans le terminal (pas la fenêtre)
  terminal.scrollTop = terminal.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
  cmdInput.focus();
  document.addEventListener('click', (e) => {
    if (e.target !== cmdInput) cmdInput.focus();
  });
});

function playKeyNoise() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = Math.floor(audioCtx.sampleRate * 0.02);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

  noise.connect(gainNode).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.02);
  noise.onended = () => audioCtx.close();
}

let history = [];
let historyIndex = -1;

cmdInput.addEventListener('keydown', (e) => {
  if (e.key.length === 1 || ['Backspace', 'Enter', 'Tab', 'Delete'].includes(e.key)) {
    playKeyNoise();
  }

  if (e.key === 'Enter') {
    const input = cmdInput.value.trim();
    if (input) history.push(input);
    historyIndex = history.length;

    printOutput(`&gt; ${escapeHtml(input)}`);

    let response;
    if (commands[input]) {
      response = (typeof commands[input] === 'function') ? commands[input]() : commands[input];
    } else {
      response = `'${input}' n'est pas reconnu. Tape 'help' pour l'aide.`;
    }

    printOutput(response);
    cmdInput.value = '';
  }

  if (e.key === 'ArrowUp') {
    if (historyIndex > 0) {
      historyIndex--;
      cmdInput.value = history[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      cmdInput.value = history[historyIndex];
    } else {
      cmdInput.value = '';
    }
  }
});
