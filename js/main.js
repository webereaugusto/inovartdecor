(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  let headerScrolled = false;
  const setHeaderState = () => {
    if (!header) return;
    const next = window.scrollY > 12;
    if (next === headerScrolled) return;
    headerScrolled = next;
    header.classList.toggle("is-scrolled", next);
  };

  const closeNav = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-label", "Abrir menu");
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
    });
    navLinks.forEach((link) => link.addEventListener("click", closeNav));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  requestAnimationFrame(setHeaderState);
  let headerTick = false;
  window.addEventListener(
    "scroll",
    () => {
      if (headerTick) return;
      headerTick = true;
      requestAnimationFrame(() => {
        setHeaderState();
        headerTick = false;
      });
    },
    { passive: true }
  );

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          const line = entry.target.querySelector(".manifesto-line");
          if (line) line.classList.add("is-drawn");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => {
      el.classList.add("is-visible");
      const line = el.querySelector(".manifesto-line");
      if (line) line.classList.add("is-drawn");
    });
  }

  // Active nav section
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return null;
      const el = document.querySelector(id);
      return el ? { link, el } : null;
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(({ el }) => spy.observe(el));
  }

  // Stats counter
  const stats = document.querySelectorAll(".stat-num[data-count]");
  const animateCount = (el) => {
    const target = Number(el.getAttribute("data-count")) || 0;
    if (reduceMotion) {
      el.textContent = target.toLocaleString("pt-BR");
      return;
    }
    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString("pt-BR");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (stats.length && "IntersectionObserver" in window) {
    const statsIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          statsIo.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    stats.forEach((el) => statsIo.observe(el));
  } else {
    stats.forEach((el) => {
      el.textContent = Number(el.getAttribute("data-count") || 0).toLocaleString("pt-BR");
    });
  }

  // Gallery filters + progressive reveal
  const galleryFilters = document.querySelectorAll(".gallery-filter");
  const galleryItems = [...document.querySelectorAll(".gallery-grid .bento-item")];
  const galleryMore = document.getElementById("gallery-more");
  let galleryExpanded = false;
  let activeGalleryFilter = "todos";

  const syncGalleryVisibility = () => {
    const grid = document.querySelector(".gallery-grid");
    galleryItems.forEach((item) => {
      const cat = item.getAttribute("data-category");
      const match = activeGalleryFilter === "todos" || cat === activeGalleryFilter;
      const isMore = item.classList.contains("is-gallery-more");
      const show =
        match &&
        (galleryExpanded || activeGalleryFilter !== "todos" || !isMore);
      item.classList.toggle("is-hidden", !show);
    });
    if (grid) grid.classList.toggle("is-expanded", galleryExpanded || activeGalleryFilter !== "todos");
    if (galleryMore) {
      const hasMore = galleryItems.some((item) => item.classList.contains("is-gallery-more"));
      const showBtn = activeGalleryFilter === "todos" && hasMore && !galleryExpanded;
      galleryMore.hidden = !showBtn;
      galleryMore.setAttribute("aria-expanded", galleryExpanded ? "true" : "false");
    }
  };

  if (galleryFilters.length && galleryItems.length) {
    syncGalleryVisibility();
    galleryFilters.forEach((btn) => {
      btn.addEventListener("click", () => {
        activeGalleryFilter = btn.getAttribute("data-filter") || "todos";
        galleryFilters.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (activeGalleryFilter !== "todos") galleryExpanded = true;
        syncGalleryVisibility();
      });
    });
  }

  if (galleryMore) {
    galleryMore.addEventListener("click", () => {
      galleryExpanded = true;
      syncGalleryVisibility();
    });
  }

  // Lightbox
  const dialog = document.getElementById("lightbox");
  const dialogImg = document.getElementById("lightbox-img");
  const closeBtn = dialog ? dialog.querySelector(".lightbox-close") : null;

  document.querySelectorAll("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!dialog || !dialogImg) return;
      const src = btn.getAttribute("data-lightbox");
      const alt = btn.getAttribute("data-alt") || "";
      dialogImg.src = src;
      dialogImg.alt = alt;
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
  });

  if (closeBtn && dialog) {
    closeBtn.addEventListener("click", () => dialog.close());
  }
  if (dialog) {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  // Project gallery (Fusca etc.)
  const projectDialog = document.getElementById("project-gallery");
  const projectImg = document.getElementById("project-gallery-img");
  const projectCaption = document.getElementById("project-gallery-caption");
  const projectCounter = document.getElementById("project-gallery-counter");
  const projectDots = document.getElementById("project-gallery-dots");
  const projectTitle = document.getElementById("project-gallery-title");
  const projectClose = projectDialog
    ? projectDialog.querySelector(".project-gallery-close")
    : null;
  const projectPrev = projectDialog
    ? projectDialog.querySelector(".project-gallery-nav.is-prev")
    : null;
  const projectNext = projectDialog
    ? projectDialog.querySelector(".project-gallery-nav.is-next")
    : null;
  const projectCache = new Map();
  let projectImages = [];
  let projectIndex = 0;
  let projectBusy = false;
  let projectTouchX = null;

  // Inline fallback — fetch(manifest) falha em file://
  const PROJECT_GALLERIES = {
    "assets/fusca/manifest.json": {
      title: "Assento de Fusca",
      images: [
        { src: "assets/fusca/fusca-01.webp", alt: "Poltrona com assento de Fusca — vista frontal" },
        { src: "assets/fusca/fusca-02.webp", alt: "Poltrona Fusca — vista lateral" },
        { src: "assets/fusca/fusca-03.webp", alt: "Poltrona Fusca — ângulo especial" },
        { src: "assets/fusca/fusca-04.webp", alt: "Poltrona Fusca — revelando detalhes à esquerda" },
        { src: "assets/fusca/fusca-05.webp", alt: "Poltrona Fusca — revelando detalhes à direita" },
        { src: "assets/fusca/fusca-06.webp", alt: "Poltrona Fusca — detalhe da base e ambiente" },
        { src: "assets/fusca/fusca-07.webp", alt: "Poltrona Fusca — nova perspectiva" },
        { src: "assets/fusca/fusca-08.webp", alt: "Poltrona Fusca — close do acabamento" },
        { src: "assets/fusca/fusca-09.webp", alt: "Poltrona Fusca — macro da textura" },
      ],
    },
  };

  const loadProjectData = async (manifestUrl) => {
    if (projectCache.has(manifestUrl)) return projectCache.get(manifestUrl);
    if (PROJECT_GALLERIES[manifestUrl]) {
      projectCache.set(manifestUrl, PROJECT_GALLERIES[manifestUrl]);
      return PROJECT_GALLERIES[manifestUrl];
    }
    try {
      const res = await fetch(manifestUrl);
      if (!res.ok) return null;
      const data = await res.json();
      projectCache.set(manifestUrl, data);
      return data;
    } catch {
      return null;
    }
  };

  const renderProjectDots = () => {
    if (!projectDots) return;
    projectDots.innerHTML = "";
    projectImages.forEach((item, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Ir para foto ${i + 1}`);
      if (i === projectIndex) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", () => showProjectSlide(i));
      projectDots.appendChild(dot);
    });
  };

  const showProjectSlide = (index, { instant = false } = {}) => {
    if (!projectImg || !projectImages.length || projectBusy) return;
    const next = ((index % projectImages.length) + projectImages.length) % projectImages.length;
    if (next === projectIndex && projectImg.getAttribute("src") === projectImages[next].src) {
      return;
    }
    const item = projectImages[next];
    const apply = () => {
      projectIndex = next;
      projectImg.src = item.src;
      projectImg.alt = item.alt || "";
      if (projectCaption) projectCaption.textContent = item.alt || "";
      if (projectCounter) {
        projectCounter.textContent = `${next + 1} / ${projectImages.length}`;
      }
      if (projectDots) {
        [...projectDots.children].forEach((dot, i) => {
          if (i === next) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
      }
      projectImg.classList.remove("is-swap");
      projectBusy = false;
    };

    if (instant) {
      apply();
      return;
    }

    projectBusy = true;
    projectImg.classList.add("is-swap");
    window.setTimeout(apply, 220);
  };

  const openProjectGallery = async (manifestUrl) => {
    if (!projectDialog || typeof projectDialog.showModal !== "function") return;
    const data = await loadProjectData(manifestUrl);
    if (!data) return;
    projectImages = Array.isArray(data.images) ? data.images : [];
    if (!projectImages.length) return;
    if (projectTitle && data.title) projectTitle.textContent = data.title;
    projectIndex = -1;
    renderProjectDots();
    showProjectSlide(0, { instant: true });
    projectDialog.showModal();
    projectImages.slice(0, 3).forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  };

  document.querySelectorAll("[data-project-gallery]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-project-gallery");
      if (url) openProjectGallery(url);
    });
  });

  if (projectClose && projectDialog) {
    projectClose.addEventListener("click", () => projectDialog.close());
  }
  if (projectDialog) {
    projectDialog.addEventListener("click", (e) => {
      if (e.target === projectDialog) projectDialog.close();
    });
    projectDialog.addEventListener("keydown", (e) => {
      if (!projectDialog.open) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showProjectSlide(projectIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        showProjectSlide(projectIndex - 1);
      }
    });
  }
  if (projectPrev) {
    projectPrev.addEventListener("click", () => showProjectSlide(projectIndex - 1));
  }
  if (projectNext) {
    projectNext.addEventListener("click", () => showProjectSlide(projectIndex + 1));
  }
  if (projectImg) {
    projectImg.addEventListener("click", () => showProjectSlide(projectIndex + 1));
    projectImg.addEventListener(
      "touchstart",
      (e) => {
        projectTouchX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    projectImg.addEventListener(
      "touchend",
      (e) => {
        if (projectTouchX == null) return;
        const dx = e.changedTouches[0].clientX - projectTouchX;
        projectTouchX = null;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) showProjectSlide(projectIndex + 1);
        else showProjectSlide(projectIndex - 1);
      },
      { passive: true }
    );
  }

  // Lazy map
  const loadMapBtn = document.getElementById("load-map");
  const mapFrame = document.getElementById("map-frame");
  const mapPlaceholder = document.getElementById("map-placeholder");

  const loadMap = () => {
    if (!mapFrame || mapFrame.src) return;
    const src = mapFrame.getAttribute("data-src");
    if (!src) return;
    mapFrame.src = src;
    mapFrame.hidden = false;
    if (mapPlaceholder) mapPlaceholder.hidden = true;
  };

  if (loadMapBtn) loadMapBtn.addEventListener("click", loadMap);

  if (mapFrame && "IntersectionObserver" in window) {
    const mapIo = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMap();
          mapIo.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    mapIo.observe(mapFrame.parentElement || mapFrame);
  }

  // Soft parallax on hero visual (desktop only) — uses scrollY to avoid forced reflow
  const parallaxEl = document.querySelector("[data-parallax]");
  if (parallaxEl && !reduceMotion && !isMobile()) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const offset = Math.max(-24, Math.min(24, window.scrollY * 0.06));
        parallaxEl.style.transform = `translate3d(0, ${offset}px, 0)`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Background videos: reduced motion + invite play-on-view
  const heroVideo = document.querySelector(".hero-video");
  const inviteVideo = document.querySelector(".invite-video");

  if (reduceMotion) {
    [heroVideo, inviteVideo].forEach((video) => {
      if (!video) return;
      video.pause();
      video.removeAttribute("autoplay");
    });
  } else if (inviteVideo) {
    const playInvite = () => {
      const p = inviteVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playInvite();
              io.disconnect();
            }
          });
        },
        { rootMargin: "120px 0px", threshold: 0.15 }
      );
      io.observe(inviteVideo.closest(".project-invite") || inviteVideo);
    } else {
      playInvite();
    }
  }

  // Hero: load source after idle so poster wins LCP
  if (heroVideo && !reduceMotion) {
    const kickHero = () => {
      if (heroVideo.preload === "none") {
        heroVideo.preload = "metadata";
        heroVideo.load();
      }
      const p = heroVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(kickHero, { timeout: 1800 });
    } else {
      setTimeout(kickHero, 400);
    }
  }

  // Montagem: scroll-scrubbed WebP frame sequence
  const assembleSection = document.querySelector("#montagem");
  const assembleCanvas = document.querySelector(".assemble-canvas");
  const assembleFallback = document.querySelector(".assemble-fallback");
  if (assembleSection && assembleCanvas) {
    const ctx = assembleCanvas.getContext("2d", { alpha: false });
    const frameCache = new Map();
    let frameCount = 48;
    let framePad = 3;
    let framePrefix = "frame-";
    let frameExt = "webp";
    let basePath = "assets/montagem/";
    let currentIndex = -1;
    let ticking = false;
    let preloadStarted = false;

    const frameUrl = (i) => {
      const n = String(i + 1).padStart(framePad, "0");
      return `${basePath}${framePrefix}${n}.${frameExt}`;
    };

    const loadFrame = (i) =>
      new Promise((resolve) => {
        if (frameCache.has(i)) {
          resolve(frameCache.get(i));
          return;
        }
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          frameCache.set(i, img);
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = frameUrl(i);
      });

    const drawFrame = (img) => {
      if (!img || !ctx) return;
      const cw = assembleCanvas.width;
      const ch = assembleCanvas.height;
      ctx.fillStyle = "#090909";
      ctx.fillRect(0, 0, cw, ch);
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (cw - w) / 2;
      const y = (ch - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    };

    const assembleCopy = assembleSection.querySelector(".assemble-copy");
    const COPY_REVEAL_AT = 0.5;
    // Só trava nesta carga da página (sem sessionStorage).
    // Sair e voltar ao site = animação de novo.
    let assembleLocked = false;
    try {
      sessionStorage.removeItem("inovart-assemble-done");
    } catch {
      /* ignore */
    }

    const setCopyVisible = (visible) => {
      if (!assembleCopy) return;
      assembleCopy.classList.toggle("is-visible", visible);
    };

    const showIndex = async (index) => {
      const i = Math.max(0, Math.min(frameCount - 1, index));
      if (i === currentIndex) return;
      currentIndex = i;
      const img = await loadFrame(i);
      if (img && currentIndex === i) {
        drawFrame(img);
        assembleSection.classList.add("is-ready");
      }
      // Prefetch vizinhos (não baixa os 48 de uma vez)
      const radius = 5;
      for (let j = Math.max(0, i - radius); j <= Math.min(frameCount - 1, i + radius); j += 1) {
        if (!frameCache.has(j)) loadFrame(j);
      }
    };

    const syncProgress = () => {
      const rect = assembleSection.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progresso 0 quando a section surge na base da tela;
      // 1 quando o scrub sticky termina (topo = -(altura - vh)).
      const start = vh;
      const end = -(assembleSection.offsetHeight - vh);
      const span = start - end;
      let progress =
        span <= 0 ? 0 : Math.min(1, Math.max(0, (start - rect.top) / span));

      // Após completar uma vez nesta página, trava no frame final
      // (não rebobina ao subir o scroll). Reload = libera de novo.
      if (assembleLocked) {
        progress = 1;
      } else if (progress >= 0.99) {
        assembleLocked = true;
        progress = 1;
      }

      const index = Math.round(progress * (frameCount - 1));
      showIndex(index);
      setCopyVisible(progress >= COPY_REVEAL_AT);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncProgress();
        ticking = false;
      });
    };

    const preloadWarm = async () => {
      if (preloadStarted) return;
      preloadStarted = true;
      // Só os primeiros frames na aproximação; o resto vem sob demanda
      const warm = Math.min(8, frameCount);
      for (let i = 0; i < warm; i += 1) {
        await loadFrame(i);
        if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
      }
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = assembleCanvas.clientWidth || window.innerWidth;
      const h = assembleCanvas.clientHeight || window.innerHeight;
      assembleCanvas.width = Math.round(w * dpr);
      assembleCanvas.height = Math.round(h * dpr);
      if (currentIndex >= 0 && frameCache.has(currentIndex)) {
        drawFrame(frameCache.get(currentIndex));
      }
    };

    if (reduceMotion) {
      if (assembleFallback) {
        assembleFallback.src = frameUrl(frameCount - 1);
        assembleFallback.alt = "Poltrona montada — acabamento de ateliê InovArt";
      }
      assembleSection.classList.add("is-ready");
      setCopyVisible(true);
    } else {
      // Manifest é opcional (file:// bloqueia fetch); defaults já cobrem 48 frames
      fetch(`${basePath}manifest.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((manifest) => {
          if (manifest) {
            frameCount = Number(manifest.frames) || frameCount;
            framePad = Number(manifest.pad) || framePad;
            framePrefix = manifest.prefix || framePrefix;
            frameExt = manifest.ext || frameExt;
          }
        })
        .catch(() => {})
        .finally(() => {
          resizeCanvas();
          showIndex(0);
          syncProgress();
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", () => {
            resizeCanvas();
            syncProgress();
          }, { passive: true });

          if ("IntersectionObserver" in window) {
            const near = new IntersectionObserver(
              (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                  preloadWarm();
                  near.disconnect();
                }
              },
              { rootMargin: "40% 0px" }
            );
            near.observe(assembleSection);
          } else {
            preloadWarm();
          }
        });
    }
  }
})();
