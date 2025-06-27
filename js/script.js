function initLoading() {
  const progress = document.getElementById('progress');
  const percentage = document.getElementById('percentage');
  const loadingOverlay = document.getElementById('loading-overlay');
  const canvas = document.getElementById('tv-static');
  const terminal = document.getElementById('terminal');
  const cmdInput = document.getElementById('cmd');
  const ctx = canvas.getContext('2d');

  let width = 0;
  const duration = 3; // en secondes
  const steps = 100;
  const intervalTime = (duration * 1000) / steps;

  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      percentage.textContent = "100%";

      loadingOverlay.style.opacity = '0';
      loadingOverlay.style.transition = 'opacity 0.5s ease';

      setTimeout(() => {
        loadingOverlay.style.display = 'none';

        // ✅ Affiche le terminal après chargement
        terminal.style.display = 'block';
        cmdInput.focus();

      }, 500);
    } else {
      width += 1;
      progress.style.width = width + '%';
      percentage.textContent = width + '%';
    }
  }, intervalTime);

  // 🎞️ TV Static
  let staticFrame;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function generateStatic() {
    resizeCanvas();
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

  window.addEventListener('resize', resizeCanvas);
  generateStatic();

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(staticFrame);
  });
}

document.addEventListener('DOMContentLoaded', initLoading);

// ================= Terminal Logic =================

const output = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const terminal = document.getElementById('terminal');

