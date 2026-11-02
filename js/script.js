// Vidéos des projets
const videos = document.querySelectorAll('.demo');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Affiche la vidéo seulement si le fichier existe
videos.forEach((video) => {
    const screen = video.closest('.screen');

    function showVideo() {
        screen.classList.add('is-ready');
    }

    if (video.readyState >= 1) {
        showVideo();
    } else {
        video.addEventListener('loadedmetadata', showVideo);
    }

    // Animations réduites : pas de lecture auto, des boutlons de lecture à la place 
    if (reduceMotion) {
        video.controls = true;
    }
});

// 2. Lancer une vidéo quand elle est visible, sinon la mettre en pause
if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => { }); // Ignire l'erreur si pas de fichier
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.4 });

    videos.forEach((video) => observer.observe(video));
}

// Vignettes des "autres projets" : affichées seulement si l'image existe
const thumbs = document.querySelectorAll('.other-thumb');

thumbs.forEach((thumb) => {
    const shot = thumb.closest('.other-shot');

    function showThumb() {
        shot.classList.add('is-ready');
    }

    if (thumb.complete && thumb.naturalWidth > 0) {
        showThumb();
    } else {
        thumb.addEventListener('load', showThumb);
    }
});

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

// Navbar : se cache quand on descend, revient dès qu'on remonte
const siteHeader = document.querySelector('.site-header');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const goingDown = y > lastScrollY;

    // On ne la cache qu'après avoir dépassé sa hauteur, et on ignore les micro-mouvements
    if (goingDown && y > 120) {
        siteHeader.classList.add('is-hidden');
    } else if (!goingDown && lastScrollY - y > 4) {
        siteHeader.classList.remove('is-hidden');
    }
    lastScrollY = y;
}, { passive: true });

// Navigation au clavier : la navbar doit rester visible quand elle a le focus
siteHeader.addEventListener('focusin', () => siteHeader.classList.remove('is-hidden'));

// Apparitions au scroll : les blocs .reveal et les dessins .doodle se montrent en entrant à l'écran
const revealItems = document.querySelectorAll('.reveal, .doodle');

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    // Navigateur trop ancien : on montre tout directement
    revealItems.forEach((item) => item.classList.add('in'));
}

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
