/// Vidéos des projets : lecture au survol (souris) ou avec le bouton (mobile, clavier)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Appelée une fois les cartes construites
function setupProjectVideos() {
    const projectVideos = document.querySelectorAll('.project-card .demo');

    projectVideos.forEach((video) => {
        const screen = video.closest('.screen');
        const card = video.closest('.project-card');
        const button = screen.querySelector('.video-btn');
        const icon = button.querySelector('.play-icon');
        const playLabel = button.getAttribute('aria-label');
        const pauseLabel = playLabel.replace('Lire', 'Mettre en pause');

        // Le bouton suit l'état réel de la vidéo
        video.addEventListener('play', () => {
            // Une seule vidéo à la fois : on met les autres en pause
            projectVideos.forEach((other) => {
                if (other !== video) other.pause();
            });
            icon.textContent = '❚❚';
            button.setAttribute('aria-label', pauseLabel);
            screen.classList.add('is-playing');
        });

        video.addEventListener('pause', () => {
            icon.textContent = '▶';
            button.setAttribute('aria-label', playLabel);
            screen.classList.remove('is-playing');
        });

        // Bouton : lecture ou pause
        button.addEventListener('click', () => {
            if (video.paused) {
                video.play().catch(() => { }); // Ignore l'erreur si la lecture est refusée
            } else {
                video.pause();
            }
        });

        // Survol de la carte, seulement avec une vraie souris et sans « animations réduites »
        if (!reduceMotion) {
            card.addEventListener('pointerenter', (event) => {
                if (event.pointerType === 'mouse') video.play().catch(() => { });
            });
            card.addEventListener('pointerleave', (event) => {
                if (event.pointerType === 'mouse') video.pause();
            });
        }
    });
}

// Projets phares : cartes construites à partir de data/projets-phares.json (géré avec Pages CMS)
const projectList = document.querySelector('.project-list');
const projectTemplate = document.getElementById('project-template');

