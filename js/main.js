(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
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

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

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
})();
