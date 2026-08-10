// TourEZ - Main Application Logic & Event Controller (Material Design UI)

document.addEventListener('DOMContentLoaded', () => {
  // =============================================
  // App Global State
  // =============================================
  const state = {
    currentTab: 'feed',
    feedFilter: 'trending',
    searchQuery: '',
    posts: window.INITIAL_POSTS || [],
    destinations: window.DESTINATIONS || [],
    profile: window.INITIAL_PROFILE || {},
    leafletMap: null,
    mapMarkers: [],
    selectedDestination: null,
    pendingUpload: null
  };

  // =============================================
  // 1. DOM Elements
  // =============================================
  const views = {
    feed: document.getElementById('viewFeed'),
    map: document.getElementById('viewMap'),
    destinations: document.getElementById('viewDestinations'),
    passport: document.getElementById('viewPassport')
  };

  // Desktop tabs (MDC Tab Bar)
  const desktopTabButtons = document.querySelectorAll('.tourez-main-nav .mdc-tab');
  // Mobile bottom nav
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  // Feed filter chips
  const feedChips = document.querySelectorAll('.feed-chip');
  const searchInput = document.getElementById('searchInput');
  const passportPill = document.getElementById('passportPill');

  // Modals
  const modals = {
    upload: document.getElementById('uploadModal'),
    radarScan: document.getElementById('radarScanModal'),
    locationConfirm: document.getElementById('locationConfirmModal'),
    destDetail: document.getElementById('destDetailModal'),
    comment: document.getElementById('commentModal')
  };

  // =============================================
  // 2. Initialize MDC Web Components
  // =============================================
  function initMDC() {
    // Top App Bar
    const topAppBarEl = document.getElementById('topAppBar');
    if (topAppBarEl && window.mdc) {
      window.mdc.topAppBar.MDCTopAppBar.attachTo(topAppBarEl);
    }

    // Text field (Search)
    const searchFieldEl = document.getElementById('searchField');
    if (searchFieldEl && window.mdc) {
      window.mdc.textField.MDCTextField.attachTo(searchFieldEl);
    }

    // Snackbar
    const snackbarEl = document.getElementById('tourezSnackbar');
    if (snackbarEl && window.mdc) {
      window._mdcSnackbar = window.mdc.snackbar.MDCSnackbar.attachTo(snackbarEl);
    }

    // Linear Progress (Radar scan)
    const progressEl = document.querySelector('.radar-progress');
    if (progressEl && window.mdc) {
      const lp = window.mdc.linearProgress.MDCLinearProgress.attachTo(progressEl);
      lp.open();
      window._mdcRadarProgress = lp;
    }

    // MDC Ripple on action elements
    document.querySelectorAll('.mdc-ripple-surface').forEach(el => {
      if (window.mdc) window.mdc.ripple.MDCRipple.attachTo(el);
    });

    // MDC Ripple on chips
    document.querySelectorAll('.mdc-chip').forEach(el => {
      if (window.mdc) window.mdc.ripple.MDCRipple.attachTo(el);
    });
  }

  // =============================================
  // 3. Tab Navigation
  // =============================================
  function switchTab(tabName) {
    if (tabName === 'post') {
      openUploadModal();
      return;
    }

    state.currentTab = tabName;

    // Update desktop tabs
    desktopTabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('mdc-tab--active', isActive);
      btn.setAttribute('aria-selected', isActive);
      const indicator = btn.querySelector('.mdc-tab-indicator');
      if (indicator) indicator.classList.toggle('mdc-tab-indicator--active', isActive);
    });

    // Update mobile bottom nav
    bottomNavItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Switch views
    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].classList.toggle('active', key === tabName);
      }
    });

    // Special tab initializations
    if (tabName === 'map') initOrUpdateMap();
    else if (tabName === 'passport') renderPassport();
    else if (tabName === 'destinations') renderDestinations();
    else if (tabName === 'feed') renderFeed();
  }

  // Bind desktop tabs
  desktopTabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Bind mobile bottom nav
  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  // Legacy nav-item support (if any)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  if (passportPill) {
    passportPill.addEventListener('click', () => switchTab('passport'));
  }

  // =============================================
  // 4. Feed Controller
  // =============================================
  feedChips.forEach(chip => {
    chip.addEventListener('click', () => {
      feedChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.feedFilter = chip.dataset.filter;
      renderFeed();
    });
  });

  function renderFeed() {
    const feedContainer = document.getElementById('feedGrid');
    if (!feedContainer) return;

    let filteredPosts = [...state.posts];

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(p =>
        p.locationName.toLowerCase().includes(q) ||
        p.caption.toLowerCase().includes(q) ||
        p.user.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (filteredPosts.length === 0) {
      feedContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--mdc-text-muted);">
          <span class="material-icons-round" style="font-size: 3.5rem; margin-bottom: 14px; color: var(--mdc-theme-primary); display: block;">explore_off</span>
          <p class="mdc-typography--body1">Tidak ada unggahan yang sesuai pencarian "<strong>${state.searchQuery}</strong>".</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = filteredPosts.map(post => `
      <div class="post-card mdc-card" data-post-id="${post.id}">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-user">
            <img src="${post.user.avatar}" class="post-user-avatar" alt="${post.user.name}">
            <div class="post-user-info">
              <h4>${post.user.name}</h4>
              <span>${post.timestamp}</span>
            </div>
          </div>
          <div class="post-ai-badge">
            <span class="material-icons-round">auto_fix_high</span>
            ${post.verifiedBy}
          </div>
        </div>

        <!-- Post Image -->
        <div class="post-image-wrap">
          <img src="${post.image}" class="post-image" alt="${post.locationName}" loading="lazy">
          <div class="post-location-tag" onclick="window.viewDestinationDetail('${post.destinationId}')">
            <span class="material-icons-round">location_on</span> ${post.locationName}
          </div>
          <div class="post-rating-badge">
            <span class="material-icons-round">star</span> ${post.rating}.0
          </div>
        </div>

        <!-- Post Body -->
        <div class="post-body">
          <p class="post-caption mdc-typography--body2">${escapeHtml(post.caption)}</p>
          <div class="post-actions">
            <div class="action-group">
              <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="window.toggleLikePost('${post.id}')" title="Suka">
                <span class="material-icons-round">${post.isLiked ? 'favorite' : 'favorite_border'}</span>
                <span>${post.likes}</span>
              </button>
              <button class="action-btn" onclick="window.openCommentModal('${post.id}')" title="Komentar">
                <span class="material-icons-round">chat_bubble_outline</span>
                <span>${post.comments.length}</span>
              </button>
              <button class="action-btn" onclick="window.sharePost('${post.id}')" title="Bagikan">
                <span class="material-icons-round">send</span>
              </button>
            </div>
            <button class="action-btn ${post.isSaved ? 'saved' : ''}" onclick="window.toggleSavePost('${post.id}')" title="Simpan ke Bucket List">
              <span class="material-icons-round">${post.isSaved ? 'bookmark' : 'bookmark_border'}</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach MDC Ripple to newly created action buttons
    if (window.mdc) {
      feedContainer.querySelectorAll('.mdc-ripple-surface').forEach(el => {
        window.mdc.ripple.MDCRipple.attachTo(el);
      });
    }
  }

  window.toggleLikePost = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (post) {
      post.isLiked = !post.isLiked;
      post.likes += post.isLiked ? 1 : -1;
      renderFeed();
    }
  };

  window.toggleSavePost = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (post) {
      post.isSaved = !post.isSaved;
      if (post.isSaved && !state.profile.bucketList.includes(post.destinationId)) {
        state.profile.bucketList.push(post.destinationId);
        showToast(`📍 ${post.locationName} ditambahkan ke Bucket List!`);
      }
      renderFeed();
    }
  };

  window.sharePost = function(postId) {
    showToast(`🔗 Link postingan berhasil disalin ke clipboard!`);
  };

  // =============================================
  // 5. Interactive Map Controller
  // =============================================
  function initOrUpdateMap() {
    if (state.leafletMap) {
      state.leafletMap.invalidateSize();
      return;
    }

    const mapElement = document.getElementById('leafletMap');
    if (!mapElement || typeof L === 'undefined') return;

    state.leafletMap = L.map('leafletMap').setView([-7.7956, 110.3695], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | TourEZ AI'
    }).addTo(state.leafletMap);

    renderMapMarkers();
  }

  function renderMapMarkers() {
    if (!state.leafletMap) return;

    state.mapMarkers.forEach(m => state.leafletMap.removeLayer(m));
    state.mapMarkers = [];

    state.destinations.forEach(dest => {
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<img src="${dest.image}" alt="${dest.name}">`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([dest.lat, dest.lng], { icon: customIcon }).addTo(state.leafletMap);

      const popupHtml = `
        <div class="map-popup-card">
          <img src="${dest.image}" class="map-popup-img" alt="${dest.name}">
          <div class="map-popup-info">
            <div class="map-popup-title">${dest.name}</div>
            <div class="map-popup-category"><span style="font-size:0.8rem">🏷️</span> ${dest.category} • ⭐ ${dest.rating}</div>
            <button class="btn-popup-detail" onclick="window.viewDestinationDetail('${dest.id}')">
              Lihat Detail Destinasi
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      state.mapMarkers.push(marker);
    });
  }

  // =============================================
  // 6. Destination Catalog Controller
  // =============================================
  function renderDestinations() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    grid.innerHTML = state.destinations.map(dest => `
      <div class="dest-card mdc-card" onclick="window.viewDestinationDetail('${dest.id}')">
        <img src="${dest.image}" class="dest-card-img" alt="${dest.name}" loading="lazy">
        <div class="dest-card-content">
          <div class="dest-card-title mdc-typography--subtitle1">${dest.name}</div>
          <div class="dest-card-meta">
            <span class="material-icons-round">location_on</span> ${dest.locationName}
          </div>
          <div class="dest-card-footer">
            <span class="dest-category-chip">${dest.category}</span>
            <span class="dest-rating">⭐ ${dest.rating} (${dest.reviewCount})</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.viewDestinationDetail = function(destId) {
    const dest = state.destinations.find(d => d.id === destId);
    if (!dest) return;

    state.selectedDestination = dest;
    const body = document.getElementById('destDetailBody');

    body.innerHTML = `
      <div style="position: relative;">
        <img src="${dest.image}" style="width: 100%; height: 240px; object-fit: cover; border-radius: 20px 20px 0 0; display: block;" alt="${dest.name}">
        <div style="position: absolute; bottom: 12px; left: 16px; background: rgba(0,0,0,0.72); backdrop-filter: blur(10px); padding: 6px 14px; border-radius: 20px; color: #fff; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
          <span class="material-icons-round" style="font-size: 1rem; color: #FBBF24;">star</span>
          ${dest.rating} / 5.0 (${dest.reviewCount} ulasan)
        </div>
      </div>
      <div style="padding: 22px;">
        <h2 class="mdc-typography--headline5" style="margin-bottom: 4px;">${dest.name}</h2>
        <p style="color: var(--mdc-theme-primary); font-weight: 600; font-size: 0.9rem; margin-bottom: 14px; display: flex; align-items: center; gap: 5px;">
          <span class="material-icons-round" style="font-size: 1rem;">location_on</span> ${dest.locationName}
        </p>
        <p class="mdc-typography--body1" style="margin-bottom: 20px; color: var(--mdc-theme-on-surface);">${dest.description}</p>

        <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
          <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;" class="mdc-typography--body2">
            <span class="material-icons-round" style="color: var(--mdc-accent-cyan);">schedule</span>
            <strong>Jam Buka:</strong> ${dest.openingHours}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;" class="mdc-typography--body2">
            <span class="material-icons-round" style="color: var(--mdc-accent-gold);">local_activity</span>
            <strong>Tiket Masuk:</strong> ${dest.ticketPrice}
          </div>
        </div>

        <h4 class="mdc-typography--subtitle2" style="margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <span class="material-icons-round" style="color: var(--mdc-accent-gold);">lightbulb</span> Tips Pengunjung:
        </h4>
        <ul style="padding-left: 20px; margin-bottom: 24px; color: var(--mdc-text-muted); font-size: 0.88rem;">
          ${dest.tips.map(t => `<li style="margin-bottom: 6px;">${t}</li>`).join('')}
        </ul>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn-primary" style="flex: 1; min-width: 140px;" onclick="window.openGoogleMapsRoute(${dest.lat}, ${dest.lng})">
            <span class="material-icons-round">directions</span> Petunjuk Arah
          </button>
          <button class="btn-primary btn-secondary" style="flex: 1; min-width: 140px; background: linear-gradient(135deg, var(--mdc-accent-gold), #D97706);" onclick="window.addDestToBucketList('${dest.id}')">
            <span class="material-icons-round">bookmark_add</span> Simpan Bucket List
          </button>
        </div>
      </div>
    `;

    closeAllModals();
    modals.destDetail.classList.add('active');
  };

  window.openGoogleMapsRoute = function(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  window.addDestToBucketList = function(destId) {
    const dest = state.destinations.find(d => d.id === destId);
    if (dest && !state.profile.bucketList.includes(destId)) {
      state.profile.bucketList.push(destId);
      showToast(`📍 ${dest.name} berhasil disimpan ke Bucket List!`);
    } else {
      showToast(`📍 Destinasi ini sudah ada di Bucket List kamu!`);
    }
  };

  // =============================================
  // 7. Hero Flow: Upload & AI Location Recognition
  // =============================================
  function openUploadModal() {
    closeAllModals();
    modals.upload.classList.add('active');
  }

  const photoOptions = document.querySelectorAll('.upload-sample-img');
  photoOptions.forEach(img => {
    img.addEventListener('click', () => {
      const src = img.getAttribute('src');
      startAiScanFlow(src);
    });
  });

  const fileInput = document.getElementById('photoFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          startAiScanFlow(evt.target.result, file);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  async function startAiScanFlow(imageSrc, fileObject = null) {
    closeAllModals();
    modals.radarScan.classList.add('active');

    const result = await window.ExifAiEngine.analyzePhoto(imageSrc, fileObject);
    state.pendingUpload = {
      imageSrc: imageSrc,
      aiResult: result,
      selectedDest: result.primaryMatch.dest
    };

    closeAllModals();
    showLocationConfirmationModal();
  }

  function showLocationConfirmationModal() {
    const modal = modals.locationConfirm;
    const body = document.getElementById('locationConfirmBody');
    const upload = state.pendingUpload;
    const res = upload.aiResult;

    if (res.isHighCertainty) {
      body.innerHTML = `
        <div style="text-align: center; padding: 8px 0;">
          <img src="${upload.imageSrc}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 14px; margin-bottom: 16px;">
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid var(--mdc-theme-primary); padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--mdc-theme-primary); margin-bottom: 16px; font-size: 0.85rem;">
            <span class="material-icons-round" style="font-size: 1rem;">auto_fix_high</span>
            AI Confidence: ${res.primaryMatch.confidence}% (${res.primaryMatch.source})
          </div>
          <h3 class="mdc-typography--headline6" style="margin-bottom: 10px;">Apakah ini <span style="color: var(--mdc-theme-primary);">${res.primaryMatch.dest.name}</span>?</h3>
          <p class="mdc-typography--body2" style="color: var(--mdc-text-muted); margin-bottom: 20px;">Sistem AI & metadata EXIF membaca kecocokan visual lokasi secara presisi.</p>
          <div style="display: flex; gap: 12px;">
            <button class="btn-primary" style="flex: 1;" onclick="window.confirmLocationChoice('${res.primaryMatch.dest.id}')">
              <span class="material-icons-round">check_circle</span> Ya, Benar!
            </button>
            <button class="btn-primary btn-secondary" style="flex: 1;" onclick="window.showCandidateOptions()">
              Ubah Lokasi
            </button>
          </div>
        </div>
      `;
    } else {
      window.showCandidateOptions();
    }

    modal.classList.add('active');
  }

  window.showCandidateOptions = function() {
    const body = document.getElementById('locationConfirmBody');
    const upload = state.pendingUpload;
    const candidates = upload.aiResult.allCandidates;

    body.innerHTML = `
      <div style="padding: 4px 0;">
        <h4 class="mdc-typography--subtitle1" style="margin-bottom: 10px;">Pilih Lokasi yang Sesuai:</h4>
        <p class="mdc-typography--body2" style="color: var(--mdc-text-muted); margin-bottom: 16px;">AI mendeteksi beberapa opsi tempat pariwisata yang cocok:</p>

        ${candidates.map(c => `
          <div class="candidate-option" onclick="window.confirmLocationChoice('${c.dest.id}')">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${c.dest.image}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;">
              <div>
                <div class="mdc-typography--subtitle2">${c.dest.name}</div>
                <div class="mdc-typography--caption" style="color: var(--mdc-text-muted);">${c.dest.locationName}</div>
              </div>
            </div>
            <div style="font-weight: 800; color: var(--mdc-theme-primary); font-size: 0.9rem; white-space: nowrap;">
              ${c.confidence}% Match
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  window.confirmLocationChoice = function(destId) {
    const dest = state.destinations.find(d => d.id === destId);
    if (!dest) return;
    state.pendingUpload.selectedDest = dest;
    renderPostFormModal();
  };

  function renderPostFormModal() {
    const body = document.getElementById('locationConfirmBody');
    const upload = state.pendingUpload;
    const dest = upload.selectedDest;

    body.innerHTML = `
      <form onsubmit="window.publishNewPost(event)">
        <div style="display: flex; gap: 14px; margin-bottom: 18px; align-items: flex-start;">
          <img src="${upload.imageSrc}" style="width: 100px; height: 100px; border-radius: 12px; object-fit: cover; flex-shrink: 0;">
          <div>
            <div class="mdc-typography--caption" style="color: var(--mdc-theme-primary); font-weight: 700; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <span class="material-icons-round" style="font-size: 0.9rem;">verified</span> Terverifikasi:
            </div>
            <div class="mdc-typography--subtitle1" style="font-weight: 800;">${dest.name}</div>
            <div class="mdc-typography--caption" style="color: var(--mdc-text-muted);">${dest.locationName}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Berikan Rating:</label>
          <div class="star-rating-row" id="starRatingPicker">
            <span class="material-icons-round" data-val="1">star</span>
            <span class="material-icons-round" data-val="2">star</span>
            <span class="material-icons-round" data-val="3">star</span>
            <span class="material-icons-round" data-val="4">star</span>
            <span class="material-icons-round" data-val="5">star</span>
          </div>
          <input type="hidden" id="postRatingInput" value="5">
        </div>

        <div class="form-group">
          <label class="form-label">Tulis Cerita / Caption:</label>
          <textarea class="form-textarea" id="postCaptionInput" rows="3" placeholder="Bagikan pengalamannya di ${dest.name}..." required></textarea>
        </div>

        <button type="submit" class="btn-primary">
          <span class="material-icons-round">send</span>
          Publikasikan Postingan & Dapatkan Stamp
        </button>
      </form>
    `;

    // Star Rating Picker
    const stars = document.querySelectorAll('#starRatingPicker .material-icons-round');
    const ratingInput = document.getElementById('postRatingInput');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        const val = index + 1;
        ratingInput.value = val;
        stars.forEach((s, idx) => {
          s.textContent = idx < val ? 'star' : 'star_border';
          s.style.color = idx < val ? 'var(--mdc-accent-gold)' : '#CBD5E1';
        });
      });
    });
  }

  window.publishNewPost = function(e) {
    e.preventDefault();
    const upload = state.pendingUpload;
    const dest = upload.selectedDest;
    const caption = document.getElementById('postCaptionInput').value;
    const rating = parseInt(document.getElementById('postRatingInput').value) || 5;

    const newPost = {
      id: "post_" + Date.now(),
      user: {
        name: state.profile.name,
        handle: state.profile.handle,
        avatar: state.profile.avatar
      },
      destinationId: dest.id,
      locationName: dest.name + ", " + dest.locationName.split(',')[0],
      image: upload.imageSrc,
      caption: caption,
      rating: rating,
      likes: 1,
      isLiked: true,
      isSaved: false,
      category: dest.category,
      verifiedBy: upload.aiResult.exif.hasExifGps ? "EXIF & AI Visual" : "AI Visual Recognition",
      timestamp: "Baru saja",
      comments: []
    };

    state.posts.unshift(newPost);

    if (!state.profile.visitedPlaces.includes(dest.id)) {
      state.profile.visitedPlaces.push(dest.id);
      state.profile.digitalStamps.push({
        id: "stamp_" + dest.id,
        name: dest.name,
        category: dest.category,
        icon: dest.stampBadge.split(' ')[0] || "📍",
        date: "Hari ini",
        image: upload.imageSrc
      });
    }

    closeAllModals();

    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    showToast(`🎉 Berhasil memposting! Stempel ${dest.name} telah ditambahkan ke Paspor Digital.`);
    switchTab('passport');
  };

  // =============================================
  // 8. Digital Passport Controller
  // =============================================
  function renderPassport() {
    const container = document.getElementById('passportContainer');
    if (!container) return;

    const prof = state.profile;

    container.innerHTML = `
      <div class="passport-hero mdc-card">
        <div class="passport-user-bar">
          <img src="${prof.avatar}" class="passport-avatar-big" alt="${prof.name}">
          <div class="passport-details">
            <h2>${prof.name}</h2>
            <div class="mdc-typography--body2" style="color: var(--mdc-theme-primary); font-weight: 600; margin-top: 4px;">
              ${prof.handle} • ${prof.city}
            </div>
            <p class="mdc-typography--body2" style="color: var(--mdc-text-muted); margin-top: 6px;">${prof.bio}</p>
          </div>
        </div>

        <div class="passport-stats">
          <div class="stat-item mdc-card">
            <div class="stat-value">${prof.visitedPlaces.length}</div>
            <div class="stat-label">Destinasi Dikunjungi</div>
          </div>
          <div class="stat-item mdc-card">
            <div class="stat-value">${prof.digitalStamps.length}</div>
            <div class="stat-label">Digital Stamps</div>
          </div>
          <div class="stat-item mdc-card">
            <div class="stat-value">${prof.badges.filter(b => b.unlocked).length}</div>
            <div class="stat-label">Lencana Terbuka</div>
          </div>
          <div class="stat-item mdc-card">
            <div class="stat-value">${prof.bucketList.length}</div>
            <div class="stat-label">Bucket List</div>
          </div>
        </div>
      </div>

      <!-- Stamps -->
      <div style="margin-bottom: 32px;">
        <h3 class="stamps-section-title">
          <span class="material-icons-round">card_travel</span>
          Koleksi Stempel Paspor Digital (${prof.digitalStamps.length})
        </h3>
        <div class="stamps-grid">
          ${prof.digitalStamps.map(s => `
            <div class="stamp-card mdc-card">
              <div class="stamp-icon">${s.icon}</div>
              <div class="stamp-name">${s.name}</div>
              <div class="stamp-date">${s.date}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Badges -->
      <div>
        <h3 class="stamps-section-title">
          <span class="material-icons-round" style="color: var(--mdc-theme-primary);">emoji_events</span>
          Lencana Prestasi (Badges)
        </h3>
        <div class="badges-grid">
          ${prof.badges.map(b => `
            <div class="badge-card mdc-card ${b.unlocked ? '' : 'locked'}">
              <div class="badge-icon-box">${b.icon}</div>
              <div>
                <div class="mdc-typography--subtitle2">${b.name}</div>
                <div class="mdc-typography--caption" style="color: var(--mdc-text-muted);">${b.description}</div>
                <div class="mdc-typography--caption" style="font-weight: 800; color: ${b.unlocked ? 'var(--mdc-accent-gold)' : 'var(--mdc-text-dim)'}; margin-top: 4px;">
                  ${b.unlocked ? '✅ UNLOCKED • ' + b.level : '🔒 LOCKED'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // =============================================
  // 9. Comment Modal Controller
  // =============================================
  window.openCommentModal = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const body = document.getElementById('commentModalBody');

    body.innerHTML = `
      <h3 class="mdc-typography--subtitle1" style="margin-bottom: 16px;">Komentar (${post.comments.length})</h3>
      <div style="max-height: 250px; overflow-y: auto; margin-bottom: 16px;">
        ${post.comments.length === 0
          ? '<p class="mdc-typography--body2" style="color: var(--mdc-text-muted);">Belum ada komentar. Jadilah yang pertama!</p>'
          : ''}
        ${post.comments.map(c => `
          <div style="background: #F0F9FF; border: 1px solid #E0F2FE; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px;">
            <strong class="mdc-typography--caption" style="color: var(--mdc-theme-primary);">${c.user}:</strong>
            <span class="mdc-typography--body2" style="margin-left: 6px;">${escapeHtml(c.text)}</span>
          </div>
        `).join('')}
      </div>

      <form onsubmit="window.submitComment(event, '${post.id}')" style="display: flex; gap: 8px;">
        <input type="text" class="form-input" id="newCommentInput" placeholder="Tulis komentar..." required style="flex: 1;">
        <button type="submit" class="btn-primary" style="width: auto; padding: 0 18px; flex-shrink: 0;">
          Kirim
        </button>
      </form>
    `;

    closeAllModals();
    modals.comment.classList.add('active');
  };

  window.submitComment = function(e, postId) {
    e.preventDefault();
    const input = document.getElementById('newCommentInput');
    const post = state.posts.find(p => p.id === postId);
    if (post && input.value.trim()) {
      post.comments.push({ user: state.profile.name, text: input.value.trim() });
      window.openCommentModal(postId);
      renderFeed();
    }
  };

  // =============================================
  // 10. Helpers
  // =============================================
  function closeAllModals() {
    Object.values(modals).forEach(m => {
      if (m) m.classList.remove('active');
    });
  }

  // Close buttons on all modals
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // Close on overlay click
  Object.values(modals).forEach(modalEl => {
    if (!modalEl) return;
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeAllModals();
    });
  });

  // MDC Snackbar-based toast
  function showToast(msg) {
    const snackbar = window._mdcSnackbar;
    if (snackbar) {
      const label = document.getElementById('snackbarLabel');
      if (label) label.textContent = msg;
      snackbar.open();
    } else {
      // Fallback plain toast
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed; bottom: 86px; left: 50%; transform: translateX(-50%);
        background: rgba(17, 24, 39, 0.96); border: 1px solid var(--mdc-theme-primary);
        color: #fff; padding: 12px 24px; border-radius: 30px; font-weight: 600;
        font-size: 0.9rem; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: fadeInView 0.3s; white-space: nowrap; max-width: 90vw; text-align: center;
      `;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3500);
    }
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g,
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Real-time Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.currentTab === 'feed') renderFeed();
    });
  }

  // =============================================
  // 11. Initial Load
  // =============================================
  initMDC();
  renderFeed();
});
