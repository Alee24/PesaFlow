// Actively unregister service workers to clear client-side cache issues and force fresh page loads
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
            registration.unregister();
            console.log('ServiceWorker unregistered successfully.');
        }
    });
}

// Clear all Cache Storage caches
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
            console.log('Cache cleared successfully:', name);
        }
    });
}
