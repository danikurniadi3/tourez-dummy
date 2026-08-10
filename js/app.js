// TourEZ - Main Application Logic & Event Controller

document.addEventListener('DOMContentLoaded', () => {
  // App Global State
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
    pendingUpload: null // Holds photo scan result during Hero Flow
  };

  // --- 1. DOM Elements ---
  const views = {
    feed: document.getElementById('viewFeed'),
    map: document.getElementById('viewMap'),
    destinations: document.getElementById('viewDestinations'),
    passport: document.getElementById('viewPassport')
  };

  const navItems = document.querySelectorAll('.nav-item');
  const feedTabs = document.querySelectorAll('.feed-tab-btn');
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

  // --- 2. Tab Navigation ---
  function switchTab(tabName) {
    if (tabName === 'post') {
      openUploadModal();
      return;
    }

    state.currentTab = tabName;
    navItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    Object.keys(views).forEach(key => {
      if (key === tabName) {
        views[key].classList.add('active');
      } else {
        views[key].classList.remove('active');
      }
    });

    // Special Tab Initialization
    if (tabName === 'map') {
      initOrUpdateMap();
    } else if (tabName === 'passport') {
      renderPassport();
    } else if (tabName === 'destinations') {
      renderDestinations();
    } else if (tabName === 'feed') {
      renderFeed();
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  if (passportPill) {
    passportPill.addEventListener('click', () => switchTab('passport'));
  }

  // --- 3. Feed Controller ---
  feedTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      feedTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.feedFilter = btn.dataset.filter;
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
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fa-solid fa-compass" style="font-size: 3rem; margin-bottom: 12px; color: var(--primary-emerald);">
          </i>
          <p>Tidak ada unggahan yang sesuai pencarian "${state.searchQuery}".</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = filteredPosts.map(post => `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-user">
            <img src="${post.user.avatar}" class="post-user-avatar" alt="${post.user.name}">
            <div class="post-user-info">
              <h4>${post.user.name}</h4>
              <span>${post.timestamp}</span>
            </div>
          </div>
          <div class="post-ai-badge">
            <i class="fa-solid fa-wand-magic-sparkles"></i> ${post.verifiedBy}
          </div>
        </div>

        <div class="post-image-wrap">
          <img src="${post.image}" class="post-image" alt="${post.locationName}" loading="lazy">
          <div class="post-location-tag" onclick="window.viewDestinationDetail('${post.destinationId}')">
            <i class="fa-solid fa-location-dot"></i> ${post.locationName}
          </div>
          <div class="post-rating-badge">
            <i class="fa-solid fa-star"></i> ${post.rating}.0
          </div>
        </div>

        <div class="post-body">
          <p class="post-caption">${escapeHtml(post.caption)}</p>
          <div class="post-actions">
            <div class="action-group">
              <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="window.toggleLikePost('${post.id}')">
                <i class="fa-${post.isLiked ? 'solid' : 'regular'} fa-heart"></i>
                <span>${post.likes}</span>
              </button>
              <button class="action-btn" onclick="window.openCommentModal('${post.id}')">
                <i class="fa-regular fa-comment"></i>
                <span>${post.comments.length}</span>
              </button>
              <button class="action-btn" onclick="window.sharePost('${post.id}')">
                <i class="fa-regular fa-paper-plane"></i>
              </button>
            </div>
            <button class="action-btn ${post.isSaved ? 'saved' : ''}" onclick="window.toggleSavePost('${post.id}')" title="Simpan ke Bucket List">
              <i class="fa-${post.isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
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

  // --- 4. Interactive Map Controller ---
  function initOrUpdateMap() {
    if (state.leafletMap) {
      state.leafletMap.invalidateSize();
      return;
    }

    const mapElement = document.getElementById('leafletMap');
    if (!mapElement || typeof L === 'undefined') return;

    // Center of Indonesia (Yogyakarta / Central Java overview)
    state.leafletMap = L.map('leafletMap').setView([-7.7956, 110.3695], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | TourEZ AI'
    }).addTo(state.leafletMap);

    renderMapMarkers();
  }

  function renderMapMarkers() {
    if (!state.leafletMap) return;

    // Clear existing markers
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
            <div class="map-popup-category"><i class="fa-solid fa-tag"></i> ${dest.category} • ⭐ ${dest.rating}</div>
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

  // --- 5. Destination Catalog Controller ---
  function renderDestinations() {
    const grid = document.getElementById('destinationsGrid');
    if (!grid) return;

    grid.innerHTML = state.destinations.map(dest => `
      <div class="dest-card" onclick="window.viewDestinationDetail('${dest.id}')">
        <img src="${dest.image}" class="dest-card-img" alt="${dest.name}" loading="lazy">
        <div class="dest-card-content">
          <div class="dest-card-title">${dest.name}</div>
          <div class="dest-card-meta">
            <i class="fa-solid fa-location-dot" style="color: var(--primary-emerald);"></i> ${dest.locationName}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; background: rgba(255,255,255,0.08); padding: 4px 8px; border-radius: 8px;">
              ${dest.category}
            </span>
            <span style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700;">
              ⭐ ${dest.rating} (${dest.reviewCount})
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.viewDestinationDetail = function(destId) {
    const dest = state.destinations.find(d => d.id === destId);
    if (!dest) return;

    state.selectedDestination = dest;
    const modal = modals.destDetail;
    const body = document.getElementById('destDetailBody');

    body.innerHTML = `
      <div style="position: relative;">
        <img src="${dest.image}" style="width: 100%; height: 240px; object-fit: cover; border-radius: 16px 16px 0 0;" alt="${dest.name}">
        <div style="position: absolute; bottom: 12px; left: 16px; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); padding: 6px 14px; border-radius: 20px; color: #fff; font-weight: 700; font-size: 0.9rem;">
          <i class="fa-solid fa-star" style="color: var(--accent-gold);"></i> ${dest.rating} / 5.0 (${dest.reviewCount} ulasan)
        </div>
      </div>
      <div style="padding: 20px;">
        <h2 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 4px;">${dest.name}</h2>
        <p style="color: var(--primary-emerald); font-weight: 600; font-size: 0.9rem; margin-bottom: 14px;">
          <i class="fa-solid fa-location-dot"></i> ${dest.locationName}
        </p>
        
        <p style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 20px;">${dest.description}</p>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            <i class="fa-regular fa-clock" style="color: var(--accent-cyan);"></i>
            <strong>Jam Buka:</strong> ${dest.openingHours}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-ticket" style="color: var(--accent-gold);"></i>
            <strong>Tiket Masuk:</strong> ${dest.ticketPrice}
          </div>
        </div>

        <h4 style="font-size: 1rem; margin-bottom: 10px; color: var(--text-main);"><i class="fa-solid fa-lightbulb" style="color: var(--accent-gold);"></i> Tips Pengunjung:</h4>
        <ul style="padding-left: 20px; margin-bottom: 24px; color: var(--text-muted); font-size: 0.88rem;">
          ${dest.tips.map(t => `<li style="margin-bottom: 6px;">${t}</li>`).join('')}
        </ul>

        <div style="display: flex; gap: 12px;">
          <button class="btn-primary" style="flex: 1;" onclick="window.openGoogleMapsRoute(${dest.lat}, ${dest.lng})">
            <i class="fa-solid fa-route"></i> Petunjuk Arah (Maps)
          </button>
          <button class="btn-primary" style="background: linear-gradient(135deg, var(--accent-gold), #D97706); flex: 1;" onclick="window.addDestToBucketList('${dest.id}')">
            <i class="fa-solid fa-bookmark"></i> Simpan Bucket List
          </button>
        </div>
      </div>
    `;

    closeAllModals();
    modal.classList.add('active');
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

  // --- 6. Hero Flow: Upload & AI Location Recognition ---
  function openUploadModal() {
    closeAllModals();
    modals.upload.classList.add('active');
  }

  // Handle Photo Choice / Dropzone
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

    // Process image with EXIF & Visual AI Engine
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
        <div style="text-align: center; padding: 10px;">
          <img src="${upload.imageSrc}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 16px;">
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--primary-emerald); padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary-emerald); margin-bottom: 14px; font-size: 0.85rem;">
            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Confidence: ${res.primaryMatch.confidence}% (${res.primaryMatch.source})
          </div>
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">Apakah ini <span style="color: var(--primary-emerald);">${res.primaryMatch.dest.name}</span>?</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">Sistem AI & metadata EXIF membaca kecocokan visual lokasi secara presisi.</p>

          <div style="display: flex; gap: 12px;">
            <button class="btn-primary" onclick="window.confirmLocationChoice('${res.primaryMatch.dest.id}')">
              <i class="fa-solid fa-check"></i> Ya, Benar!
            </button>
            <button class="btn-primary" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: var(--text-main);" onclick="window.showCandidateOptions()">
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
      <div style="padding: 10px;">
        <h4 style="font-size: 1.1rem; margin-bottom: 12px;">Pilih Lokasi yang Sesuai:</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">AI mendeteksi beberapa opsi tempat pariwisata yang cocok:</p>

        ${candidates.map(c => `
          <div class="candidate-option" onclick="window.confirmLocationChoice('${c.dest.id}')">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${c.dest.image}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">${c.dest.name}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${c.dest.locationName}</div>
              </div>
            </div>
            <div style="font-weight: 800; color: var(--primary-emerald); font-size: 0.9rem;">
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
        <div style="display: flex; gap: 14px; margin-bottom: 16px;">
          <img src="${upload.imageSrc}" style="width: 110px; height: 110px; border-radius: 12px; object-fit: cover;">
          <div>
            <div style="font-size: 0.8rem; color: var(--primary-emerald); font-weight: 700;"><i class="fa-solid fa-location-dot"></i> Terverifikasi:</div>
            <h3 style="font-size: 1.1rem; font-weight: 800;">${dest.name}</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${dest.locationName}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Berikan Rating:</label>
          <div style="display: flex; gap: 8px; font-size: 1.4rem; color: var(--accent-gold); cursor: pointer;" id="starRatingPicker">
            <i class="fa-solid fa-star" data-val="1"></i>
            <i class="fa-solid fa-star" data-val="2"></i>
            <i class="fa-solid fa-star" data-val="3"></i>
            <i class="fa-solid fa-star" data-val="4"></i>
            <i class="fa-solid fa-star" data-val="5"></i>
          </div>
          <input type="hidden" id="postRatingInput" value="5">
        </div>

        <div class="form-group">
          <label class="form-label">Tulis Cerita / Caption:</label>
          <textarea class="form-textarea" id="postCaptionInput" rows="3" placeholder="Bagikan pengalamannya di ${dest.name}..." required></textarea>
        </div>

        <button type="submit" class="btn-primary">
          <i class="fa-solid fa-paper-plane"></i> Publikasikan Postingan & Dapatkan Stamp
        </button>
      </form>
    `;

    // Handle Star Rating Picker
    const stars = document.querySelectorAll('#starRatingPicker i');
    const ratingInput = document.getElementById('postRatingInput');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => {
        const val = index + 1;
        ratingInput.value = val;
        stars.forEach((s, idx) => {
          s.className = idx < val ? 'fa-solid fa-star' : 'fa-regular fa-star';
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

    // Add to state posts top
    state.posts.unshift(newPost);

    // Update Digital Stamps & Visited Places
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

    // Trigger Celebration Confetti if available
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    showToast(`🎉 Berhasil memposting! Stempel ${dest.name} telah ditambahkan ke Paspor Digital.`);
    switchTab('passport');
  };

  // --- 7. Digital Passport Controller ---
  function renderPassport() {
    const container = document.getElementById('passportContainer');
    if (!container) return;

    const prof = state.profile;

    container.innerHTML = `
      <div class="passport-hero">
        <div class="passport-user-bar">
          <img src="${prof.avatar}" class="passport-avatar-big" alt="${prof.name}">
          <div class="passport-details">
            <h2>${prof.name}</h2>
            <div style="font-size: 0.9rem; color: var(--primary-emerald); font-weight: 600;">${prof.handle} • ${prof.city}</div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${prof.bio}</p>
          </div>
        </div>

        <div class="passport-stats">
          <div class="stat-item">
            <div class="stat-value">${prof.visitedPlaces.length}</div>
            <div class="stat-label">Destinasi Dikunjungi</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${prof.digitalStamps.length}</div>
            <div class="stat-label">Digital Stamps</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${prof.badges.filter(b => b.unlocked).length}</div>
            <div class="stat-label">Lencana Terbuka</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${prof.bucketList.length}</div>
            <div class="stat-label">Bucket List</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 32px;">
        <h3 class="stamps-section-title">
          <i class="fa-solid fa-passport" style="color: var(--accent-gold);"></i> Koleksi Stempel Paspor Digital (${prof.digitalStamps.length})
        </h3>
        <div class="stamps-grid">
          ${prof.digitalStamps.map(s => `
            <div class="stamp-card">
              <div class="stamp-icon">${s.icon}</div>
              <div class="stamp-name">${s.name}</div>
              <div class="stamp-date">${s.date}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <h3 class="stamps-section-title">
          <i class="fa-solid fa-award" style="color: var(--primary-emerald);"></i> Lencana Prestasi (Badges)
        </h3>
        <div class="badges-grid">
          ${prof.badges.map(b => `
            <div class="badge-card ${b.unlocked ? '' : 'locked'}">
              <div class="badge-icon-box">${b.icon}</div>
              <div>
                <div style="font-weight: 700; font-size: 0.95rem;">${b.name}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${b.description}</div>
                <div style="font-size: 0.7rem; font-weight: 800; color: ${b.unlocked ? 'var(--accent-gold)' : 'var(--text-dim)'}; margin-top: 4px;">
                  ${b.unlocked ? 'UNLOCKED • ' + b.level : 'LOCKED'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 8. Comment Modal Controller ---
  window.openCommentModal = function(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const modal = modals.comment;
    const body = document.getElementById('commentModalBody');

    body.innerHTML = `
      <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Komentar (${post.comments.length})</h3>
      <div style="max-height: 250px; overflow-y: auto; margin-bottom: 16px;">
        ${post.comments.length === 0 ? '<p style="color: var(--text-muted);">Belum ada komentar. Jadilah yang pertama!</p>' : ''}
        ${post.comments.map(c => `
          <div style="background: rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 10px; margin-bottom: 8px;">
            <strong style="font-size: 0.85rem; color: var(--primary-emerald);">${c.user}:</strong>
            <span style="font-size: 0.88rem; color: var(--text-main); margin-left: 6px;">${escapeHtml(c.text)}</span>
          </div>
        `).join('')}
      </div>

      <form onsubmit="window.submitComment(event, '${post.id}')" style="display: flex; gap: 8px;">
        <input type="text" class="form-input" id="newCommentInput" placeholder="Tulis komentar..." required style="flex: 1;">
        <button type="submit" class="btn-primary" style="width: auto; padding: 0 18px;">
          Kirim
        </button>
      </form>
    `;

    closeAllModals();
    modal.classList.add('active');
  };

  window.submitComment = function(e, postId) {
    e.preventDefault();
    const input = document.getElementById('newCommentInput');
    const post = state.posts.find(p => p.id === postId);
    if (post && input.value.trim()) {
      post.comments.push({
        user: state.profile.name,
        text: input.value.trim()
      });
      openCommentModal(postId);
      renderFeed();
    }
  };

  // --- Helpers ---
  function closeAllModals() {
    Object.values(modals).forEach(m => {
      if (m) m.classList.remove('active');
    });
  }

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: rgba(17, 24, 39, 0.95); border: 1px solid var(--primary-emerald);
      color: #fff; padding: 12px 24px; border-radius: 30px; font-weight: 600;
      font-size: 0.9rem; z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: fadeIn 0.3s;
    `;
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Real-time Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.currentTab === 'feed') renderFeed();
    });
  }

  // Initial Load
  renderFeed();
});
