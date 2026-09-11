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
    });
    nextBtn.addEventListener("click", function () {
      stopAutoplay();
      track.scrollBy({ left: scrollAmount() * 2, behavior: "smooth" });
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
      var name = document.getElementById("name").value.trim();
      status.textContent =
        "Thanks" + (name ? ", " + name : "") + " \u2014 this is a portfolio demo, so nothing was actually sent, " +
        "but on a live site Andrew would reply within two business days.";
      form.reset();
    });
  }

  function setupHeroParallax() {
    var heroBg = document.getElementById("heroBg");
    var hero = document.getElementById("top");
    if (!heroBg || !hero) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var ticking = false;

    function update() {
      var rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        var offset = -rect.top * 0.18;
        heroBg.style.transform = "translate3d(0, " + offset + "px, 0)";
      }
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

  document.addEventListener("DOMContentLoaded", function () {
    loadTestimonials();
    setupCarouselButtons();
    setupContactForm();
    setupHeroParallax();
    setupScrollReveal();
  });
})();