if (projectList && projectTemplate) {
    fetch('data/projets-phares.json')
        .then((response) => {
            if (!response.ok) throw new Error('Fichier introuvable');
            return response.json();
        })
        .then((projects) => {
            projects.forEach((project) => {
                const card = projectTemplate.content.cloneNode(true);
                const badge = card.querySelector('.badge');
                const video = card.querySelector('.demo');
                const button = card.querySelector('.video-btn');
                const tags = card.querySelector('.tags');
                const site = card.querySelector('.project-site');
                const code = card.querySelector('.project-code');

                card.querySelector('.project-title').textContent = project.titre;
                card.querySelector('.project-desc').textContent = project.description;

                // Badge facultatif
                if (project.badge) {
                    badge.textContent = project.badge;
                } else {
                    badge.remove();
                }

                // Vidéo et son bouton (retirés s'il n'y a pas de vidéo)
                if (project.video) {
                    video.src = project.video.replace(/^\//, '');
                    if (project.apercu) video.poster = project.apercu.replace(/^\//, '');
                    video.setAttribute('aria-label', project.demo || `Démonstration de ${project.titre}`);
                    button.setAttribute('aria-label', `Lire la démonstration de ${project.titre}`);
                } else {
                    video.remove();
                    button.remove();
                }

                // Une pastille par technologie
                (project.technos || []).forEach((techno) => {
                    const li = document.createElement('li');
                    li.textContent = techno;
                    tags.append(li);
                });

                // Liens facultatifs
                if (project.site) {
                    site.href = project.site;
                    site.querySelector('.project-site-label').textContent = project.libelle_site || 'Voir le site';
                } else {
                    site.remove();
                }

                if (project.code) {
                    code.href = project.code;
                } else {
                    code.remove();
                }

                projectList.append(card);
            });

            // Les vidéos existent maintenant : on peut brancher le survol et les boutons
            setupProjectVideos();
        })
        .catch((error) => console.error('Projets phares :', error));
}

// Autres projets : cartes construites à partir de data/autres-projets.json (géré avec Pages CMS)
const othersList = document.querySelector('.others-list');
const otherTemplate = document.getElementById('other-template');

if (othersList && otherTemplate) {
    fetch('data/autres-projets.json')
        .then((response) => {
            if (!response.ok) throw new Error('Fichier introuvable');
            return response.json();
        })
        .then((projects) => {
            projects.forEach((project) => {
                // Copie du modèle, puis remplissage
                const card = otherTemplate.content.cloneNode(true);
                const shot = card.querySelector('.other-shot');
                const thumb = card.querySelector('.other-thumb');
                const badge = card.querySelector('.badge');

                card.querySelector('a').href = project.lien;
                card.querySelector('.other-title').prepend(project.titre + ' ');
                card.querySelector('.other-desc').textContent = project.description;
                card.querySelector('.other-meta').textContent =
                    [project.technos, project.date].filter(Boolean).join(' — ');

                // Badge facultatif
                if (project.badge) {
                    badge.textContent = project.badge;
                } else {
                    badge.remove();
                }

                // Vignette : affichée une fois chargée
                if (project.image) {
                    thumb.addEventListener('load', () => shot.classList.add('is-ready'));
                    thumb.src = project.image.replace(/^\//, ''); // chemin relatif, pour GitHub Pages
                } else {
                    thumb.remove();
                }

                othersList.append(card);
            });
        })
        .catch((error) => console.error('Autres projets :', error));
}

// Compétences : catégories construites à partir de data/competences.json (géré avec Pages CMS)
const skillsGrid = document.querySelector('.skills-grid');
const skillTemplate = document.getElementById('skill-template');

if (skillsGrid && skillTemplate) {
    fetch('data/competences.json')
        .then((response) => {
            if (!response.ok) throw new Error('Fichier introuvable');
            return response.json();
        })
        .then((groups) => {
            groups.forEach((group) => {
                const block = skillTemplate.content.cloneNode(true);
                const list = block.querySelector('.tags');

                block.querySelector('h3').textContent = group.titre;

                (group.competences || []).forEach((skill) => {
                    const li = document.createElement('li');
                    li.textContent = skill.nom;

                    // Notions de base : pointillés + précision pour les lecteurs d'écran
                    if (skill.bases) {
                        li.classList.add('is-basic');
                        const hint = document.createElement('span');
                        hint.className = 'vh';
                        hint.textContent = ' (bases)';
                        li.append(hint);
                    }

                    list.append(li);
                });

                skillsGrid.append(block);
            });
        })
        .catch((error) => console.error('Compétences :', error));
}

// Bouton "Copier l'adresse"
const copyBtn = document.getElementById('copy-btn');
const emailLink = document.getElementById('email');
const copyStatus = document.getElementById('copy-status');
const copyLabel = copyBtn.textContent; // mémorise le texte d'origine
let copyTimer;

function showCopied() {
    copyBtn.textContent = 'Adresse copiée ✓';
    copyBtn.classList.add('is-done');
    copyStatus.textContent = 'Adresse email copiée dans le presse-papiers.';

    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
        copyBtn.textContent = copyLabel;
        copyBtn.classList.remove('is-done');
        copyStatus.textContent = '';
    }, 2500);
}

function copyWithSelection() {
    // Méthode de secours : sélectionner le texte puis lancer la commande « copier »
    const range = document.createRange();
    range.selectNodeContents(emailLink);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch (error) {
        copied = false;
    }

    if (copied) {
        selection.removeAllRanges();   // on retire la surbrillance
        showCopied();
    } else {
        copyStatus.textContent = 'Adresse sélectionnée : appuyez sur Ctrl+C pour la copier.';
    }
}

copyBtn.addEventListener('click', async () => {
    // 1re tentative : l'API moderne (pages sécurisées uniquement)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(emailLink.textContent);
            showCopied();
            return;
        } catch (error) {
            console.warn('Copie via navigator.clipboard impossible :', error);
        }
    }

    // 2e tentative : la méthode de secours
    copyWithSelection();
});

// Bouton mode clair / sombre (sombre par défaut)
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

// Le thème réellement affiché
function currentTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
}

// Met le bouton à jour : icône et texte pour les lecteurs d'écran
function updateToggle() {
    const theme = currentTheme();
    themeToggle.dataset.current = theme;
    themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'
    );
}

themeToggle.addEventListener('click', () => {
    const nextTheme = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;

    try {
        localStorage.setItem('theme', nextTheme);
    } catch (e) {
        // stockage indisponible : le choix vaudra jusqu'à la fermeture de la page
    }
    updateToggle();
});

updateToggle(); // état correct dès le chargement

// Court-métrage : modale
const filmDialog = document.getElementById('film-dialog');
const filmOpen = document.getElementById('film-open');
const filmClose = document.getElementById('film-close');
const filmVideo = document.getElementById('film-video');

if (filmDialog && filmOpen && filmClose && filmVideo) {
    // Ouvre la fenêtre pour lire la vidéo
    filmOpen.addEventListener('click', () => {
        filmDialog.showModal();
        filmVideo.play().catch(() => { }); // Ignore l'erreur si la lecture est refusée
    });

    // Fermer avec le bouton X
    filmClose.addEventListener('click', () => filmDialog.close());

    // Fermer en cliquant en dehors de la fenêtre
    filmDialog.addEventListener('click', (event) => {
        const box = filmDialog.getBoundingClientRect();
        const outside = event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom;
        if (outside) filmDialog.close();
    });

    filmDialog.addEventListener('close', () => filmVideo.pause());
}

// Bouton retour en haut de la page : visible après défilement
const toTop = document.querySelector('.to-top');

if (toTop) {
    function updateToTop() {
        toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
    }

    window.addEventListener('scroll', updateToTop, { passive: true });
    updateToTop();
}
