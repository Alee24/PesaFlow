// PWA Registration Script
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered:', registration);

            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show install button/banner
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'block';

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installButton.style.display = 'none';
            }
        });
    }
});

// Track if app was installed
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});

// Handle iOS standalone mode
if (window.navigator.standalone === true) {
    console.log('Running in iOS standalone mode');
}
