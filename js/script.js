(() => {
 const $ = id => document.getElementById(id);
 const canvas = $('game'), ctx = canvas.getContext('2d');
 const world = {w:1280,h:780};
 const player = {x:640,y:700,r:16,speed:245,facing:'up'};
 const keys = new Set();
 const visited = new Set();
 const unlocked = new Set();
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
 let nearNode = null, running = false, lang = 'fr', visitorCount = 0, playerName = 'PLAYER_----';
 const fxParticles=[];
 function burstFx(x,y,color='#ffd84b',count=16){if(reducedMotion)return;for(let i=0;i<count;i++){const a=Math.PI*2*i/count+(Math.random()-.5)*.35,sp=55+Math.random()*95;fxParticles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-28,life:.7+Math.random()*.45,max:1.15,color,size:2+Math.random()*3})}}
 function drawFx(dt){for(let i=fxParticles.length-1;i>=0;i--){const p=fxParticles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=115*dt;if(p.life<=0){fxParticles.splice(i,1);continue}ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate((1-p.life)*5);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore()}}
 let xp = 0, level = 1, soundOn = true, volume = 0.48, audioCtx = null, masterGain = null, toastTimer = null;
 let cinematicIndex=0, cinematicSeen=false, nearNpc=null, nearPortal=null, nearTerminal=false, ambience=null, musicTimer=null, musicStep=0, musicNextTime=0, npcSpeech=null, endShown=false, lastSave=0, currentWorld=0, worldBannerTimer=null;
 const collected = new Set();
 const SAVE_KEY='matthis-career-quest-v5';
 const terminalStation={x:700,y:620,label:'ARCADE TERMINAL'};
 const collectibles=[
  {id:'c1',x:120,y:280},{id:'c2',x:310,y:160},{id:'c3',x:390,y:300},{id:'c4',x:900,y:150},
  {id:'c5',x:1160,y:285},{id:'c6',x:100,y:620},{id:'c7',x:260,y:430},{id:'c8',x:395,y:680},
  {id:'c9',x:885,y:620},{id:'c10',x:1040,y:400},{id:'c11',x:1180,y:670},{id:'c12',x:675,y:540}
 ];

 const i18n = {
  fr:{
   startDesc:"Explore mon parcours comme un mini-jeu : découvre mes expériences, compétences et projets en parcourant la carte. Joue librement ou passe directement en mode recruteur.",
   visitorLoading:'Connexion au serveur visiteurs...',play:'▶ Lancer la partie',recruiter:'Mode recruteur',hint:'PC : ZQSD / WASD / flèches · E / Entrée : interagir · T : terminal · Échap : fermer',
   connected:'● ONLINE',offline:'● OFFLINE',visitors:'VISITEURS',player:'JOUEUR',lvl:'NIV',zones:'ZONES',mission:'Journal de mission',missionSub:'Explore la career map',mini:'Mini-map',miniSub:'Position en temps réel',visitGlobal:'visite globale',achievements:'succès',achTitle:'Succès',achSub:'Débloque-les en explorant',
   controls:'<b>Contrôles</b><br>ZQSD / WASD / flèches : déplacement<br>E / Entrée : interagir / fermer<br>T : terminal secret<br>Échap : fermer une fenêtre',open:'OUVRIR',questUpdated:'MISSION MISE À JOUR',zonesDiscovered:'zones découvertes',complete:'CAREER MAP TERMINÉE ✓',completeSub:'Portfolio exploré à 100 %',missionStarted:'MISSION LANCÉE',missionStartedSub:'Explore les balises lumineuses.',achievementUnlocked:'SUCCÈS DÉBLOQUÉ',returnGame:'← RETOUR AU JEU',rMode:'MODE RECRUTEUR · ACCÈS RAPIDE',
   rLead:"Profil orienté Software Engineering, Infrastructure et Cybersécurité, avec une forte appétence pour l'automatisation. Après des expériences chez Vinci Construction Grands Projets et Axens, je rejoins AXA en septembre 2026 comme Software Engineer Analyst Apprentice.",
   terminalHello:"MATTHIS.EXE terminal arcade deluxe\nTape 'help' pour afficher les commandes disponibles.\n",
   help:'Commandes : help · whoami · skills · experience · education · contact · coffee · 42 · sudo hire matthis · clear · exit',whoami:'Matthis Guyomard : Software Engineering / Infrastructure / Cybersecurity / Automation.',contact:'Email: matthis.guyomard@hotmail.com\nLinkedIn: linkedin.com/in/matthis-guyomard/',unknown:'Commande inconnue. Tape help.',
   playerPrefix:'JOUEUR', sound:'SON', recruiterBtn:'MODE RECRUTEUR', terminalBtn:'⌘ TERMINAL', objective:'OBJECTIF ACTUEL', objectiveTitle:'Explorer la Career Map', objectiveSub:'Interagis avec les balises ou parle au guide.', collectLabel:'collectibles', terminalWorld:'UTILISER LE TERMINAL', allCollect:'CHASSE AU TRÉSOR TERMINÉE', allCollectSub:'Tu as trouvé les 12 collectibles !', cv:'CV', endKicker:'CAREER QUEST TERMINÉE', endTitle:'100 % exploré !', endText:'Tu as découvert tout mon parcours. Merci d’avoir joué.', continueExplore:'Continuer à explorer', seeCv:'📄 Voir le CV', contactMe:'✉ Me contacter'
  },
  en:{
   startDesc:'Explore my career as a mini-game: move around the map, visit terminals, earn XP and unlock achievements.',
   visitorLoading:'Connecting to visitor server...',play:'▶ Start game',recruiter:'Recruiter mode',hint:'PC: WASD / arrows · E / Enter: interact · T: terminal · Escape: close',
   connected:'● ONLINE',offline:'● OFFLINE',visitors:'VISITORS',player:'PLAYER',lvl:'LVL',zones:'ZONES',mission:'Mission log',missionSub:'Explore the career map',mini:'Mini-map',miniSub:'Real-time position',visitGlobal:'global visit',achievements:'achievements',achTitle:'Achievements',achSub:'Unlock them while exploring',
   controls:'<b>Controls</b><br>WASD / arrows : move<br>E / Enter : interact / close<br>T : secret terminal<br>Escape : close window',open:'OPEN',questUpdated:'QUEST UPDATED',zonesDiscovered:'zones discovered',complete:'CAREER MAP COMPLETE ✓',completeSub:'Portfolio explored at 100%',missionStarted:'MISSION STARTED',missionStartedSub:'Explore the glowing beacons.',achievementUnlocked:'ACHIEVEMENT UNLOCKED',returnGame:'← RETURN TO GAME',rMode:'RECRUITER MODE · FAST ACCESS',
   rLead:'Profile focused on Software Engineering, Infrastructure and Cybersecurity, with a strong interest in automation. After experiences at Vinci Construction Grands Projets and Axens, I join AXA in September 2026 as a Software Engineer Analyst Apprentice.',
   terminalHello:"MATTHIS.EXE terminal arcade deluxe\nType 'help' to display available commands.\n",help:'Commands: help · whoami · skills · experience · education · contact · coffee · 42 · sudo hire matthis · clear · exit',whoami:'Matthis Guyomard : Software Engineering / Infrastructure / Cybersecurity / Automation.',contact:'Email: matthis.guyomard@hotmail.com\nLinkedIn: linkedin.com/in/matthis-guyomard/',unknown:'Unknown command. Type help.',
   playerPrefix:'PLAYER', sound:'SOUND', recruiterBtn:'RECRUITER MODE', terminalBtn:'⌘ TERMINAL', objective:'CURRENT OBJECTIVE', objectiveTitle:'Explore the Career Map', objectiveSub:'Interact with beacons or talk to the guide.', collectLabel:'collectibles', terminalWorld:'USE TERMINAL', allCollect:'TREASURE HUNT COMPLETE', allCollectSub:'You found all 12 collectibles!', cv:'CV', endKicker:'CAREER QUEST COMPLETE', endTitle:'100% explored!', endText:'You discovered my full journey. Thanks for playing.', continueExplore:'Keep exploring', seeCv:'📄 View CV', contactMe:'✉ Contact me'
  }
 };

 const content = {
  fr:{
   axa:{title:'AXA | Software Engineer Analyst Apprentice',label:'PROCHAINE QUÊTE · AXA GROUP OPERATIONS',sub:'Septembre 2026 · Juin 2027',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>Chapitre à venir</b><p>À partir de <strong>septembre 2026</strong>, je rejoins AXA Group Operations, au sein de <strong>Group Data and AI Innovation</strong>, dans l’équipe <strong>Software Engineering</strong>, en tant que <strong>Software Engineer Analyst Apprentice</strong>.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>La mission</b><p>Contribuer à la maturité de l’ingénierie logicielle en évaluant et améliorant les outils de qualité, de sécurité et de documentation. Une partie importante de la mission porte sur les pratiques <strong>SAST, SCA et DAST</strong> ainsi que sur l’approche <strong>DevSecOps</strong>.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>Le défi</b><p>Participer à une implémentation de référence fondée sur des outils Open Source pour vérifier la qualité, la sécurité et la documentation à différents stades du cycle de vie logiciel, tout en contribuant aux bonnes pratiques, à la documentation et aux usages autour des agents IA.</p></div></div><div class="story-note"><strong>Ce qui m’attire le plus :</strong> approfondir la sécurité applicative, notamment SAST, SCA, DAST, et progresser sur des problématiques DevSecOps au sein d’un environnement international.</div></div><div class="info-row stack"><b>Environnement annoncé</b><div class="tags"><span class="tag">Software Engineering</span><span class="tag">DevSecOps</span><span class="tag">SAST / SCA / DAST</span><span class="tag">Open Source</span><span class="tag">GitHub</span><span class="tag">Python / Node.js</span><span class="tag">Documentation</span><span class="tag">AI Agents</span></div></div></div>`},
   axens:{title:'Axens | Infrastructure & Cybersecurity Intern',label:'CHAPITRE 2 · AXENS',sub:'Juin 2026 · Août 2026',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>Le contexte</b><p>Une expérience mêlant infrastructure et cybersécurité : audits SonarQube sur <strong>9 applications métier</strong>, analyse d’événements de sécurité et participation à l’administration d’un environnement d’environ <strong>300 serveurs Windows</strong> et <strong>2 500 postes</strong>.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>Le projet qui m’a le plus marqué</b><p>J’ai conçu un <strong>dashboard Power BI de A à Z</strong> pour repérer les machines absentes d’un outil, les incohérences d’inventaire, les agents manquants et les équipements non conformes.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>L’automatisation mensuelle</b><p>Chaque mois, Tanium et SentinelOne produisaient leurs exports, tandis que les données Active Directory étaient générées via un script. Les fichiers arrivaient sur une boîte mail dédiée, puis <strong>Power Automate</strong> détectait les messages, récupérait les données, mettait à jour les fichiers nécessaires et déclenchait le rafraîchissement de Power BI.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">4</span><div class="beat-copy"><b>Le résultat</b><p>J’ai pu suivre le projet depuis la définition du besoin jusqu’au résultat final. Le retour de l’équipe a été très positif et elle m’a proposé de revenir l’année suivante pour poursuivre en alternance.</p></div></div></div><div class="info-row stack"><b>Stack</b><div class="tags"><span class="tag">Power BI</span><span class="tag">Power Automate</span><span class="tag">Active Directory</span><span class="tag">Tanium</span><span class="tag">SentinelOne</span><span class="tag">SonarQube</span><span class="tag">Sekoia</span><span class="tag">Varonis</span></div></div></div>`},
   vinci:{title:'Vinci Construction Grands Projets',label:'CHAPITRE 1 · VINCI',sub:'Août 2025 · Octobre 2025',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>Le problème</b><p>La rédaction d'une fiche serveur demandait de naviguer dans Tanium puis de <strong>recopier les informations une par une</strong>. Le processus était long, répétitif et pouvait entraîner des erreurs de transcription.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>Ma solution</b><p>J'ai développé une application Python connectée à l'API Tanium. L'utilisateur saisissait le nom de la machine, ou seulement son début grâce à <strong>l'auto-complétion</strong>. L'application proposait alors les serveurs correspondants puis générait automatiquement la fiche.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>Le résultat</b><p>La génération est passée de <strong>plusieurs minutes à quelques secondes</strong>, avec quatre formats disponibles : <strong>PDF, HTML, JSON et XLSX</strong>. La récupération directe des données depuis Tanium réduisait fortement le risque d'erreur de saisie manuelle, tout en restant dépendante de la qualité des données présentes dans Tanium.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">4</span><div class="beat-copy"><b>La transmission</b><p>L'application a été remise à l'équipe à la fin de mon stage. Elle était fonctionnelle et devait ensuite passer par leur revue interne avant de poursuivre son utilisation pour la documentation des serveurs.</p></div></div></div><div class="info-row stack"><b>Stack</b><div class="tags"><span class="tag">Python</span><span class="tag">API Tanium</span><span class="tag">requests</span><span class="tag">openpyxl</span><span class="tag">JSON</span><span class="tag">PDF / HTML</span><span class="tag">Auto-complétion</span><span class="tag">CMDB</span></div></div></div>`},
   skills:{title:'Arbre de compétences',label:'SKILL TREE',sub:'Cyber · Systèmes · Automation',body:`<p><strong>Cybersécurité</strong><br>SonarQube · SentinelOne · Tanium · Sekoia · Varonis · Wireshark · Nmap</p><p><strong>Systèmes & Réseaux</strong><br>Windows Server · Active Directory · Linux · Hyper-V · Proxmox VE · TCP/IP · VLAN · DNS · DHCP · OPNsense</p><p><strong>Automatisation</strong><br>Python · PowerShell · Ansible · Power BI</p>`},
   training:{title:'Formation & Certifications',label:'TRAINING ZONE',sub:'Efrei · IPSSI · 42',body:`<p><strong>Efrei</strong> : Bachelor Cybersécurité & Ethical Hacking, depuis 2026.</p><p><strong>IPSSI</strong> : Bachelor Administration Systèmes, Réseaux & Cybersécurité, depuis 2024.</p><p><strong>Piscine 42</strong> : sélection réussie : programme intensif de 4 semaines en C, algorithmique et environnement Linux.</p><div class="tags"><span class="tag">C</span><span class="tag">Linux</span><span class="tag">Algorithmique</span></div>`},
   thm:{title:'TryHackMe',label:'QUÊTE SECONDAIRE · TRYHACKME',sub:'67 178 points',body:`<div class="big-stat">67 178 pts</div><p>Progression continue en cybersécurité via TryHackMe.</p><p><strong>Certifications :</strong> Jr Penetration Tester · Cyber Security 101 · Web Fundamentals · Pre Security.</p>`},
   contact:{title:'Contact / Réseau',label:'SAFE ZONE · CONTACT',sub:'Open to connect',body:`<p>Une question, un projet ou simplement envie de parler tech ?</p><p><strong>Paris / Île-de-France</strong><br>Français natif · Anglais professionnel, niveau estimé B2/C1 non certifié</p><div class="r-links"><a class="btn primary" href="mailto:matthis.guyomard@hotmail.com">Envoyer un email</a><a class="btn" href="https://www.linkedin.com/in/matthis-guyomard/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>`}
  },
  en:{
   axa:{title:'AXA | Software Engineer Analyst Apprentice',label:'NEXT QUEST · AXA GROUP OPERATIONS',sub:'September 2026 · June 2027',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>Upcoming chapter</b><p>From <strong>September 2026</strong>, I join AXA Group Operations within <strong>Group Data and AI Innovation</strong>, specifically the <strong>Software Engineering</strong> team, as a <strong>Software Engineer Analyst Apprentice</strong>.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>The mission</b><p>Contribute to software-engineering maturity by assessing and improving quality, security and documentation tooling. A major part of the role focuses on <strong>SAST, SCA and DAST</strong> practices together with a <strong>DevSecOps</strong> approach.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>The challenge</b><p>Help build a reference implementation based on Open Source tools to check quality, security and documentation across different stages of the software lifecycle, while contributing to engineering practices, documentation and work around AI agents.</p></div></div><div class="story-note"><strong>What interests me most:</strong> going deeper into application security, especially SAST, SCA and DAST, while developing DevSecOps skills in an international environment.</div></div><div class="info-row stack"><b>Planned environment</b><div class="tags"><span class="tag">Software Engineering</span><span class="tag">DevSecOps</span><span class="tag">SAST / SCA / DAST</span><span class="tag">Open Source</span><span class="tag">GitHub</span><span class="tag">Python / Node.js</span><span class="tag">Documentation</span><span class="tag">AI Agents</span></div></div></div>`},
   axens:{title:'Axens | Infrastructure & Cybersecurity Intern',label:'CHAPTER 2 · AXENS',sub:'June 2026 · August 2026',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>The context</b><p>An experience combining infrastructure and cybersecurity: SonarQube audits across <strong>9 business applications</strong>, security-event analysis, and participation in an environment of roughly <strong>300 Windows servers</strong> and <strong>2,500 workstations</strong>.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>The project I enjoyed most</b><p>I designed a <strong>Power BI dashboard end to end</strong> to identify machines missing from a tool, inventory inconsistencies, missing agents and non-compliant devices.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>Monthly automation</b><p>Each month, Tanium and SentinelOne produced exports while Active Directory data was generated through a script. The files arrived in a dedicated mailbox, then <strong>Power Automate</strong> detected the emails, downloaded the data, updated the required files and triggered the Power BI refresh.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">4</span><div class="beat-copy"><b>The result</b><p>I followed the project from requirements definition to the final result. The team feedback was very positive, and I was invited to return the following year to continue as an apprentice.</p></div></div></div><div class="info-row stack"><b>Stack</b><div class="tags"><span class="tag">Power BI</span><span class="tag">Power Automate</span><span class="tag">Active Directory</span><span class="tag">Tanium</span><span class="tag">SentinelOne</span><span class="tag">SonarQube</span><span class="tag">Sekoia</span><span class="tag">Varonis</span></div></div></div>`},
   vinci:{title:'Vinci Construction Grands Projets',label:'CHAPTER 1 · VINCI',sub:'Aug 2025 → Oct 2025',body:`<div class="quest-block"><div class="info-row"><div class="narrative-beat"><span class="beat-icon">1</span><div class="beat-copy"><b>The problem</b><p>Creating a server sheet meant browsing Tanium and <strong>copying each piece of information manually</strong>. The process was long, repetitive and could introduce human error.</p></div></div></div><div class="info-row impact"><div class="narrative-beat"><span class="beat-icon">2</span><div class="beat-copy"><b>My solution</b><p>I developed a Python application connected to the Tanium API. Entering the machine name : or just its beginning thanks to <strong>autocomplete</strong> : is enough to retrieve the data and generate the server sheet automatically.</p></div></div></div><div class="info-row"><div class="narrative-beat"><span class="beat-icon">3</span><div class="beat-copy"><b>The result</b><p>Generation dropped from <strong>several minutes to a few seconds</strong>, with outputs available in <strong>PDF, HTML, JSON and XLSX</strong>. Because the information comes directly from Tanium, manual transcription : and its associated error risk : is removed.</p></div></div></div><div class="info-row stack"><b>Stack</b><div class="tags"><span class="tag">Python</span><span class="tag">Tanium API</span><span class="tag">Autocomplete</span><span class="tag">PDF</span><span class="tag">HTML</span><span class="tag">JSON</span><span class="tag">XLSX</span><span class="tag">CMDB</span></div></div></div>`},
   skills:{title:'Skill Tree',label:'SKILL TREE',sub:'Cyber · Systems · Automation',body:`<p><strong>Cybersecurity</strong><br>SonarQube · SentinelOne · Tanium · Sekoia · Varonis · Wireshark · Nmap</p><p><strong>Systems & Networks</strong><br>Windows Server · Active Directory · Linux · Hyper-V · Proxmox VE · TCP/IP · VLAN · DNS · DHCP · OPNsense</p><p><strong>Automation</strong><br>Python · PowerShell · Ansible · Power BI</p>`},
   training:{title:'Education & Certifications',label:'TRAINING ZONE',sub:'Efrei · IPSSI · 42',body:`<p><strong>Efrei</strong> : Bachelor's in Cybersecurity & Ethical Hacking, since 2026.</p><p><strong>IPSSI</strong> : Systems, Networks & Cybersecurity Administration curriculum, from 2024 to October 2026. This year is not degree-awarding.</p><p><strong>42</strong> : passed the Piscine and then joined the school. I later chose to redirect my academic path toward a program that better matched my expectations. The Piscine especially stood out for its intensity, autonomy and teamwork.</p><div class="tags"><span class="tag">C</span><span class="tag">Linux</span><span class="tag">Algorithms</span></div>`},
   thm:{title:'TryHackMe',label:'SIDE QUEST · TRYHACKME',sub:'67,178 points',body:`<div class="big-stat">67,178 pts</div><p>Continuous cybersecurity practice through TryHackMe.</p><p><strong>Certificates:</strong> Jr Penetration Tester · Cyber Security 101 · Web Fundamentals · Pre Security.</p>`},
   contact:{title:'Contact / Network',label:'SAFE ZONE · CONTACT',sub:'Open to connect',body:`<p>Have a question, a project, or simply want to talk tech?</p><p><strong>Paris / Île-de-France</strong><br>Native French · Professional English, estimated B2/C1 level, not certified</p><div class="r-links"><a class="btn primary" href="mailto:matthis.guyomard@hotmail.com">Send an email</a><a class="btn" href="https://www.linkedin.com/in/matthis-guyomard/" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>`}
  }
 };

 const nodeBase = [
  // World 1: two milestones form a clear diagonal route, away from buildings and title.
  {id:'vinci',x:185,y:205,color:'#ffd56a',icon:'VC'},
  {id:'axens',x:345,y:265,color:'#59f3ff',icon:'AX'},
  // World 2: AXA sits as the focal main quest, centered in its district.
  {id:'axa',x:1035,y:215,color:'#79ffb2',icon:'A'},
  // World 3: skills and TryHackMe are separated vertically for a natural exploration path.
  {id:'skills',x:175,y:500,color:'#7aa7ff',icon:'{}'},
  {id:'thm',x:335,y:610,color:'#ff6b7d',icon:'THM'},
  // World 4: contact first, then training deeper in the district.
  {id:'contact',x:920,y:470,color:'#ffffff',icon:'@'},
  {id:'training',x:1085,y:600,color:'#c68cff',icon:'EDU'}
 ];
 const obstacles=[{x:515,y:240,w:250,h:82},{x:510,y:455,w:260,h:65},{x:78,y:118,w:118,h:58},{x:1084,y:118,w:118,h:58}];
 const npcs=[
  {id:'guide',x:640,y:630,label:'SYS_GUIDE',avatar:'SYS',fr:['Bienvenue dans Career Quest Arcade Deluxe. Chaque balise représente une étape réelle de mon parcours.','Commence par la zone AXA pour voir ma prochaine mission, ou explore librement les autres quartiers.'],en:['Welcome to Career Quest Arcade Deluxe. Each beacon represents a real milestone in my background.','Start with the AXA area to see my next mission, or freely explore the other districts.']},
  {id:'mentor',x:770,y:455,label:'DEV_NPC',avatar:'DEV',fr:['Astuce : le mode recruteur condense toutes les informations importantes en lecture rapide.','Le terminal caché contient aussi des commandes pour parcourir le profil sans utiliser la carte.'],en:['Tip: Recruiter Mode condenses the key information into a fast-reading layout.','The hidden terminal also contains commands to browse the profile without using the map.']}
 ];
 const portals=[
  {id:'world1',x:530,y:342,to:{x:260,y:255},color:'#ffb52e',fr:'Monde 1 · Infra & Cyber',en:'World 1 · Infra & Cyber',shortFr:'MONDE 1',shortEn:'WORLD 1'},
  {id:'world2',x:750,y:342,to:{x:1020,y:255},color:'#39b9eb',fr:'Monde 2 · Software',en:'World 2 · Software',shortFr:'MONDE 2',shortEn:'WORLD 2'},
  {id:'world3',x:530,y:395,to:{x:260,y:575},color:'#9b6bf2',fr:'Monde 3 · Skills & Formation',en:'World 3 · Skills & Education',shortFr:'MONDE 3',shortEn:'WORLD 3'},
  {id:'world4',x:750,y:395,to:{x:1020,y:575},color:'#4fbd67',fr:'Monde 4 · Réseau & Contact',en:'World 4 · Network & Contact',shortFr:'MONDE 4',shortEn:'WORLD 4'}
 ];
 const achievementDefs=[
  {id:'first',icon:'◆',fr:['Premier contact','Découvrir une première zone'],en:['First contact','Discover your first zone']},
  {id:'cyber',icon:'⌁',fr:['Cyber Explorer','Découvrir Axens + TryHackMe'],en:['Cyber Explorer','Discover Axens + TryHackMe']},
  {id:'builder',icon:'</>',fr:['Automation Builder','Découvrir Vinci + Skill Tree'],en:['Automation Builder','Discover Vinci + Skill Tree']},
  {id:'recruiter',icon:'ID',fr:['Fast Track','Ouvrir le mode recruteur'],en:['Fast Track','Open recruiter mode']},
  {id:'completion',icon:'★',fr:['100% Career Map','Explorer les 7 zones'],en:['100% Career Map','Explore all 7 zones']},
  {id:'collector',icon:'✦',fr:['Chasseur de trésor','Trouver 6 collectibles'],en:['Treasure Hunter','Find 6 collectibles']},
  {id:'collectorAll',icon:'♛',fr:['Collection complète','Trouver les 12 collectibles'],en:['Full Collection','Find all 12 collectibles']}
 ];

 function t(){return i18n[lang]}
 function axaHasStarted(){return new Date() >= new Date('2026-09-21T00:00:00+02:00')}
 function nodes(){return nodeBase.map(n=>{const item={...n,...content[lang][n.id]};if(n.id==='axa'){item.label=axaHasStarted()?(lang==='fr'?'QUÊTE EN COURS · AXA GROUP OPERATIONS':'QUEST IN PROGRESS · AXA GROUP OPERATIONS'):(lang==='fr'?'PROCHAINE QUÊTE · AXA GROUP OPERATIONS':'NEXT QUEST · AXA GROUP OPERATIONS');}return item})}
 function pad(n){return String(Math.max(0,Math.floor(n))).padStart(4,'0')}
 function ensureAudio(){
  try{
   audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
   if(!masterGain){masterGain=audioCtx.createGain();masterGain.gain.value=soundOn?volume:0;masterGain.connect(audioCtx.destination)}
   if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
   return true;
  }catch(e){return false}
 }
 function setMasterVolume(v){
  volume=Math.max(0,Math.min(1,v));soundOn=volume>0;
  if(ensureAudio()&&masterGain)masterGain.gain.setTargetAtTime(soundOn?volume:0,audioCtx.currentTime,.025);
  $('volumeSlider').value=Math.round(volume*100);$('volumeValue').textContent=`${Math.round(volume*100)}%`;$('rVolumeSlider').value=Math.round(volume*100);$('rVolumeValue').textContent=`${Math.round(volume*100)}%`;
  $('soundControl').classList.toggle('muted',!soundOn);$('rSoundControl').classList.toggle('muted',!soundOn);$('soundBtn').textContent=`${soundOn?'🔊':'🔇'} ${t().sound}`;$('rSoundBtn').textContent=`${soundOn?'🔊':'🔇'} ${t().sound}`;
  if(soundOn)startMusic();else stopMusic();saveGame(true);
 }
 function beep(freq=500,dur=.05){if(!soundOn||!ensureAudio())return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(masterGain);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
 function typewriterBeep(ch){
  if(!soundOn||!ensureAudio()||/\s/.test(ch))return;
  try{
   const o=audioCtx.createOscillator(),g=audioCtx.createGain();
   o.type='square';
   o.frequency.value=520+(ch.charCodeAt(0)%7)*24;
   g.gain.setValueAtTime(.0045,audioCtx.currentTime);
   g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.022);
   o.connect(g);g.connect(masterGain);o.start();o.stop(audioCtx.currentTime+.024);
  }catch(e){}
 }
 function musicNote(freq,time,dur,gain=.018,type='square'){
  if(!soundOn||!audioCtx||!masterGain)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,time);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(gain,time+.012);g.gain.exponentialRampToValueAtTime(.0001,time+dur);o.connect(g);g.connect(masterGain);o.start(time);o.stop(time+dur+.03)
 }
 function scheduleMusic(){
  if(!soundOn||!audioCtx)return;
  // ~69-second original arcade arrangement before the full structure repeats.
  // 16 bars × 16 eighth notes, with changing motifs, harmony and rests.
  const beat=60/112/2;
  const scale=[261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99,880.00,987.77];
  const motifs=[
   [7,9,11,null,9,7,6,null,7,9,12,11,9,null,7,null],
   [8,10,12,null,10,8,7,null,8,10,13,12,10,null,8,null],
   [6,8,10,11,10,8,6,null,5,7,9,10,9,7,5,null],
   [7,null,9,11,12,11,9,null,7,6,7,9,7,null,4,null],
   [9,11,12,null,11,9,7,9,10,12,13,null,12,10,9,null],
   [7,9,10,12,10,9,7,null,8,10,12,13,12,10,8,null],
   [5,7,9,null,10,9,7,5,6,8,10,null,9,8,6,null],
   [7,9,11,12,11,9,7,6,7,null,9,null,11,9,7,null]
  ];
  const roots=[130.81,146.83,110.00,123.47,130.81,98.00,110.00,123.47,146.83,130.81,110.00,123.47,130.81,146.83,123.47,130.81];
  while(musicNextTime<audioCtx.currentTime+.22){
   const phraseStep=musicStep%256,bar=Math.floor(phraseStep/16),i=phraseStep%16;
   const motif=motifs[bar%motifs.length],idx=motif[i];
   const section=bar<4?0:bar<8?1:bar<12?2:3;
   if(idx!==null){
    const accent=(i===0||i===8)?1.12:1;
    const octave=(section===2&&i%8>=4)?2:1;
    musicNote(scale[Math.min(scale.length-1,idx)]*octave,musicNextTime,beat*.68,.0095*accent,'square');
    if(section===1&&i%4===2)musicNote(scale[Math.max(0,idx-4)],musicNextTime,beat*.38,.0035,'triangle');
   }
   if(i===0){
    const root=roots[bar];
    musicNote(root,musicNextTime,beat*7.2,.0125,'triangle');
    musicNote(root*2,musicNextTime,beat*3.4,.0045,'sine');
   }
   if((section===1||section===3)&&(i===4||i===12))musicNote(783.99,musicNextTime,beat*.18,.0028,'sine');
   if(section===3&&bar===15&&i>=12&&idx!==null)musicNote(scale[Math.max(0,idx-5)],musicNextTime,beat*.45,.0026,'triangle');
   musicNextTime+=beat;musicStep++;
  }
 }
 function startMusic(){
  if(!soundOn||musicTimer||!ensureAudio())return;
  musicNextTime=Math.max(audioCtx.currentTime+.06,musicNextTime||0);scheduleMusic();musicTimer=setInterval(scheduleMusic,90)
 }
 function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}musicNextTime=0;musicStep=0}

 function showToast(html){clearTimeout(toastTimer);$('toast').innerHTML=html;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600)}

 async function initVisitor(){
  let online=false,count=0;
  try{
   const res=await fetch('https://counterapi.com/api/matthis-guyomard-portfolio/view/career-quest-arcade-deluxe');
   if(!res.ok)throw new Error('counter');
   const data=await res.json();count=Number(data.value)||0;online=count>0;
  }catch(e){count=Number(sessionStorage.getItem('matthis-arcade-deluxe-fallback'))||Math.floor(1000+Math.random()*8000);sessionStorage.setItem('matthis-arcade-deluxe-fallback',String(count));}
  visitorCount=count;playerName=`${t().playerPrefix}_${pad(count)}`;updateVisitorUI(online);
 }
 function updateVisitorUI(online=true){
  playerName=`${t().playerPrefix}_${pad(visitorCount)}`;
  $('visitorPreview').textContent=playerName;$('playerTop').textContent=playerName;$('hudPlayer').textContent=playerName;$('visitStat').textContent=pad(visitorCount);
  $('visitorTop').textContent=`${t().visitors} ${pad(visitorCount)}`;$('serverStatus').textContent=online?t().connected:t().offline;$('serverStatus').style.color=online?'var(--green)':'var(--amber)';
  $('visitorLabel').textContent=online?(lang==='fr'?'Identité attribuée :':'Assigned identity:'):(lang==='fr'?'Mode hors-ligne :':'Offline mode:');
 }

 function setLang(next){
  lang=next;document.documentElement.lang=lang;
  $('langFr').classList.toggle('active',lang==='fr');$('langEn').classList.toggle('active',lang==='en');
  $('startDesc').textContent=t().startDesc;$('playBtn').textContent=t().play;$('startRecruiterBtn').textContent=t().recruiter;$('startHint').textContent=t().hint;
  $('lvlLabel').textContent=t().lvl;$('zoneLabel').textContent=t().zones;$('missionTitle').textContent=t().mission;$('missionSub').textContent=t().missionSub;$('mapTitle').textContent=t().mini;$('mapSub').textContent=t().miniSub;$('visitStatLabel').textContent=t().visitGlobal;$('achievementLabel').textContent=t().achievements;$('achTitle').textContent=t().achTitle;$('achSub').textContent=t().achSub;$('controlsText').innerHTML=t().controls;
  $('rModeLabel').textContent=t().rMode;$('rLead').textContent=t().rLead;$('closeRecruiter').textContent=t().returnGame;$('recruiterBtn').textContent=t().recruiterBtn;$('soundBtn').textContent=`${soundOn?'🔊':'🔇'} ${t().sound}`;$('rLangToggle').textContent='FR / EN';$('rSoundBtn').textContent=`${soundOn?'🔊':'🔇'} ${t().sound}`;$('volumeLabel').textContent=lang==='fr'?'VOLUME':'VOLUME';$('soundTip').textContent=lang==='fr'?'0% coupe la musique et les effets.':'0% mutes music and sound effects.';
  $('objectiveEyebrow').textContent=t().objective;$('objectiveTitle').textContent=t().objectiveTitle;$('objectiveSub').textContent=t().objectiveSub;$('collectStatLabel').textContent=t().collectLabel;$('endKicker').textContent=t().endKicker;$('endTitle').textContent=t().endTitle;$('endText').textContent=t().endText;$('endContinueBtn').textContent=t().continueExplore;$('endCvBtn').textContent=t().seeCv;$('endContactBtn').textContent=t().contactMe;$('endZonesLabel').textContent=lang==='fr'?'zones':'zones';$('endCollectLabel').textContent=t().collectLabel;$('endLevelLabel').textContent=lang==='fr'?'niveau':'level';$('minimapLegend').innerHTML=lang==='fr'?'<span><i class="beacon"></i>Balises</span><span><i class="portal"></i>Portails</span><span><i class="terminal-icon"></i>Terminal</span><span><i class="collect"></i>Collectibles</span>':'<span><i class="beacon"></i>Beacons</span><span><i class="portal"></i>Portals</span><span><i class="terminal-icon"></i>Terminal</span><span><i class="collect"></i>Collectibles</span>'; 
  updateVisitorUI($('serverStatus').textContent.includes('ONLINE'));
  renderQuests();renderAchievements();renderRecruiter();updateInteraction();if($('cinematic').classList.contains('show'))renderCinematic();saveGame(true);
 }

 function saveGame(force=false){
  const now=performance.now();if(!force&&now-lastSave<900)return;lastSave=now;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({lang,volume,visited:[...visited],unlocked:[...unlocked],collected:[...collected],xp,level,player:{x:Math.round(player.x),y:Math.round(player.y)},endShown}))}catch(e){}
 }
 function loadGame(){
  try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;const s=JSON.parse(raw);if(s.lang==='fr'||s.lang==='en')lang=s.lang;if(Number.isFinite(s.volume))volume=Math.max(0,Math.min(1,s.volume));(s.visited||[]).forEach(id=>visited.add(id));(s.unlocked||[]).forEach(id=>unlocked.add(id));(s.collected||[]).forEach(id=>collected.add(id));if(Number.isFinite(s.xp))xp=Math.max(0,Math.min(99,s.xp));if(Number.isFinite(s.level))level=Math.max(1,s.level);if(s.player&&Number.isFinite(s.player.x)&&Number.isFinite(s.player.y)){player.x=Math.max(30,Math.min(world.w-30,s.player.x));player.y=Math.max(30,Math.min(world.h-30,s.player.y))}endShown=!!s.endShown;}catch(e){}
 }
 function updateCollectiblesUI(){
  $('collectCount').textContent=collected.size;$('collectStat').textContent=`${collected.size}/${collectibles.length}`;$('endCollectibles').textContent=`${collected.size}/${collectibles.length}`;
 }
 function spawnConfetti(){
  const layer=$('confettiLayer');layer.innerHTML='';const colors=['#ff655f','#ffd84c','#56c870','#55bdf6','#9a6af2','#ff9d43'];for(let i=0;i<52;i++){const p=document.createElement('i');p.className='confetti-piece';p.style.left=`${Math.random()*100}%`;p.style.top=`${-10-Math.random()*80}px`;p.style.background=colors[i%colors.length];p.style.animationDelay=`${Math.random()*2.2}s`;p.style.animationDuration=`${3+Math.random()*2.4}s`;layer.appendChild(p)}
 }
 function showEndScreen(){
  endShown=true;$('endLevel').textContent=String(level).padStart(2,'0');updateCollectiblesUI();spawnConfetti();$('endScreen').classList.add('show');$('endScreen').setAttribute('aria-hidden','false');beep(987,.16);setTimeout(()=>beep(1318,.18),130);saveGame(true);
 }
 function closeEndScreen(){$('endScreen').classList.remove('show');$('endScreen').setAttribute('aria-hidden','true');canvas.focus()}

 function addXp(amount){xp+=amount;while(xp>=100){xp-=100;level++;beep(760,.1);showToast(`<b>LEVEL UP</b><br>${t().lvl} ${String(level).padStart(2,'0')}`)}updateProgress()}
 function updateProgress(){
  $('level').textContent=String(level).padStart(2,'0');$('xpText').textContent=`${xp} / 100`;$('xpSide').textContent=`${xp} / 100`;$('xpBar').style.width=`${xp}%`;
  $('endLevel').textContent=String(level).padStart(2,'0');const pct=Math.round(visited.size/nodeBase.length*100);$('count').textContent=visited.size;$('progress').style.width=`${pct}%`;$('progressPct').textContent=`${pct}%`;
 }
 function checkAchievements(){
  const before=unlocked.size;
  if(visited.size>=1)unlocked.add('first');
  if(visited.has('axens')&&visited.has('thm'))unlocked.add('cyber');
  if(visited.has('vinci')&&visited.has('skills'))unlocked.add('builder');
  if(visited.size===nodeBase.length)unlocked.add('completion');
  if(collected.size>=6)unlocked.add('collector');
  if(collected.size===collectibles.length)unlocked.add('collectorAll');
  if(unlocked.size>before){const newest=[...unlocked].find(id=>!renderAchievements.prev?.has(id));if(newest){const d=achievementDefs.find(a=>a.id===newest),txt=d[lang][0];showToast(`<b>${t().achievementUnlocked}</b><br>${txt}`);beep(880,.12)}}
  renderAchievements.prev=new Set(unlocked);renderAchievements();
 }
 function renderAchievements(){
  $('achievements').innerHTML=achievementDefs.map(a=>{const [name,desc]=a[lang];return `<div class="achievement ${unlocked.has(a.id)?'unlocked':''}"><div class="badge">${unlocked.has(a.id)?'✓':a.icon}</div><div><b>${name}</b><span>${desc}</span></div></div>`}).join('');
  $('achievementCount').textContent=`${unlocked.size}/${achievementDefs.length}`;
 }
 function renderQuests(){
  $('questList').innerHTML=nodes().map(n=>`<div class="quest ${visited.has(n.id)?'done':''}"><span class="dot"></span><div><div class="quest-name">${n.label.replace(' · ',' · ')}</div><div class="quest-sub">${n.sub}</div></div></div>`).join('');updateProgress();
  renderMapDots();
 }
 function renderMapDots(){
  document.querySelectorAll('.map-dot,.map-portal,.map-terminal,.map-collect').forEach(e=>e.remove());
  nodeBase.forEach(n=>{const d=document.createElement('span');d.className=`map-dot ${visited.has(n.id)?'done':''}`;d.title=content[lang][n.id].title;d.style.left=`${n.x/world.w*100}%`;d.style.top=`${n.y/world.h*100}%`;$('minimap').appendChild(d)});
  portals.forEach(p=>{const d=document.createElement('span');d.className='map-portal';d.title=lang==='fr'?p.fr:p.en;d.style.left=`${p.x/world.w*100}%`;d.style.top=`${p.y/world.h*100}%`;$('minimap').appendChild(d)});
  const term=document.createElement('span');term.className='map-terminal';term.title='Arcade Terminal';term.style.left=`${terminalStation.x/world.w*100}%`;term.style.top=`${terminalStation.y/world.h*100}%`;$('minimap').appendChild(term);
  collectibles.filter(c=>!collected.has(c.id)).forEach(c=>{const d=document.createElement('span');d.className='map-collect';d.style.left=`${c.x/world.w*100}%`;d.style.top=`${c.y/world.h*100}%`;$('minimap').appendChild(d)});
 }

 function openNode(n){
  $('modalLabel').textContent=n.label;$('modalTitle').textContent=n.title;$('modalBody').innerHTML=n.body;$('modalWrap').classList.add('show');beep(520,.055);
  if(!visited.has(n.id)){burstFx(n.x,n.y,n.color,22);visited.add(n.id);addXp(25);renderQuests();showToast(`<b>${t().questUpdated}</b><br>${visited.size}/${nodeBase.length} ${t().zonesDiscovered}`);checkAchievements();if(visited.size===nodeBase.length){setTimeout(()=>showToast(`<b>${t().complete}</b><br>${t().completeSub}`),420);setTimeout(showEndScreen,1150)}saveGame(true)}
 }
 function closeModal(){$('modalWrap').classList.remove('show');canvas.focus()}
 function recruiter(show){$('recruiterView').classList.toggle('show',show);document.body.style.overflow=show?'hidden':'';if(show&&!unlocked.has('recruiter')){unlocked.add('recruiter');addXp(15);checkAchievements();saveGame(true)}beep(420,.05)}
 function openTerminal(){if($('terminalWrap').classList.contains('show'))return;$('terminalWrap').classList.add('show');$('terminalOutput').textContent=t().terminalHello;$('terminalInput').value='';setTimeout(()=>$('terminalInput').focus(),20);beep(350,.08)}
 function closeTerminal(){$('terminalWrap').classList.remove('show');canvas.focus()}

 function renderRecruiter(){
  const c=lang==='fr'?{
   intro:'PROFIL',introP:'Curieux de nature, j’aime comprendre, sécuriser et automatiser les infrastructures. Mon parcours combine systèmes, réseaux, cybersécurité et développement d’outils.',
   exp:'EXPÉRIENCE',axa:'AXA · Software Engineer Analyst Apprentice',axaD:'Septembre 2026 · Juin 2027',axaP:'Au sein de Group Data and AI Innovation / Software Engineering : maturité d’ingénierie, bonnes pratiques, sécurité logicielle avec SAST, SCA et DAST, DevSecOps, Open Source et documentation.',
   axens:'Axens · Infrastructure & Cybersecurity Intern',axensD:'Juin 2026 · Août 2026',axensP:'Projet Power BI conçu de A à Z pour détecter les écarts d’inventaire, agents manquants et machines non conformes. Le flux mensuel a ensuite été automatisé avec Power Automate, depuis la réception des exports par email jusqu’au rafraîchissement du dashboard.',
   vinci:'Vinci Construction Grands Projets',vinciD:'Août 2025 · Octobre 2025',vinciP:'Application Python remise à l’équipe pour automatiser la création des fiches serveurs depuis Tanium, avec auto-complétion et exports PDF, HTML, JSON et XLSX. Le temps de génération est passé de plusieurs minutes à quelques secondes.',
   impact:'IMPACT',skills:'COMPÉTENCES',edu:'FORMATION',eduP:'Efrei · Bachelor Cybersécurité & Ethical Hacking<br>IPSSI · cursus Administration Systèmes, Réseaux & Cybersécurité jusqu’en octobre 2026<br>42 · Piscine réussie puis intégration de l’école, avant réorientation du parcours',contact:'CONTACT',contactP:'Disponible pour échanger autour du software engineering, de l’infrastructure, de l’automatisation et de la cybersécurité.',formKicker:'CONTACT DIRECT',formTitle:'Envoyer un message',formText:'Une question, une opportunité ou simplement envie d’échanger ? Écris-moi directement depuis le portfolio.',formBadge:'✉ MESSAGE',name:'Nom',subject:'Sujet',email:'Email',message:'Message',namePh:'Votre nom',subjectPh:'Objet de votre message',emailPh:'vous@exemple.fr',messagePh:'Écrivez votre message ici...',send:'Envoyer le message',sending:'Envoi en cours...',sent:'Message envoyé. Merci, je vous répondrai dès que possible.',sendError:'Impossible d’envoyer le message pour le moment. Vous pouvez utiliser le bouton Email juste au-dessus.',required:'Merci de remplir tous les champs correctement.'
  }:{
   intro:'PROFILE',introP:'Curious by nature, I enjoy understanding, securing and automating infrastructure. My background combines systems, networks, cybersecurity and tooling development.',
   exp:'EXPERIENCE',axa:'AXA · Software Engineer Analyst Apprentice',axaD:'September 2026 · June 2027',axaP:'Within Group Data and AI Innovation / Software Engineering: engineering maturity, best practices, software security with SAST, SCA and DAST, DevSecOps, Open Source and documentation.',
   axens:'Axens · Infrastructure & Cybersecurity Intern',axensD:'June 2026 · August 2026',axensP:'End-to-end Power BI project built to identify inventory gaps, missing agents and non-compliant devices. The monthly data flow was then automated with Power Automate, from email ingestion to dashboard refresh.',
   vinci:'Vinci Construction Grands Projets',vinciD:'August 2025 · October 2025',vinciP:'Python application handed over to the team to automate server-sheet creation from Tanium, with autocomplete and PDF, HTML, JSON and XLSX outputs. Generation time dropped from several minutes to a few seconds.',
   impact:'IMPACT',skills:'SKILLS',edu:'EDUCATION',eduP:'Efrei · Bachelor in Cybersecurity & Ethical Hacking<br>IPSSI · Systems, Networks & Cybersecurity curriculum through October 2026<br>42 · Piscine passed and school joined, followed by an academic redirection',contact:'CONTACT',contactP:'Open to discussions around software engineering, infrastructure, automation and cybersecurity.',formKicker:'DIRECT CONTACT',formTitle:'Send a message',formText:'Have a question, an opportunity, or simply want to connect? Write to me directly from the portfolio.',formBadge:'✉ MESSAGE',name:'Name',subject:'Subject',email:'Email',message:'Message',namePh:'Your name',subjectPh:'Message subject',emailPh:'you@example.com',messagePh:'Write your message here...',send:'Send message',sending:'Sending...',sent:'Message sent. Thank you, I will get back to you as soon as possible.',sendError:'Unable to send the message right now. You can use the Email button just above.',required:'Please complete all fields correctly.'
  };
  $('recruiterGrid').innerHTML=`
   <article class="r-card"><div class="r-date">${axaHasStarted()?(lang==='fr'?'QUÊTE EN COURS':'QUEST IN PROGRESS'):(lang==='fr'?'PROCHAINE QUÊTE':'NEXT QUEST')}</div><h3>${c.axa}</h3><p>${c.axaD}</p><p>${c.axaP}</p><div class="recruiter-tags"><span>Software</span><span>Analysis</span><span>AXA</span></div></article>
   <article class="r-card"><div class="r-date">${c.exp}</div><h3>${c.axens}</h3><p>${c.axensD}</p><p>${c.axensP}</p><div class="recruiter-tags"><span>SonarQube</span><span>SentinelOne</span><span>Tanium</span><span>Power BI</span></div></article>
   <article class="r-card"><div class="r-date">${c.exp}</div><h3>${c.vinci}</h3><p>${c.vinciD}</p><p>${c.vinciP}</p><div class="recruiter-tags"><span>Python</span><span>Tanium API</span><span>CMDB</span></div></article>
   <article class="r-card"><div class="r-date">${c.edu}</div><h3>Efrei · IPSSI · 42</h3><p>${c.eduP}</p></article>
   <article class="r-card wide"><div class="r-date">${c.skills}</div><div class="r-skill-grid"><div><h3>Cyber</h3><p>SonarQube · SentinelOne · Tanium · Sekoia · Varonis · Wireshark · Nmap</p></div><div><h3>Systems & Network</h3><p>Windows Server · Active Directory · Linux · Hyper-V · Proxmox VE · TCP/IP · VLAN · DNS · DHCP · OPNsense</p></div><div><h3>Automation</h3><p>Python · PowerShell · Ansible · Power BI</p></div></div></article>
   <article class="r-card wide"><div class="r-date">${c.contact}</div><h3>${c.contactP}</h3><div class="r-links"><a class="btn primary" href="mailto:matthis.guyomard@hotmail.com">✉ Email</a><a class="btn" href="https://www.linkedin.com/in/matthis-guyomard/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a class="btn" href="Matthis_Guyomard_CV.pdf" target="_blank" rel="noreferrer">📄 CV</a></div></article>
   <article class="r-card wide contact-form-card">
    <div class="contact-form-head"><div><div class="r-date">${c.formKicker}</div><h3>${c.formTitle}</h3><p>${c.formText}</p></div><span class="contact-form-badge">${c.formBadge}</span></div>
    <form class="contact-form" id="portfolioContactForm" novalidate>
     <div class="contact-field"><label for="contactName">${c.name}</label><input id="contactName" name="name" type="text" autocomplete="name" maxlength="80" placeholder="${c.namePh}" required></div>
     <div class="contact-field"><label for="contactEmail">${c.email}</label><input id="contactEmail" name="email" type="email" autocomplete="email" maxlength="120" placeholder="${c.emailPh}" required></div>
     <div class="contact-field full"><label for="contactSubject">${c.subject}</label><input id="contactSubject" name="subject" type="text" maxlength="140" placeholder="${c.subjectPh}" required></div>
     <div class="contact-field full"><label for="contactMessage">${c.message}</label><textarea id="contactMessage" name="message" maxlength="3000" placeholder="${c.messagePh}" required></textarea></div>
     <div class="contact-honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
     <div class="contact-form-foot"><div class="contact-form-status" id="contactFormStatus" role="status" aria-live="polite"></div><button class="btn primary contact-submit" id="contactSubmit" type="submit">${c.send}</button></div>
    </form>
   </article>`;
  bindContactForm(c);
 }

 function bindContactForm(c){
  const form=$('portfolioContactForm'); if(!form)return;
  const status=$('contactFormStatus'), submit=$('contactSubmit');
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   status.className='contact-form-status';
   if(!form.checkValidity()){status.textContent=c.required;status.classList.add('error');form.reportValidity();return}
   const data=new FormData(form);
   if((data.get('website')||'').toString().trim())return;
   submit.disabled=true;submit.textContent=c.sending;status.textContent='';beep(520,.035);
   try{
    const payload={name:(data.get('name')||'').toString().trim(),email:(data.get('email')||'').toString().trim(),subject:(data.get('subject')||'').toString().trim(),message:(data.get('message')||'').toString().trim(),_subject:'Portfolio contact: '+(data.get('subject')||'').toString().trim(),_template:'table',_captcha:'false'};
    const res=await fetch('https://formsubmit.co/ajax/matthis.guyomard@hotmail.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error('send failed');
    const result=await res.json().catch(()=>({success:true}));
    if(result.success===false||result.success==='false')throw new Error('send failed');
    form.reset();status.textContent=c.sent;status.classList.add('success');beep(760,.07);
   }catch(err){status.textContent=c.sendError;status.classList.add('error');beep(220,.09)}
   finally{submit.disabled=false;submit.textContent=c.send}
  });
 }

 function cinematicSlides(){return lang==='fr'?[{k:'CONNEXION ÉTABLIE',title:`Bienvenue, ${playerName}.`,text:'Tu entres dans une version jouable de mon portfolio. La carte rassemble mes expériences, ma formation et mes compétences techniques.'},{k:'MISSION PRINCIPALE',title:'Explorer un parcours, pas une liste.',text:'Déplace-toi librement, parle aux PNJ et ouvre les balises. Chaque découverte ajoute de l’XP et débloque des succès.'},{k:'ACCÈS RAPIDE',title:'Joue… ou va droit au but.',text:'Clique sur « Entrer dans la map », puis déplace immédiatement ton personnage avec ZQSD, WASD ou les flèches. Le guide est optionnel : approche-le et appuie sur E seulement si tu veux de l’aide.'}]:[{k:'CONNECTION ESTABLISHED',title:`Welcome, ${playerName}.`,text:'You are entering a playable version of my portfolio. The map brings together my experience, education and technical skills.'},{k:'MAIN MISSION',title:'Explore a career, not a list.',text:'Move freely, talk to NPCs and open beacons. Every discovery grants XP and unlocks achievements.'},{k:'FAST ACCESS',title:'Play… or get straight to the point.',text:'Click “Enter the map”, then move immediately with WASD or the arrow keys. The guide is optional: walk up to it and press E only if you want help.'}]}
 function showCinematic(){cinematicIndex=0;cinematicSeen=true;$('cinematic').classList.add('show');renderCinematic()}
 function renderCinematic(){const slides=cinematicSlides(),s=slides[cinematicIndex];$('cinematicKicker').textContent=s.k;$('cinematicTitle').textContent=s.title;$('cinematicText').textContent=s.text;$('cinematicStep').textContent=`0${cinematicIndex+1} / 0${slides.length}`;$('cinematicNext').textContent=cinematicIndex===slides.length-1?(lang==='fr'?'Entrer dans la map →':'Enter the map →'):(lang==='fr'?'Continuer →':'Continue →')}
 function nextCinematic(){const slides=cinematicSlides();if(cinematicIndex<slides.length-1){cinematicIndex++;renderCinematic();beep(560,.04)}else{$('cinematic').classList.remove('show');running=true;canvas.focus();showToast(`<b>${lang==='fr'?'À TOI DE JOUER !':'YOUR TURN!'}</b><br>${lang==='fr'?'Déplace-toi avec ZQSD / WASD / les flèches. Approche le guide et appuie sur E si tu veux de l’aide.':'Move with WASD / arrows. Walk to the guide and press E if you want help.'}`);beep(650,.08)}}
 function openDialogue(npc){
  nearNpc=npc;
  const lines=npc[lang], text=lines[Math.floor(Math.random()*lines.length)];
  npcSpeech={npc,text,shown:0,lastShown:0,started:performance.now(),charMs:27};
  beep(470,.045);canvas.focus();
 }
 function closeDialogue(){npcSpeech=null;canvas.focus()}
 function usePortal(p){burstFx(player.x,player.y,p.color,18);player.x=p.to.x;player.y=p.to.y;burstFx(player.x,player.y,p.color,18);beep(720,.08);saveGame(true);const dest=lang==='fr'?p.fr:p.en;showToast(`<b>${lang==='fr'?'VOYAGE RAPIDE':'FAST TRAVEL'}</b><br>${dest}`)}
 function startAmbience(){startMusic()}
 function stopAmbience(){stopMusic()}
 function updateInteraction(){if(nearNode){const n=nodes().find(x=>x.id===nearNode.id);$('interaction').innerHTML=`<span class="key">E</span> ${t().open} · ${n.label}`}else if(nearNpc){$('interaction').innerHTML=`<span class="key">E</span> ${npcSpeech?(lang==='fr'?'FERMER LE DIALOGUE':'CLOSE DIALOGUE'):(lang==='fr'?'PARLER':'TALK')} · ${nearNpc.label}`}else if(nearTerminal){$('interaction').innerHTML=`<span class="key">E</span> ${t().terminalWorld}`}else if(nearPortal){const dest=lang==='fr'?nearPortal.fr:nearPortal.en;$('interaction').innerHTML=`<span class="key">E</span> ${lang==='fr'?'VOYAGER VERS':'TRAVEL TO'} · ${dest}`}else{$('interaction').innerHTML=''}}
 function detectWorld(){
  if(player.x<470&&player.y<345)return 1;if(player.x>810&&player.y<345)return 2;if(player.x<470&&player.y>345)return 3;if(player.x>810&&player.y>345)return 4;return 0;
 }
 function announceWorld(id){
  if(!id||id===currentWorld)return;currentWorld=id;const names=lang==='fr'?['','MONDE 1 · INFRA & CYBER','MONDE 2 · SOFTWARE','MONDE 3 · SKILLS & FORMATION','MONDE 4 · RÉSEAU & CONTACT']:['','WORLD 1 · INFRA & CYBER','WORLD 2 · SOFTWARE','WORLD 3 · SKILLS & EDUCATION','WORLD 4 · NETWORK & CONTACT'];$('worldBannerKicker').textContent=lang==='fr'?'NOUVELLE ZONE':'NEW AREA';$('worldBannerTitle').textContent=names[id];$('worldBanner').classList.add('show');clearTimeout(worldBannerTimer);worldBannerTimer=setTimeout(()=>$('worldBanner').classList.remove('show'),1700);beep(660,.045);
 }

 function collides(nx,ny){const r=player.r;if(nx-r<25||ny-r<25||nx+r>world.w-25||ny+r>world.h-25)return true;return obstacles.some(o=>nx+r>o.x&&nx-r<o.x+o.w&&ny+r>o.y&&ny-r<o.y+o.h)}
 function update(dt){
  if(!running||$('modalWrap').classList.contains('show')||$('recruiterView').classList.contains('show')||$('terminalWrap').classList.contains('show')||$('cinematic').classList.contains('show')||$('endScreen').classList.contains('show'))return;
  let dx=0,dy=0;if(keys.has('arrowup')||keys.has('w')||keys.has('z'))dy--;if(keys.has('arrowdown')||keys.has('s'))dy++;if(keys.has('arrowleft')||keys.has('a')||keys.has('q'))dx--;if(keys.has('arrowright')||keys.has('d'))dx++;
  if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;if(Math.abs(dx)>Math.abs(dy))player.facing=dx>0?'right':'left';else player.facing=dy>0?'down':'up';const nx=player.x+dx*player.speed*dt,ny=player.y+dy*player.speed*dt;if(!collides(nx,player.y))player.x=nx;if(!collides(player.x,ny))player.y=ny}announceWorld(detectWorld());
  nearNode=null;nearNpc=null;nearPortal=null;nearTerminal=false;let best=1e9;for(const n of nodeBase){const d=Math.hypot(player.x-n.x,player.y-n.y);if(d<82&&d<best){best=d;nearNode=n}}for(const n of npcs){const d=Math.hypot(player.x-n.x,player.y-n.y);if(d<72&&d<best){best=d;nearNode=null;nearNpc=n}}for(const p of portals){const d=Math.hypot(player.x-p.x,player.y-p.y);if(d<58&&d<best){best=d;nearNode=null;nearNpc=null;nearPortal=p;nearTerminal=false}}const td=Math.hypot(player.x-terminalStation.x,player.y-terminalStation.y);if(td<64&&td<best){best=td;nearNode=null;nearNpc=null;nearPortal=null;nearTerminal=true}
  for(const c of collectibles){if(collected.has(c.id))continue;if(Math.hypot(player.x-c.x,player.y-c.y)<28){collected.add(c.id);burstFx(c.x,c.y,'#ffd84b',12);addXp(5);beep(980,.055);showToast(`<b>+5 XP · ✦</b><br>${collected.size}/${collectibles.length} ${t().collectLabel}`);updateCollectiblesUI();checkAchievements();renderMapDots();if(collected.size===collectibles.length)showToast(`<b>${t().allCollect}</b><br>${t().allCollectSub}`);saveGame(true)}}
  if(npcSpeech&&Math.hypot(player.x-npcSpeech.npc.x,player.y-npcSpeech.npc.y)>175)closeDialogue();
  $('interaction').classList.toggle('show',!!(nearNode||nearNpc||nearPortal||nearTerminal));updateInteraction();$('mapPlayer').style.left=`${player.x/world.w*100}%`;$('mapPlayer').style.top=`${player.y/world.h*100}%`;saveGame();
 }

 function grid(){
  const sky=ctx.createLinearGradient(0,0,0,world.h);sky.addColorStop(0,'#71cdf8');sky.addColorStop(.54,'#c7f1ff');sky.addColorStop(.55,'#8edc76');sky.addColorStop(1,'#69bf5a');ctx.fillStyle=sky;ctx.fillRect(0,0,world.w,world.h);
  // clouds
  const cloud=(x,y,s=1)=>{ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.arc(-26,2,18,0,Math.PI*2);ctx.arc(0,-7,25,0,Math.PI*2);ctx.arc(28,3,17,0,Math.PI*2);ctx.fill();ctx.restore()};
  cloud(160,62,1.05);cloud(585,90,.8);cloud(1060,55,1.0);
  // distant hills
  ctx.fillStyle='#59b858';for(const h of [{x:0,w:280,h:125},{x:250,w:360,h:105},{x:610,w:300,h:135},{x:900,w:380,h:118}]){ctx.beginPath();ctx.ellipse(h.x+h.w/2,520,h.w/2,h.h,0,Math.PI,0,true);ctx.fill()}
  // ground texture
  ctx.fillStyle='rgba(255,255,255,.12)';for(let y=430;y<world.h;y+=42){for(let x=(y/42)%2?18:0;x<world.w;x+=46){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill()}}
 }
 function zone(x,y,w,h,label){
  const palettes=[['#fff1a8','#ffcb4e'],['#d6f6ff','#69c7f1'],['#f3ddff','#b784ef'],['#dff8d6','#6bca6a']];const idx=x>700?(y>340?3:1):(y>340?2:0),p=palettes[idx];
  const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,p[0]);g.addColorStop(1,'rgba(255,255,255,.60)');ctx.fillStyle=g;ctx.strokeStyle='#2b5d84';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,h,26);ctx.fill();ctx.stroke();
  ctx.fillStyle=p[1];ctx.beginPath();ctx.roundRect(x+15,y+13,Math.min(210,w-30),31,14);ctx.fill();ctx.fillStyle='#163c5a';ctx.font='900 12px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,x+29,y+29);
 }
 function drawBuilding(o,i){
  const cols=[['#ff7c72','#ffe7a9'],['#53bdf0','#d9f5ff'],['#a97ae9','#f0e4ff'],['#58c56d','#dcf5d9']],c=cols[i%cols.length];ctx.save();
  ctx.fillStyle='rgba(31,79,110,.16)';ctx.beginPath();ctx.roundRect(o.x+7,o.y+8,o.w,o.h,18);ctx.fill();
  ctx.fillStyle=c[0];ctx.strokeStyle='#28577c';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,18);ctx.fill();ctx.stroke();
  ctx.fillStyle=c[1];for(let xx=o.x+20;xx<o.x+o.w-15;xx+=34){for(let yy=o.y+18;yy<o.y+o.h-16;yy+=28){ctx.beginPath();ctx.roundRect(xx,yy,15,11,3);ctx.fill()}}
  ctx.fillStyle='#fff5c8';ctx.fillRect(o.x+o.w/2-16,o.y+o.h-26,32,26);ctx.restore();
 }
 function drawTree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='rgba(42,83,91,.14)';ctx.beginPath();ctx.ellipse(4,18,17,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a5a2b';ctx.fillRect(-4,1,8,20);ctx.strokeStyle='#226a3b';ctx.lineWidth=2;ctx.fillStyle='#46bf62';ctx.beginPath();ctx.arc(-9,-2,12,0,Math.PI*2);ctx.arc(8,-6,14,0,Math.PI*2);ctx.arc(0,-16,15,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#7be07e';ctx.beginPath();ctx.arc(-3,-17,6,0,Math.PI*2);ctx.fill();ctx.restore()}
 function drawFlower(x,y,c='#ff6475',phase=0,tms=0){const sway=reducedMotion?0:Math.sin(tms/500+phase)*2;ctx.save();ctx.translate(x+sway,y);ctx.strokeStyle='#2e9250';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,13);ctx.stroke();ctx.fillStyle=c;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*4,Math.sin(a)*4,3,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ffd64b';ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore()}
 function drawCheckpoint(x,y,label){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#70482b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,24);ctx.lineTo(0,-26);ctx.stroke();ctx.fillStyle='#ff5f70';ctx.strokeStyle='#9a3541';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(2,-24);ctx.lineTo(30,-16);ctx.lineTo(2,-6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff6c9';ctx.font='900 8px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(label,15,-14);ctx.restore()}
 function drawCollectible(x,y,tms,phase=0){const bob=reducedMotion?0:Math.sin(tms/330+phase)*4,spin=reducedMotion?1:Math.abs(Math.sin(tms/520+phase));ctx.save();ctx.translate(x,y+bob);ctx.scale(Math.max(.25,spin),1);ctx.fillStyle='#ffd84b';ctx.strokeStyle='#a56c00';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#fff4a7';ctx.beginPath();ctx.arc(-2,-2,2.5,0,Math.PI*2);ctx.fill();ctx.restore()}
 function drawWaterfall(tms){ctx.save();ctx.fillStyle='#6dbef0';ctx.strokeStyle='#2e79ad';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(472,92,54,170,18);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=4;for(let i=0;i<3;i++){const x=484+i*14;ctx.beginPath();ctx.moveTo(x,102);for(let y=102;y<250;y+=18)ctx.lineTo(x+Math.sin(tms/250+y*.05+i)*4,y);ctx.stroke()}ctx.fillStyle='#90dcff';ctx.beginPath();ctx.ellipse(499,262,40,13,0,0,Math.PI*2);ctx.fill();ctx.restore()}
 function drawFloatingIsland(x,y,s,tms){const bob=reducedMotion?0:Math.sin(tms/900+x)*4;ctx.save();ctx.translate(x,y+bob);ctx.scale(s,s);ctx.fillStyle='rgba(42,76,100,.13)';ctx.beginPath();ctx.ellipse(4,35,50,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#9b6b3d';ctx.strokeStyle='#6f4a2c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-48,0);ctx.quadraticCurveTo(-25,45,0,58);ctx.quadraticCurveTo(28,43,48,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#62c95e';ctx.beginPath();ctx.ellipse(0,0,49,17,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#309149';ctx.stroke();drawFlower(-16,-7,'#ff6e7a',1,tms);drawFlower(15,-5,'#9b6bf2',3,tms);ctx.restore()}
 function drawCritter(x,y,tms,phase=0){const hop=reducedMotion?0:Math.abs(Math.sin(tms/430+phase))*6;ctx.save();ctx.translate(x,y-hop);ctx.fillStyle='#9b6bf2';ctx.strokeStyle='#5f3ba4';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-11,-9,22,18,8);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4,-2,3,0,Math.PI*2);ctx.arc(4,-2,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#173f5e';ctx.beginPath();ctx.arc(-4,-2,1.2,0,Math.PI*2);ctx.arc(4,-2,1.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5f3ba4';ctx.fillRect(-9,8,6,4);ctx.fillRect(3,8,6,4);ctx.restore()}
 function drawScenery(tms){
  drawWaterfall(tms);drawFloatingIsland(744,122,.72,tms);drawFloatingIsland(765,282,.48,tms);drawFloatingIsland(1020,700,.42,tms);drawFloatingIsland(260,705,.38,tms);
  [[70,52,1],[1185,52,.9],[70,742,.82],[1198,740,.85],[806,330,.7],[455,338,.66],[500,704,.58],[780,704,.58]].forEach(v=>drawTree(...v));
  const flowers=[[22,340,'#ff6475'],[470,344,'#9b6bf2'],[805,342,'#ffd84b'],[1250,340,'#ff6475'],[555,742,'#9b6bf2'],[595,730,'#ff7f50'],[690,742,'#ffd84b'],[730,730,'#ff6475']];flowers.forEach((f,i)=>drawFlower(f[0],f[1],f[2],i,tms));
  [[640,132],[640,205],[640,520],[640,590],[640,650],[530,355],[750,355],[345,700],[935,700]].forEach((p,i)=>drawCollectible(p[0],p[1],tms,i));
  drawCheckpoint(575,696,'GO');drawCheckpoint(705,696,'XP');drawCritter(555,305,tms,1);drawCritter(730,405,tms,3)
 }
 function drawPortal(p,tms){
  const pulse=reducedMotion?0:Math.sin(tms/260+p.x)*2;
  ctx.save();ctx.translate(p.x,p.y);
  // ground pad
  ctx.fillStyle='rgba(255,255,255,.82)';ctx.strokeStyle='#85582e';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,14,34,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  // original arcade travel arch
  ctx.strokeStyle=p.color;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,2,20+pulse*.2,Math.PI,0);ctx.stroke();
  ctx.strokeStyle='#85582e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,2,25,Math.PI,0);ctx.stroke();
  ctx.fillStyle=p.color;for(let i=0;i<4;i++){const a=tms/700+i*1.55;ctx.beginPath();ctx.arc(Math.cos(a)*25,-8-Math.abs(Math.sin(a))*14,2.6,0,Math.PI*2);ctx.fill()}
  // destination sign
  const label=lang==='fr'?p.shortFr:p.shortEn;ctx.font='950 9px Nunito,system-ui';const tw=ctx.measureText(label).width;const bw=Math.max(62,tw+18);
  ctx.fillStyle='#fff8dc';ctx.strokeStyle='#85582e';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-bw/2,-50,bw,23,8);ctx.fill();ctx.stroke();ctx.fillStyle='#5d4025';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('↗ '+label,0,-38);
  ctx.restore()
 }
 function drawNpc(n,tms){const bob=reducedMotion?0:Math.sin(tms/190+n.x)*1.4;ctx.save();ctx.translate(n.x,n.y+bob);ctx.fillStyle='rgba(40,90,120,.15)';ctx.beginPath();ctx.ellipse(0,20,18,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd84e';ctx.strokeStyle='#8d5e00';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-11,-16,22,22,8);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4,-7,3,0,Math.PI*2);ctx.arc(4,-7,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#23415a';ctx.beginPath();ctx.arc(-4,-7,1.3,0,Math.PI*2);ctx.arc(4,-7,1.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a78c1';ctx.fillRect(-10,5,8,14);ctx.fillRect(2,5,8,14);ctx.restore();ctx.font='900 10px Nunito,system-ui';ctx.textAlign='center';ctx.fillStyle='#173e5e';ctx.fillText(n.label,n.x,n.y-30)}
 function wrapBubbleText(text,maxWidth){
  ctx.font='800 14px Nunito,system-ui';const words=text.split(' '),lines=[];let line='';
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines
 }
 function drawNpcSpeech(tms){
  if(!npcSpeech)return;
  const s=npcSpeech,n=s.npc,total=s.text.length;
  const target=Math.min(total,Math.floor((tms-s.started)/s.charMs));
  if(target>s.lastShown){for(let i=s.lastShown;i<target;i++)typewriterBeep(s.text[i]);s.lastShown=target}s.shown=target;
  const lines=wrapBubbleText(s.text,270),lineH=20,bw=310,bh=42+lines.length*lineH;
  let bx=Math.max(12,Math.min(world.w-bw-12,n.x-bw/2)),by=n.y-bh-64;if(by<18)by=n.y+42;
  ctx.save();
  // bubble shadow + warm arcade panel
  ctx.fillStyle='rgba(91,60,32,.18)';ctx.beginPath();ctx.roundRect(bx+5,by+7,bw,bh,18);ctx.fill();
  ctx.fillStyle='#fff9df';ctx.strokeStyle='#8c5a30';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,18);ctx.fill();ctx.stroke();
  // tail points toward NPC
  const tx=Math.max(bx+28,Math.min(bx+bw-28,n.x));ctx.fillStyle='#fff9df';ctx.strokeStyle='#8c5a30';ctx.beginPath();ctx.moveTo(tx-12,by+bh-2);ctx.lineTo(n.x,n.y-34);ctx.lineTo(tx+12,by+bh-2);ctx.closePath();ctx.fill();ctx.stroke();
  // redraw lower border over tail seams
  ctx.strokeStyle='#8c5a30';ctx.beginPath();ctx.moveTo(bx+18,by+bh);ctx.lineTo(tx-12,by+bh);ctx.moveTo(tx+12,by+bh);ctx.lineTo(bx+bw-18,by+bh);ctx.stroke();
  ctx.fillStyle='#ffd84e';ctx.strokeStyle='#8c5a30';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx+24,by+25,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#704423';ctx.font='950 7px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.avatar,bx+24,by+25);
  ctx.fillStyle='#b04c35';ctx.font='950 10px Nunito,system-ui';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(n.label,bx+43,by+12);
  const visible=s.text.slice(0,s.shown);const vLines=wrapBubbleText(visible,252);ctx.fillStyle='#3f6075';ctx.font='800 14px Nunito,system-ui';
  vLines.forEach((line,i)=>ctx.fillText(line,bx+43,by+31+i*lineH));
  if(s.shown>=total){ctx.fillStyle='#9a6130';ctx.font='900 10px Nunito,system-ui';ctx.textAlign='right';ctx.fillText(lang==='fr'?'E · fermer':'E · close',bx+bw-14,by+bh-17)}
  ctx.restore();
 }
 function drawTerminalStation(tms){
  const x=terminalStation.x,y=terminalStation.y,pulse=reducedMotion?0:Math.sin(tms/360)*2;ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(66,81,77,.16)';ctx.beginPath();ctx.ellipse(0,24,28,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffc94a';ctx.strokeStyle='#86512a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-25,-28,50,42,8);ctx.fill();ctx.stroke();ctx.fillStyle='#314d5b';ctx.beginPath();ctx.roundRect(-17,-20,34,23,4);ctx.fill();ctx.fillStyle='#85f4a6';ctx.font='900 11px Consolas,monospace';ctx.textAlign='center';ctx.fillText('>_',0,-5+pulse*.12);ctx.fillStyle='#8c542e';ctx.fillRect(-20,13,40,10);ctx.restore();ctx.font='900 10px Nunito,system-ui';ctx.fillStyle='#68452b';ctx.textAlign='center';ctx.fillText('ARCADE TERMINAL',x,y+48);
 }
 function drawWorldCollectibles(tms){collectibles.forEach((c,i)=>{if(!collected.has(c.id))drawCollectible(c.x,c.y,tms,i*.7)})}

 function drawPlayer(tms){
  const moving=(keys.has('w')||keys.has('z')||keys.has('s')||keys.has('a')||keys.has('q')||keys.has('d')||keys.has('arrowup')||keys.has('arrowdown')||keys.has('arrowleft')||keys.has('arrowright')),bob=reducedMotion?0:Math.sin(tms/145)*1.2,walk=moving&&!reducedMotion?Math.sin(tms/80)*2.2:0;
  ctx.save();ctx.translate(player.x,player.y+bob);ctx.fillStyle='rgba(34,77,105,.18)';ctx.beginPath();ctx.ellipse(0,22,22,7,0,0,Math.PI*2);ctx.fill();
  // original cheerful explorer avatar
  ctx.fillStyle='#f05f67';ctx.strokeStyle='#8e3340';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-13,-20,26,14,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd5ae';ctx.beginPath();ctx.roundRect(-11,-10,22,20,8);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4,-4,3,0,Math.PI*2);ctx.arc(4,-4,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#233e57';ctx.beginPath();ctx.arc(-4,-4,1.3,0,Math.PI*2);ctx.arc(4,-4,1.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a84b4f';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,2,4,0.15,Math.PI-.15);ctx.stroke();
  ctx.fillStyle='#4c8ef7';ctx.beginPath();ctx.roundRect(-12,7,24,11,4);ctx.fill();ctx.fillStyle='#244c86';ctx.fillRect(-10,16+walk,8,10);ctx.fillRect(2,16-walk,8,10);ctx.restore();
  ctx.font='900 12px Nunito,system-ui';const labelW=Math.max(120,ctx.measureText(playerName).width+30);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='#285a80';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(player.x-labelW/2,player.y-58,labelW,25,12);ctx.fill();ctx.stroke();ctx.fillStyle='#173f60';ctx.fillText(playerName,player.x,player.y-41);
 }
 function drawWorld(tms){
  grid();drawScenery(tms);
  zone(40,70,410,260,lang==='fr'?'MONDE 1 · INFRA & CYBER':'WORLD 1 · INFRA & CYBER');zone(830,70,410,260,lang==='fr'?'MONDE 2 · SOFTWARE':'WORLD 2 · SOFTWARE');zone(40,355,410,360,lang==='fr'?'MONDE 3 · SKILLS & FORMATION':'WORLD 3 · SKILLS & EDUCATION');zone(830,355,410,360,lang==='fr'?'MONDE 4 · RÉSEAU & CONTACT':'WORLD 4 · NETWORK & CONTACT');
  // central travel hub: roads stay out of the information panels
  ctx.lineCap='round';ctx.strokeStyle='#f0d187';ctx.lineWidth=58;ctx.beginPath();ctx.moveTo(640,92);ctx.lineTo(640,690);ctx.moveTo(470,368);ctx.lineTo(810,368);ctx.stroke();ctx.strokeStyle='#fff1bd';ctx.lineWidth=4;ctx.setLineDash([18,15]);ctx.beginPath();ctx.moveTo(640,92);ctx.lineTo(640,690);ctx.moveTo(470,368);ctx.lineTo(810,368);ctx.stroke();ctx.setLineDash([]);
  obstacles.forEach(drawBuilding);
  nodes().forEach((n,i)=>{const isNear=nearNode&&nearNode.id===n.id;const pulse=reducedMotion?0:Math.sin(tms/430+i)*3;const lift=isNear&&!reducedMotion?-4:0;ctx.save();ctx.translate(n.x,n.y+lift);ctx.fillStyle='rgba(255,255,255,.76)';ctx.beginPath();ctx.arc(0,0,35+pulse*.15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#285a80';ctx.lineWidth=3;ctx.stroke();if(visited.has(n.id)){ctx.strokeStyle='#ffd84b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,29+pulse*.18,0,Math.PI*2);ctx.stroke()}ctx.fillStyle=visited.has(n.id)?'#55c96e':n.color;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(20,0);ctx.lineTo(0,22);ctx.lineTo(-20,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#285a80';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#173c5c';ctx.font='900 10px Nunito,system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(visited.has(n.id)?'✓':n.icon,0,1);if(!reducedMotion){const a=tms/650+i*1.7,rr=30+(isNear?4:0);ctx.fillStyle=visited.has(n.id)?'#ffd84b':'rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,2.6,0,Math.PI*2);ctx.fill()}ctx.restore();
   const title=n.label.replace(' · ',' · ');ctx.textAlign='center';ctx.font='900 12px Nunito,system-ui';ctx.fillStyle='#173f5e';ctx.fillText(title,n.x,n.y+54);ctx.font='800 10px Nunito,system-ui';ctx.fillStyle='#55738a';ctx.fillText(n.sub,n.x,n.y+69);
  });
  ctx.fillStyle='#2b617f';ctx.font='900 10px Nunito,system-ui';ctx.textAlign='center';ctx.fillText(lang==='fr'?'POINT DE DÉPART':'SPAWN POINT',640,755);drawWorldCollectibles(tms);drawTerminalStation(tms);portals.forEach(p=>drawPortal(p,tms));npcs.forEach(n=>drawNpc(n,tms));drawNpcSpeech(tms);drawPlayer(tms);drawFx(1/60);
 }

 let last=performance.now();function loop(now){const dt=Math.min((now-last)/1000,.034);last=now;update(dt);drawWorld(now);requestAnimationFrame(loop)}requestAnimationFrame(loop);

 $('langFr').addEventListener('click',()=>setLang('fr'));$('langEn').addEventListener('click',()=>setLang('en'));$('langToggle').addEventListener('click',()=>setLang(lang==='fr'?'en':'fr'));$('rLangToggle').addEventListener('click',()=>setLang(lang==='fr'?'en':'fr'));
 $('playBtn').addEventListener('click',()=>{if(soundOn)startMusic();$('startScreen').classList.add('hidden');running=false;showCinematic();beep(620,.09)});
 $('recruiterBtn').addEventListener('click',()=>recruiter(true));$('startRecruiterBtn').addEventListener('click',()=>{if(soundOn)startMusic();$('startScreen').classList.add('hidden');running=true;recruiter(true)});$('closeRecruiter').addEventListener('click',()=>recruiter(false));
 $('closeModal').addEventListener('click',closeModal);$('modalWrap').addEventListener('click',e=>{if(e.target===$('modalWrap'))closeModal()});
 $('closeTerminal').addEventListener('click',closeTerminal);$('terminalWrap').addEventListener('click',e=>{if(e.target===$('terminalWrap'))closeTerminal()});
 $('soundBtn').addEventListener('click',()=>{if(soundOn){setMasterVolume(0)}else{setMasterVolume(volume>0?volume:.48);beep(640,.08)}});$('rSoundBtn').addEventListener('click',()=>{if(soundOn){setMasterVolume(0)}else{setMasterVolume(volume>0?volume:.48);beep(640,.08)}});
 $('soundBtn').addEventListener('mouseenter',()=>{$('soundBtn').setAttribute('aria-expanded','true')});
 $('soundControl').addEventListener('mouseleave',()=>{$('soundBtn').setAttribute('aria-expanded','false')});
 $('volumeSlider').addEventListener('input',e=>{const v=Number(e.target.value)/100;setMasterVolume(v)});
 $('volumeSlider').addEventListener('change',()=>{if(soundOn)beep(720,.045)});$('rVolumeSlider').addEventListener('input',e=>setMasterVolume(Number(e.target.value)/100));$('rVolumeSlider').addEventListener('change',()=>{if(soundOn)beep(720,.045)});

 const movementKeys=new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','q']);
 addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(movementKeys.has(k)){keys.add(k);if(!$('modalWrap').classList.contains('show')&&!$('recruiterView').classList.contains('show')&&!$('terminalWrap').classList.contains('show'))e.preventDefault()}
  if(k==='e'||k==='enter'){
   if($('modalWrap').classList.contains('show')){e.preventDefault();closeModal();return}
   if($('recruiterView').classList.contains('show')||$('terminalWrap').classList.contains('show')||$('cinematic').classList.contains('show')||$('endScreen').classList.contains('show'))return;
   if(npcSpeech){e.preventDefault();closeDialogue();return}
   if(nearNode){e.preventDefault();openNode(nodes().find(n=>n.id===nearNode.id));return}
   if(nearNpc){e.preventDefault();openDialogue(nearNpc);return}
   if(nearTerminal){e.preventDefault();openTerminal();return}
   if(nearPortal){e.preventDefault();usePortal(nearPortal);return}
  }
  if(k==='t'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openTerminal()}
  if(k==='escape'){if($('endScreen').classList.contains('show'))closeEndScreen();else if($('terminalWrap').classList.contains('show'))closeTerminal();else if($('modalWrap').classList.contains('show'))closeModal();else if($('recruiterView').classList.contains('show'))recruiter(false);else if(npcSpeech)closeDialogue()}
 });
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
 document.querySelectorAll('[data-dir]').forEach(btn=>{const map={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'},key=map[btn.dataset.dir];btn.addEventListener('pointerdown',e=>{keys.add(key);btn.setPointerCapture?.(e.pointerId);e.preventDefault()});['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>keys.delete(key)))});$('actBtn').addEventListener('click',()=>{if($('modalWrap').classList.contains('show'))closeModal();else if(npcSpeech)closeDialogue();else if(nearNode)openNode(nodes().find(n=>n.id===nearNode.id));else if(nearNpc)openDialogue(nearNpc);else if(nearTerminal)openTerminal();else if(nearPortal)usePortal(nearPortal)});

 const joystick=$('joystick'),joystickKnob=$('joystickKnob');let joyId=null,joyVec={x:0,y:0};
 function setJoyFromEvent(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.31,l=Math.hypot(dx,dy)||1,s=Math.min(1,max/l);joyVec={x:dx/l*s,y:dy/l*s};joystickKnob.style.transform=`translate(calc(-50% + ${joyVec.x*max}px),calc(-50% + ${joyVec.y*max}px))`;keys.delete('arrowup');keys.delete('arrowdown');keys.delete('arrowleft');keys.delete('arrowright');if(joyVec.y<-.24)keys.add('arrowup');if(joyVec.y>.24)keys.add('arrowdown');if(joyVec.x<-.24)keys.add('arrowleft');if(joyVec.x>.24)keys.add('arrowright')}
 joystick.addEventListener('pointerdown',e=>{joyId=e.pointerId;joystick.setPointerCapture?.(e.pointerId);setJoyFromEvent(e);e.preventDefault()});joystick.addEventListener('pointermove',e=>{if(e.pointerId===joyId)setJoyFromEvent(e)});function releaseJoy(e){if(joyId!==null&&(e.pointerId===undefined||e.pointerId===joyId)){joyId=null;joyVec={x:0,y:0};joystickKnob.style.transform='translate(-50%,-50%)';['arrowup','arrowdown','arrowleft','arrowright'].forEach(k=>keys.delete(k))}}['pointerup','pointercancel'].forEach(ev=>joystick.addEventListener(ev,releaseJoy));

 $('cinematicNext').addEventListener('click',nextCinematic);

 $('endContinueBtn').addEventListener('click',closeEndScreen);
 $('endScreen').addEventListener('click',e=>{if(e.target===$('endScreen'))closeEndScreen()});

 $('terminalForm').addEventListener('submit',e=>{e.preventDefault();const input=$('terminalInput'),cmd=input.value.trim().toLowerCase(),out=$('terminalOutput');out.textContent+=`\nguest@matthis:~$ ${input.value}\n`;let response='';if(cmd==='help')response=t().help;else if(cmd==='whoami')response=t().whoami;else if(cmd==='skills')response='Python · PowerShell · Ansible · Power BI · Power Automate · Windows Server · Active Directory · Linux · Hyper-V · Proxmox VE · TCP/IP · VLAN · DNS · DHCP · OPNsense · SonarQube · SentinelOne · Tanium · Sekoia · Varonis · Wireshark · Nmap';else if(cmd==='experience')response=lang==='fr'?'AXA (sept. 2026 · juin 2027) · Axens (juin · août 2026) · Vinci Construction Grands Projets (août · oct. 2025)':'AXA (Sep 2026 · Jun 2027) · Axens (Jun · Aug 2026) · Vinci Construction Grands Projets (Aug · Oct 2025)';else if(cmd==='education')response=lang==='fr'?'Efrei · IPSSI · Piscine 42':'Efrei · IPSSI · 42 Piscine';else if(cmd==='contact')response=t().contact;else if(cmd==='coffee')response=lang==='fr'?'☕ Buff café activé : +10 motivation.':'☕ Coffee buff enabled: +10 motivation.';else if(cmd==='42')response='The answer is 42. Piscine cleared ✓';else if(cmd==='sudo hire matthis')response=lang==='fr'?'Permission accordée. Excellent choix de commande 😄':'Permission granted. Excellent command choice 😄';else if(cmd==='clear'){out.textContent='';input.value='';return}else if(cmd==='exit'){closeTerminal();return}else if(cmd)response=t().unknown;if(response)out.textContent+=response+'\n';input.value='';out.scrollTop=out.scrollHeight;beep(300,.03)});

 loadGame();setLang(lang);$('volumeSlider').value=Math.round(volume*100);$('volumeValue').textContent=`${Math.round(volume*100)}%`;$('rVolumeSlider').value=Math.round(volume*100);$('rVolumeValue').textContent=`${Math.round(volume*100)}%`;$('soundControl').classList.toggle('muted',!soundOn);$('rSoundControl').classList.toggle('muted',!soundOn);updateCollectiblesUI();renderAchievements();renderQuests();renderRecruiter();initVisitor();window.addEventListener('beforeunload',()=>saveGame(true));
})();