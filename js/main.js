/* Elvin Kose · site interactions */

(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const navLinks = document.getElementById("navLinks");
  const burger = document.getElementById("burger");
  const finePointer = matchMedia("(pointer: fine)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero variant switch (a, b, c); ?hero=b in the URL previews a variant ---------- */
  const heroParam = new URLSearchParams(location.search).get("hero");
  if (heroParam && /^[abc]$/.test(heroParam)) document.body.dataset.hero = heroParam;

  /* Variant C: clip the bone copy of the name to the photo card's box, so the letters read
     bone over the photograph and ink outside it, crossing the rounded edge cleanly. */
  const heroStage = document.getElementById("heroStage");
  const heroCard = document.getElementById("heroCard");
  const heroFront = document.getElementById("heroFront");
  function clipHeroFront() {
    if (document.body.dataset.hero !== "c" || !heroStage || !heroCard || !heroFront) return;
    const s = heroStage.getBoundingClientRect();
    const c = heroCard.getBoundingClientRect();
    const r = Math.round(c.width * 0.09);
    heroFront.style.clipPath =
      "inset(" + Math.round(c.top - s.top) + "px " + Math.round(s.right - c.right) + "px " +
      Math.round(s.bottom - c.bottom) + "px " + Math.round(c.left - s.left) + "px round " + r + "px)";
  }
  clipHeroFront();
  window.addEventListener("resize", clipHeroFront);
  window.addEventListener("load", clipHeroFront);

  /* ---------- Spotlight: the photograph sits in the dark and a soft circle of light follows
     the cursor while it is over the photograph; anywhere else the light rests on her face,
     and it glides back there when the cursor leaves. Mouse only; phones keep the plain photo ---------- */
  if (heroCard && finePointer && !reducedMotion) {
    document.body.classList.add("has-spot");
    const rest = { x: 48, y: 21 }; /* her face, in percent of the card */
    const pos = { x: rest.x, y: rest.y };
    let target = { x: rest.x, y: rest.y };
    let spotFrame = 0;
    const glide = () => {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      heroCard.style.setProperty("--spot-x", pos.x.toFixed(2) + "%");
      heroCard.style.setProperty("--spot-y", pos.y.toFixed(2) + "%");
      spotFrame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.05 ? requestAnimationFrame(glide) : 0;
    };
    const aim = (x, y) => {
      target = { x, y };
      if (!spotFrame) spotFrame = requestAnimationFrame(glide);
    };
    heroCard.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const box = heroCard.getBoundingClientRect();
      aim(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
    });
    heroCard.addEventListener("pointerleave", () => aim(rest.x, rest.y));
  }

  /* Gentle depth follows the pointer; touch retains normal scrolling and tapping. */
  if (heroStage && finePointer && !reducedMotion) {
    let frame = 0;
    let x = 0;
    let y = 0;
    const render = () => {
      heroStage.style.setProperty("--hero-x", x + "px");
      heroStage.style.setProperty("--hero-y", y + "px");
      frame = 0;
    };
    heroStage.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || document.body.dataset.hero === "c") return;
      const box = heroStage.getBoundingClientRect();
      x = ((event.clientX - box.left) / box.width - 0.5) * 20;
      y = ((event.clientY - box.top) / box.height - 0.5) * 14;
      if (!frame) frame = requestAnimationFrame(render);
    });
    const reset = () => {
      x = y = 0;
      if (frame) cancelAnimationFrame(frame);
      render();
    };
    heroStage.addEventListener("pointerleave", reset);
    window.addEventListener("resize", reset);
  }


  /* ---------- Nav background on scroll ---------- */
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    navLinks.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("is-menu-open", open);
    document.querySelectorAll("main, footer").forEach((el) => { el.inert = open; });
  }
  burger.addEventListener("click", () => setMenu(!navLinks.classList.contains("is-open")));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  nav.querySelector(".nav__brand").addEventListener("click", () => setMenu(false));
  document.addEventListener("keydown", (event) => {
    if (!navLinks.classList.contains("is-open")) return;
    if (event.key === "Escape") { setMenu(false); burger.focus(); }
    if (event.key === "Tab") {
      const stops = [...nav.querySelectorAll("a, button")];
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const menuQuery = matchMedia("(max-width: 1080px)");
  if (menuQuery.addEventListener) menuQuery.addEventListener("change", () => setMenu(false));
  else if (menuQuery.addListener) menuQuery.addListener(() => setMenu(false));


  /* ---------- Scroll reveal. The head script shows everything unless this part marks the
     page reveal-ready, so a script that fails before here never leaves the page blank;
     browsers without IntersectionObserver never mark it, so they simply show everything ---------- */
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    document.documentElement.classList.add("reveal-ready");

    /* ---------- Active nav link while scrolling ---------- */
    const linkFor = {};
    navLinks.querySelectorAll("a[href^='#']").forEach((a) => {
      linkFor[a.getAttribute("href").slice(1)] = a;
    });
    const setActive = (link) => navLinks.querySelectorAll("a").forEach((a) => a.classList.toggle("is-active", a === link));
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target.classList.contains("hero")) setActive(null);
          else if (linkFor[entry.target.id]) setActive(linkFor[entry.target.id]);
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    document.querySelectorAll("section[id], .hero").forEach((s) => activeObserver.observe(s));
    /* On tall screens the last section never reaches the band; at the page bottom it is the one in view */
    if (linkFor.contact) {
      window.addEventListener("scroll", () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) setActive(linkFor.contact);
      }, { passive: true });
    }
  }

  /* ---------- Theatre rows: only rows carrying a poster get a floating preview ---------- */
  const preview = document.getElementById("theatrePreview");
  if (preview && finePointer) {
    const img = preview.querySelector("img");
    let raf = null;
    let x = 0;
    let y = 0;
    const move = (e) => {
      x = e.clientX + 28;
      y = e.clientY - 120;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const w = preview.offsetWidth || 240;
        const h = preview.offsetHeight || 300;
        preview.style.left = Math.min(x, window.innerWidth - w - 16) + "px";
        preview.style.top = Math.max(12, Math.min(y, window.innerHeight - h - 12)) + "px";
        raf = null;
      });
    };
    document.querySelectorAll(".theatre__row[data-poster]").forEach((row) => {
      row.addEventListener("mouseenter", () => {
        img.src = row.dataset.poster;
        preview.classList.add("is-active");
      });
      row.addEventListener("mouseleave", () => preview.classList.remove("is-active"));
      row.addEventListener("mousemove", move);
    });
  }

  /* ---------- Hosted videos: pick the 1080 file on wide screens, the 720 file elsewhere ---------- */
  const saveData = navigator.connection && navigator.connection.saveData;
  const wantHigh = window.innerWidth >= 1100 && !saveData;
  document.querySelectorAll("video[data-src-720]").forEach((video) => {
    const high = video.getAttribute("data-src-1080");
    const src = wantHigh && high ? high : video.getAttribute("data-src-720");
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    const tile = video.closest(".tile--video");
    if (tile) {
      video.addEventListener("play", () => tile.classList.add("is-playing"));
      video.addEventListener("pause", () => tile.classList.remove("is-playing"));
      video.addEventListener("ended", () => tile.classList.remove("is-playing"));
    }
  });

  /* Pause any other playing video when one starts */
  const videos = [...document.querySelectorAll("video")];
  videos.forEach((v) =>
    v.addEventListener("play", () => videos.forEach((o) => { if (o !== v && !o.paused) o.pause(); }))
  );

  /* ---------- YouTube trailer: nothing loads from YouTube until the tile is clicked ---------- */
  document.querySelectorAll(".tile--yt[data-yt]").forEach((tile) => {
    tile.addEventListener("click", () => {
      videos.forEach((v) => { if (!v.paused) v.pause(); });
      const id = tile.dataset.yt;
      const frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1";
      frame.title = "Official trailer";
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.allowFullscreen = true;
      const holder = document.createElement("div");
      holder.className = "tile";
      holder.appendChild(frame);
      tile.replaceWith(holder);
      frame.focus();
    });
  });

  /* ---------- Vimeo players: nothing loads from Vimeo until the tile is pressed ---------- */
  document.querySelectorAll(".tile--vimeo[data-vimeo]").forEach((tile) => {
    tile.addEventListener("click", () => {
      const parts = tile.dataset.vimeo.split("/");
      const frame = document.createElement("iframe");
      frame.src = "https://player.vimeo.com/video/" + parts[0] + "?h=" + (parts[1] || "") + "&autoplay=1&title=0&byline=0&portrait=0&dnt=1";
      const name = tile.querySelector("strong");
      frame.title = (name && name.textContent) || tile.getAttribute("aria-label") || "Video";
      frame.allow = "autoplay; fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      const holder = document.createElement("div");
      holder.className = "tile";
      holder.appendChild(frame);
      tile.replaceWith(holder);
      frame.focus();
    });
  });

  /* ---------- Gallery lightbox with a carousel ---------- */
  const lb = document.getElementById("lightbox");
  const items = [...document.querySelectorAll(".g-item[data-full]")];
  if (lb && items.length) {
    const lbImg = document.getElementById("lbImg");
    const lbCounter = document.getElementById("lbCounter");
    const lbCredit = document.getElementById("lbCredit");
    const lbClose = document.getElementById("lbClose");
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");
    let index = 0;
    let opener = null;
    const cache = {};

    const srcFor = (it) => {
      if (window.innerWidth * (window.devicePixelRatio || 1) >= 1700) return it.dataset.full;
      const thumb = it.querySelector("img");
      const set = thumb && thumb.getAttribute("srcset");
      return (set && set.split(",").pop().trim().split(/\s+/)[0]) || it.dataset.full;
    };
    const preload = (i) => {
      const src = srcFor(items[(i + items.length) % items.length]);
      if (!cache[src]) { const im = new Image(); im.src = src; cache[src] = im; }
    };
    const show = (i, animate) => {
      index = (i + items.length) % items.length;
      const it = items[index];
      const thumb = it.querySelector("img");
      lbImg.classList.toggle("is-swapping", !animate || reducedMotion);
      lbImg.src = srcFor(it);
      lbImg.alt = thumb ? thumb.alt : "";
      lbCounter.textContent = (index + 1) + " / " + items.length;
      /* the credit comes from the photo's gallery block, so it always matches the grid */
      const credit = it.closest(".g-block") && it.closest(".g-block").querySelector(".g-block__credit");
      if (lbCredit) lbCredit.textContent = credit ? credit.textContent.trim() : "";
      preload(index + 1);
      preload(index - 1);
    };
    const open = (i, el) => {
      opener = el;
      lb.hidden = false;
      document.body.classList.add("is-locked");
      document.querySelectorAll("header, main, footer").forEach((el) => { el.inert = true; });
      show(i, true);
      lbClose.focus();
    };
    const close = () => {
      lb.hidden = true;
      document.body.classList.remove("is-locked");
      document.querySelectorAll("header, main, footer").forEach((el) => { el.inert = false; });
      lbImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; /* a blank placeholder, so the tag stays valid */
      if (opener) opener.focus();
    };

    items.forEach((it, i) => it.addEventListener("click", () => open(i, it)));
    lbClose.addEventListener("click", close);
    lbPrev.addEventListener("click", () => show(index - 1, false));
    lbNext.addEventListener("click", () => show(index + 1, false));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__stage")) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1, false);
      else if (e.key === "ArrowRight") show(index + 1, false);
    });

    /* Swipe */
    let touchX = null;
    lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(dx < 0 ? index + 1 : index - 1, false);
      touchX = null;
    }, { passive: true });
  }
})();
