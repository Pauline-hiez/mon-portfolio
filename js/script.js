// Vidéos des projets : lecture au survol (souris) ou avec le bouton (mobile, clavier)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
