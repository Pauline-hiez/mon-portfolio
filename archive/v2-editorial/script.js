// Horloge : affiche l'heure de Paris
const clock = document.getElementById('clock');

const timeFormat = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
});

function updateClock() {
    clock.textContent = timeFormat.format(new Date()) + ' (Paris)';
}

updateClock();                      // Affichage immédiat
setInterval(updateClock, 30000);    // Toutes les 30 secondes

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

// Bouton mode clair / sombre
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

// Le thème réellement affiché : choix du visiteur, sinon réglage du système
function currentTheme() {
    return root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
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

// Si le visiteur change le réglage de son système pendant sa visite
systemDark.addEventListener('change', updateToggle);

updateToggle(); // état correct dès le chargement

// Marque-page : met en avant la section visible et fait avancer la barre de progression
const bookmarkLinks = document.querySelectorAll('.bookmark a');
const progressBar = document.querySelector('.progress');
// « Autres projets » fait partie du groupe Projets
const sectionToMark = { top: 'top', projets: 'projets', formation: 'projets', profil: 'profil', contact: 'contact' };

function markSection(id) {
    bookmarkLinks.forEach((link) => {
        if (link.dataset.section === sectionToMark[id]) {
            link.setAttribute('aria-current', 'true');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

if ('IntersectionObserver' in window) {
    // Une section est « courante » quand elle traverse la ligne située à 40 % de la hauteur de l'écran
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) markSection(entry.target.id);
        });
    }, { rootMargin: '-40% 0px -60% 0px' });

    Object.keys(sectionToMark).forEach((id) => {
        const section = document.getElementById(id);
        if (section) spy.observe(section);
    });
}

function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
}

window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

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
