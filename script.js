/* ============================================================
   Andrew Mo — Wedding MC
   script.js
   - Loads testimonials.json (data-driven carousel tiles)
   - Falls back to inline data if fetch is blocked (e.g. when the
     page is opened directly via file:// instead of a local server)
   - Handles keyboard flip + arrow-key navigation for the carousel
   - Auto-rotates the carousel until the user interacts with a tile
   - Reveals the services tiles as they scroll into view
   - Handles the contact form
   ============================================================ */

(function () {
  "use strict";

  // Fire a GA4 event if gtag is loaded; no-op (and never throws) otherwise,
  // so tracking can never break the page for a visitor with an ad-blocker.
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  // Fallback copy of testimonials.json, kept in sync with that file.
  // Used only if fetch() fails (most commonly because the page was
  // opened directly from disk rather than served over http/https).
  var FALLBACK_TESTIMONIALS = [
    {
      id: "mc-1",
      image: "assets/images/mc-1.jpg",
      look: "Rust Windowpane Blazer",
      alt: "Andrew Mo in a rust windowpane check blazer speaking into a microphone at an outdoor marquee wedding",
      quote: "Thanks for helping us make the best memories!!",
      author: "@_jenclimbs_",
      rating: 5
    },
    {
      id: "mc-2",
      image: "assets/images/mc-2.jpg",
      look: "Burgundy Velvet Tuxedo",
      alt: "Andrew Mo in a burgundy velvet tuxedo and black bow tie, mic in hand on the dance floor",
      quote: "YOU'RE a blessing! Thanks for being THE BEST MC!",
      author: "@mingy14",
      rating: 5
    },
    {
      id: "mc-3",
      image: "assets/images/mc-3.jpg",
      look: "Camel Check Blazer",
      alt: "Andrew Mo in a camel check blazer and dark tie, speaking into a microphone at night",
      quote: "Thanks for all your help that day A Mo!",
      author: "@renelaguilar",
      rating: 5
    },
    {
      id: "mc-4",
      image: "assets/images/mc-4.jpg",
      look: "Sand Linen Blazer",
      alt: "Andrew Mo in a sand-toned linen blazer speaking into a microphone in front of a brick wall",
      quote: "Best MC thank you MO",
      author: "@Shirlayfuu",
      rating: 5
    },
    {
      id: "mc-5",
      image: "assets/images/mc-5.jpg",
      look: "Burgundy Velvet, Up Close",
      alt: "Close-up of Andrew Mo laughing mid-sentence into a microphone, wearing a burgundy velvet jacket",
      quote: "Cracker MC!!!",
      author: "@Jayli28_",
      rating: 5
    },
    {
      id: "mc-6",
      image: "assets/images/mc-6.jpg",
      look: "Sky Blue Blazer",
      alt: "Andrew Mo in a sky blue blazer speaking into a microphone in front of a wall of books",
      quote: "The best MC!!",
      author: "@reginacelee",
      rating: 5
    },
    {
      id: "mc-7",
      image: "assets/images/mc-7.jpg",
      look: "Black Shirt, No Jacket",
      alt: "Andrew Mo in a black shirt speaking into a microphone in front of a neon sign backdrop",
      quote: "He's actually funnier than he looks",
      author: "Random stranger",
      rating: 5
    }
  ];

  function starString(rating) {
    var filled = Math.max(0, Math.min(5, rating));
    var out = "";
    for (var i = 0; i < 5; i++) {
      if (i < filled) {
        out += '<span class="star-filled">\u2605</span>';
      } else {
        out += '<span class="star-empty">\u2606</span>';
      }
    }
    return out;
  }

  function attachTileInteractivity(li) {
    // Touch / keyboard support: toggle a class so devices without
    // hover (phones, tablets) can still see the back of the card.
    li.addEventListener("click", function () {
      li.classList.toggle("is-flipped");
    });

    li.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        li.classList.toggle("is-flipped");
      }
    });
  }

  function buildTile(item, index) {
    var li = document.createElement("li");
    li.className = "tile";
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");
    li.setAttribute(
      "aria-label",
      item.look + " look. Press Enter to read the testimonial from this couple."
    );
    li.dataset.index = String(index);

    li.innerHTML =
      '<div class="tile-inner">' +
        '<div class="tile-face tile-front">' +
          '<img src="' + item.image + '" alt="' + item.alt + '" loading="lazy">' +
        "</div>" +
        '<div class="tile-face tile-back" aria-hidden="true">' +
          '<div class="tile-back-bg" style="background-image:url(\'' + item.image + '\')"></div>' +
          '<div class="tile-back-scrim"></div>' +
          '<div class="tile-back-content">' +
            '<div class="stars">' + starString(item.rating) + "</div>" +
            "<blockquote>&ldquo;" + item.quote + "&rdquo;</blockquote>" +
            "<cite>" + item.author + "</cite>" +
          "</div>" +
        "</div>" +
      "</div>";

    attachTileInteractivity(li);
    return li;
  }

  function renderCarousel(items) {
    var track = document.getElementById("carouselTrack");
    if (!track) return;
    track.innerHTML = "";
    items.forEach(function (item, index) {
      track.appendChild(buildTile(item, index));
    });
    setupArrowKeyNavigation(track);
    setupCarouselAutoplay(track);
  }

  function enhanceServerRenderedCarousel(track) {
    // Server-side rendering (e.g. the Go SSR build) already outputs the
    // full tile markup in the initial HTML for SEO/no-JS reasons; here we
    // just wire up the same interactivity rather than rebuilding the DOM.
    track.querySelectorAll(".tile").forEach(function (li) {
      attachTileInteractivity(li);
    });
    setupArrowKeyNavigation(track);
    setupCarouselAutoplay(track);
  }

  function setupArrowKeyNavigation(track) {
    track.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      var tiles = Array.prototype.slice.call(track.querySelectorAll(".tile"));
      var current = document.activeElement;
      var idx = tiles.indexOf(current);
      if (idx === -1) return;
      e.preventDefault();
      var nextIdx = e.key === "ArrowRight"
        ? Math.min(idx + 1, tiles.length - 1)
        : Math.max(idx - 1, 0);
      tiles[nextIdx].focus();
      tiles[nextIdx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }

  function setupCarouselButtons() {
    var track = document.getElementById("carouselTrack");
    var prevBtn = document.getElementById("prevBtn");
    var nextBtn = document.getElementById("nextBtn");
    if (!track || !prevBtn || !nextBtn) return;

    var scrollAmount = function () {
      var tile = track.querySelector(".tile");
      var gap = 22;
      return tile ? tile.getBoundingClientRect().width + gap : 320;
    };

    prevBtn.addEventListener("click", function () {
      stopAutoplay();
      track.scrollBy({ left: -scrollAmount() * 2, behavior: "smooth" });
      trackEvent("testimonial_carousel_nav", { control: "prev" });
    });
    nextBtn.addEventListener("click", function () {
      stopAutoplay();
      track.scrollBy({ left: scrollAmount() * 2, behavior: "smooth" });
      trackEvent("testimonial_carousel_nav", { control: "next" });
    });
  }

  // ---------------- Carousel autoplay ----------------

  var autoplayTimer = null;

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function setupCarouselAutoplay(track) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var tileWidth = function () {
      var tile = track.querySelector(".tile");
      var gap = 22;
      return tile ? tile.getBoundingClientRect().width + gap : 320;
    };

    autoplayTimer = setInterval(function () {
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: tileWidth(), behavior: "smooth" });
      }
    }, 3800);

    // Any direct interaction with a card stops the rotation for good.
    var interactionEvents = ["pointerdown", "focusin", "touchstart", "wheel"];
    interactionEvents.forEach(function (evt) {
      track.addEventListener(evt, stopAutoplay, { passive: true });
    });
  }

  function loadTestimonials() {
    var track = document.getElementById("carouselTrack");
    if (track && track.querySelector(".tile")) {
      // Tiles are already in the HTML (server-rendered) — just enhance them.
      enhanceServerRenderedCarousel(track);
      return;
    }

    fetch("testimonials.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(function (data) {
        renderCarousel(data);
      })
      .catch(function () {
        // Likely opened via file:// where fetch of local JSON is blocked.
        renderCarousel(FALLBACK_TESTIMONIALS);
      });
  }

  function setupContactForm() {
    var form = document.getElementById("contactForm");
    var status = document.getElementById("formStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        status.textContent = "Please fill in your name and email so Andrew can reply.";
        return;
      }

      var action = form.getAttribute("action") || "";
      var name = document.getElementById("name").value.trim();

      status.textContent = "Sending\u2026";

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (response.ok) {
            status.textContent =
              "Thanks" + (name ? ", " + name : "") + "! Andrew will reply within two business days.";
            form.reset();
          } else {
            status.textContent = "Something went wrong sending that. Please try again or email Andrew directly.";
          }
        })
        .catch(function () {
          status.textContent = "Something went wrong sending that. Please try again or email Andrew directly.";
        });
    });
  }

  function setupParallaxLayers() {
    var layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var ticking = false;

    function update() {
      layers.forEach(function (layer) {
        var container = layer.parentElement;
        var rect = container.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          var offset = -rect.top * 0.18;
          layer.style.transform = "translate3d(0, " + offset + "px, 0)";
        }
      });
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  function setupScrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  function setupVendorCarousel() {
    var root = document.querySelector(".vendors-section");
    if (!root) return;

    var track = root.querySelector(".vendors-track");
    var viewport = root.querySelector(".vendors-viewport");
    var cards = Array.prototype.slice.call(root.querySelectorAll(".vendor-card"));
    var prev = root.querySelector(".vendors-arrow-prev");
    var next = root.querySelector(".vendors-arrow-next");
    var progress = root.querySelector(".vendors-progress span");
    var dots = root.querySelector(".vendors-dots");
    var count = root.querySelector(".vendors-count");
    if (!track || !viewport || !cards.length || !prev || !next || !progress || !dots || !count) return;

    // Click-through tracking: one delegated listener catches every vendor
    // Instagram handle and website link, however many cards there are.
    track.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || !track.contains(link)) return;
      var card = link.closest(".vendor-card");
      if (!card) return;
      var nameEl = card.querySelector("p");
      var vendorName = nameEl ? nameEl.textContent.trim() : "unknown";
      var linkType = link.classList.contains("vendor-handle") ? "instagram" : "website";
      trackEvent("vendor_link_click", {
        vendor_name: vendorName,
        link_type: linkType,
        link_url: link.href
      });
    });


    var current = 0;
    var visible = 4;
    var timer = null;
    var paused = false;
    var pageCount = 0;
    var pointerStartX = 0;
    var pointerId = null;
    var suppressClick = false;

    function visibleCount() {
      if (window.innerWidth <= 640) return 1;
      if (window.innerWidth <= 900) return 2;
      if (window.innerWidth <= 1100) return 3;
      return 4;
    }

    function maxIndex() {
      return Math.max(0, cards.length - visible);
    }

    function pad(n) {
      return (n < 10 ? "0" : "") + n;
    }

    function renderDots() {
      var nextPageCount = Math.ceil(cards.length / visible);
      if (nextPageCount === pageCount && dots.children.length === nextPageCount) return;
      pageCount = nextPageCount;
      dots.innerHTML = "";
      var i;
      for (i = 0; i < pageCount; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "vendors-dot";
        dot.dataset.page = String(i);
        dot.setAttribute("aria-label", "Show vendor page " + (i + 1));
        dot.addEventListener("click", function () {
          current = Math.min(Number(this.dataset.page) * visible, maxIndex());
          update();
          restart();
          trackEvent("vendor_carousel_nav", { control: "dot", page: Number(this.dataset.page) + 1 });
        });
        dots.appendChild(dot);
      }
    }

    function update() {
      visible = visibleCount();
      var width = cards[0].getBoundingClientRect().width;
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      if (current > maxIndex()) current = maxIndex();
      if (current < 0) current = 0;
      track.style.transform = "translateX(-" + (current * (width + gap)) + "px)";

      renderDots();
      var activePage = Math.floor(current / visible);
      var dotButtons = dots.querySelectorAll(".vendors-dot");
      var i;
      for (i = 0; i < dotButtons.length; i++) {
        var on = i === activePage;
        dotButtons[i].classList.toggle("is-active", on);
        if (on) dotButtons[i].setAttribute("aria-current", "true");
        else dotButtons[i].removeAttribute("aria-current");
      }

      count.textContent = pad(current + 1) + " / " + pad(cards.length);
      progress.style.width = ((Math.min(cards.length, current + visible) / cards.length) * 100) + "%";
      prev.disabled = current === 0;
      next.disabled = current === maxIndex();
    }

    function goNext() {
      current = current >= maxIndex() ? 0 : current + 1;
      update();
    }

    function goPrev() {
      current = current <= 0 ? maxIndex() : current - 1;
      update();
      restart();
    }

    function start() {
      if (timer) clearInterval(timer);
      timer = null;
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;
      timer = setInterval(function () {
        if (!paused) goNext();
      }, 5000);
    }

    function restart() {
      start();
    }

    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    root.addEventListener("focusin", function () { paused = true; });
    root.addEventListener("focusout", function (event) {
      if (!root.contains(event.relatedTarget)) paused = false;
    });

    prev.addEventListener("click", function () {
      goPrev();
      trackEvent("vendor_carousel_nav", { control: "prev" });
    });
    next.addEventListener("click", function () {
      goNext();
      restart();
      trackEvent("vendor_carousel_nav", { control: "next" });
    });

    viewport.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse") return;
      pointerStartX = event.clientX;
      pointerId = event.pointerId;
    });
    viewport.addEventListener("pointerup", function (event) {
      if (pointerId !== event.pointerId) return;
      var dx = event.clientX - pointerStartX;
      pointerId = null;
      if (Math.abs(dx) < 48) return;
      suppressClick = true;
      if (dx < 0) {
        goNext();
        restart();
        trackEvent("vendor_carousel_nav", { control: "swipe", direction: "next" });
      } else {
        goPrev();
        trackEvent("vendor_carousel_nav", { control: "swipe", direction: "prev" });
      }
    });
    viewport.addEventListener("click", function (event) {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
    viewport.addEventListener("pointercancel", function () { pointerId = null; });

    window.addEventListener("resize", update);
    update();
    start();
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadTestimonials();
    setupCarouselButtons();
    setupVendorCarousel();
    setupContactForm();
    setupParallaxLayers();
    setupScrollReveal();
  });
})();