const commands = {
    help: 'Commandes disponibles:\nabout - À propos de moi\nprojects - Affiche mes réalisations\ncontact - Affiche mes contacts\nclear - Efface l\'écran\nhelp - Affiche cette aide\ncat - Affiche un chat..',
    about: `
    <h2>Présentation</h2><p>Développeur & futur expert en cybersécurité
    Passionné par l'informatique depuis l'adolescence, à seulement 20 ans, j'ai forgé mon expertise à travers des défis techniques exigeants : réussite de la sélection intensive de l'école 42 (1 mois en C/Linux), puis spécialisation en cybersécurité à l'IPSSI.
    Mon approche allie autonomie d'apprentissage et rigueur académique pour concevoir des solutions à la fois performantes et sécurisées.</p>

    <h2>Expertise technique</h2><p>▸ Développement full-stack
    &nbsp;&nbsp;├─ Applications robustes en <strong>C/C#</strong>
    &nbsp;&nbsp;├─ Scripting & automatisation en <strong>Python</strong>
    &nbsp;&nbsp;└─ Interfaces dynamiques (<strong>HTML5/CSS3/JS/PHP</strong>)</p>
    <p>▸ Réseau & cybersécurité
    &nbsp;&nbsp;├─ <strong>Cisco CCNA1/2</strong> - Déploiement <strong>DHCP</strong>
    &nbsp;&nbsp;├─ Virtualisation <strong>VMware</strong>
    &nbsp;&nbsp;└─ Conformité <strong>RGPD</strong> & architectures sécurisées</p>
    <p>▸ Bases de données
    &nbsp;&nbsp;└─ Modélisation et optimisation <strong>MySQL/UML</strong></p>

    <h2>Parcours</h2><p>
✓ Piscine réussie à l'école 42 (méthode peer-to-peer intensive)
✓ Étudiant en cybersécurité à l'IPSSI
✓ Développeur indépendant avec plusieurs réalisations concrètes</p>
    `,
    projects: `
        <h2>Mes Projets</h2>
        <div class="projects-grid">
            <div class="project-card">
                <h3>Outil d'automatisation & d’analyse du marché Bitskin</h3>
                <p>
                ✓ Développement d’un logiciel utilisant l’API de Bitskin afin d’automatiser les opérations commerciales et 
                   d’analyser les tendances du marché en temps réel.
                ✓ Responsable de la supervision et de l’adaptation de la traduction du site Bitskin en version française.</p>
            </div>
            <div class="project-card">
                <h3>Site web de réservation pour l’hôtel Ezdan Palace</h3>
                <p>
                ✓ Développement d’un site vitrine avec système de gestion des réservations pour l’hôtel Ezdan Palace, conçu en HTML,
                   CSS, PHP et JavaScript, et connecté à une base de données MySQL.
                ✓ Mise en place d’une interface utilisateur responsive permettant la consultation des
                   chambres disponibles et l’enregistrement des réservations en ligne.</p>
            </div>
            <div class="project-card">
                <h3>Tests de switching et routage sur Cisco</h3>
                <p>
                ✓ Réalisation de tests pratiques de configuration de commutateurs et routeurs Cisco en utilisant les
                   protocoles LACP, VTP, DTP, STP, DHCP, RIP et OSPF.
                ✓ Acquisition d’une expérience concrète dans la gestion des réseaux locaux et interréseaux, avec un focus sur
                   la stabilité et l’optimisation du trafic.</p>
            </div>
            <div class="project-card">
                <h3>Mise en place d’une infrastructure informatique sécurisée et centralisée</h3>
                <p>
                    ✓ Conception de l’architecture réseau avec segmentation en VLANs et plages IP dédiées pour
                       l’infrastructure, les utilisateurs, les serveurs et la DMZ.
                    ✓ Déploiement d’un Active Directory complet avec gestion des utilisateurs, groupes,
                       stratégies de sécurité (GPO) et profils itinérants.
                    ✓ Configuration de partages réseau sécurisés avec droits NTFS adaptés.
                    ✓ Cloisonnement réseau et gestion des pare-feu avec OPNsense pour isoler les VLANs.
                    ✓ Hébergement d’un service Web en HTTPS avec certificats PKI internes et déploiement d’un reverse proxy NGINX en DMZ.</p>
            </div>
        </div>
    `,
    contact: `
    <p>
    Numéro de téléphone : +33652217407
    Adresse e-mail : matthis.guyomard@hotmail.com
    Linkedin : <a href="https://www.linkedin.com/in/matthis-guyomard/">https://www.linkedin.com/in/matthis-guyomard/</a>
    <a href="ressources/guyomard-matthis-cv.pdf" download="guyomard-matthis-cv.pdf">Télécharger mon CV</a></p>`,

    cat: `
                _                       
                \\\`*-.                   
                 )  _\\\`-.                
                .  : \\\`. .               
                : _   '  \\\\              
                ; *\\\` _.   \\\`*-._         
                \\\`-.-'          \\\`-.      
                  ;       \\\`       \\\`.    
                  :.       .        \\\\   
                  . \\\\  .   :   .-'   .  
                  '  \\\`+.;  ;  '      :  
                  :  '  |    ;       ;-. 
                  ; '   : :\\\`-:     _.\\\`* ;
               .*' /  .*' ; .\\\`*- +'  \\\`*'
               \\\`*-*   \\\`*-*  \\\`*-*'       
        `,

    clear: () => { output.innerHTML = ''; return ''; }
};

function printOutput(text) {
  if (typeof text === 'string') {
    output.innerHTML += `<div class="line">${text.replace(/\n/g, '<br>')}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input');
  input.focus();

  document.addEventListener('click', (e) => {
    if (e.target !== input) input.focus();
  });
});

function playKeyNoise() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = audioCtx.sampleRate * 0.02;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }

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
    if (
    e.key.length === 1 ||
    ['Backspace', 'Enter', 'Tab', 'Delete'].includes(e.key)
  ) {
    playKeyNoise();
  }

  if (e.key === 'Enter') {
    const input = cmdInput.value.trim();
    if (input) history.push(input);
    historyIndex = history.length;
    printOutput(`> ${input}`);
    let response = '';

    if (commands[input]) {
      response = typeof commands[input] === 'function' ? commands[input]() : commands[input];
    } else {
      response = `'${input}' n'est pas reconnu. Tape 'help' pour l'aide.`;
    }

    printOutput(response);
    cmdInput.value = '';
    window.scrollTo(0, document.body.scrollHeight);
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
