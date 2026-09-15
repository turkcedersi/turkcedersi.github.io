// Smart Board Touch Overlay Controls (Kapat, Küçült, Tam Ekran)
(function() {
  function initSmartBoardControls() {
    if (document.getElementById("sb-controls-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "sb-controls-overlay";
    overlay.className = "sb-controls-overlay";
    overlay.setAttribute("role", "toolbar");
    overlay.setAttribute("aria-label", "Akıllı Tahta Pencere Kontrolleri");

    overlay.innerHTML = `
      <!-- Simge Durumuna Küçült -->
      <button class="sb-btn" id="sb-btn-minimize" title="Simge Durumuna Küçült" aria-label="Küçült">
        <svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
        </svg>
      </button>

      <!-- Tam Ekran Aç / Kapat -->
      <button class="sb-btn" id="sb-btn-fullscreen" title="Tam Ekran Aç/Kapat" aria-label="Tam Ekran">
        <svg id="sb-icon-fs" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </button>

      <!-- Uygulamayı Kapat -->
      <button class="sb-btn sb-btn-close" id="sb-btn-close" title="Uygulamayı Kapat" aria-label="Kapat">
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    `;

    document.body.appendChild(overlay);

    const btnMinimize = document.getElementById("sb-btn-minimize");
    const btnFullscreen = document.getElementById("sb-btn-fullscreen");
    const btnClose = document.getElementById("sb-btn-close");

    // Kapatma
    btnClose.addEventListener("click", () => {
      if (window.electronAPI && typeof window.electronAPI.closeApp === "function") {
        window.electronAPI.closeApp();
      } else {
        window.close();
      }
    });

    // Küçültme
    btnMinimize.addEventListener("click", () => {
      if (window.electronAPI && typeof window.electronAPI.minimizeApp === "function") {
        window.electronAPI.minimizeApp();
      }
    });

    // Tam Ekran
    btnFullscreen.addEventListener("click", () => {
      if (window.electronAPI && typeof window.electronAPI.toggleFullscreen === "function") {
        window.electronAPI.toggleFullscreen();
      } else {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSmartBoardControls);
  } else {
    initSmartBoardControls();
  }
})();
