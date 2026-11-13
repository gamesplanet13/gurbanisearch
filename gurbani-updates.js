/* Android app updates use the native downloader and package installer. */
(function () {
  'use strict';
  const button = document.getElementById('checkAppUpdate');
  const status = document.getElementById('appUpdateStatus');
  if (!button || !status) return;

  button.addEventListener('click', function () {
    if (window.GurbaniUpdates && typeof window.GurbaniUpdates.check === 'function') {
      window.GurbaniUpdates.check();
      return;
    }
    status.textContent = /[?&]app=/.test(location.search)
      ? 'Install the current Gurbani APK once to enable updates in this menu.'
      : 'Open this page in the Gurbani Android app to install updates.';
  });
})();
