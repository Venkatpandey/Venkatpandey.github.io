(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var menuButton = document.querySelector(".menu-button");
  var navigation = document.querySelector(".site-nav");
  var navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function closeMenu() {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = "Open navigation";
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  menuButton.addEventListener("click", function () {
    var open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.querySelector(".sr-only").textContent = open ? "Open navigation" : "Close navigation";
    navigation.classList.toggle("is-open", !open);
    document.body.classList.toggle("menu-open", !open);
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && navigation.classList.contains("is-open")) closeMenu();
  });

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  var revealItems = document.querySelectorAll(".reveal");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5%" });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  if ("IntersectionObserver" in window) {
    var sections = document.querySelectorAll("main section[id]");
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  var totalSlides = 28;
  var slidePaths = Array.from({ length: totalSlides }, function (_, index) {
    return "images/show/slide_(" + (index + 1) + ").jpg";
  });
  var slideshow = document.getElementById("slideshow");
  var stage = document.getElementById("slide-stage");
  var currentImage = document.getElementById("slide-current");
  var incomingImage = document.getElementById("slide-next");
  var numberLabel = document.getElementById("slide-number");
  var thumbnails = document.getElementById("thumbnail-strip");
  var previousButton = document.getElementById("previous-slide");
  var nextButton = document.getElementById("next-slide");
  var playButton = document.getElementById("toggle-play");
  var fullscreenButton = document.getElementById("toggle-fullscreen");
  var progressBar = document.getElementById("slide-progress-bar");
  var activeIndex = 0;
  var autoplayTimer;
  var isPaused = reducedMotion.matches;
  var transitionLocked = false;
  var pointerStartX = null;

  function padNumber(value) {
    return String(value).padStart(2, "0");
  }

  function makeThumbnail(source, index) {
    var button = document.createElement("button");
    var image = document.createElement("img");
    button.className = "thumbnail";
    button.type = "button";
    button.setAttribute("aria-label", "Show photograph " + (index + 1));
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    if (index === 0) button.classList.add("is-active");
    image.src = source;
    image.alt = "";
    image.loading = index < 4 ? "eager" : "lazy";
    image.decoding = "async";
    button.appendChild(image);
    button.addEventListener("click", function () { showSlide(index, index > activeIndex ? 1 : -1); });
    return button;
  }

  slidePaths.forEach(function (path, index) {
    thumbnails.appendChild(makeThumbnail(path, index));
  });

  function updateThumbnails() {
    Array.from(thumbnails.children).forEach(function (thumbnail, index) {
      var active = index === activeIndex;
      thumbnail.classList.toggle("is-active", active);
      thumbnail.setAttribute("aria-pressed", String(active));
      if (active) {
        var targetLeft = thumbnail.offsetLeft - (thumbnails.clientWidth - thumbnail.offsetWidth) / 2;
        thumbnails.scrollTo({ left: targetLeft, behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
    });
  }

  function startProgress() {
    clearTimeout(autoplayTimer);
    progressBar.classList.remove("is-running");
    void progressBar.offsetWidth;
    if (isPaused || document.hidden) return;
    progressBar.classList.add("is-running");
    autoplayTimer = window.setTimeout(function () { showSlide(activeIndex + 1, 1); }, 5000);
  }

  function showSlide(requestedIndex, direction) {
    if (transitionLocked || requestedIndex === activeIndex) return;
    var nextIndex = (requestedIndex + totalSlides) % totalSlides;
    transitionLocked = true;
    incomingImage.src = slidePaths[nextIndex];
    incomingImage.alt = "Travel photograph " + (nextIndex + 1) + " of " + totalSlides;
    incomingImage.style.transformOrigin = direction < 0 ? "left center" : "right center";

    function commitSlide() {
      incomingImage.classList.add("is-incoming");
      window.setTimeout(function () {
        currentImage.src = incomingImage.src;
        currentImage.alt = incomingImage.alt;
        incomingImage.classList.remove("is-incoming");
        incomingImage.removeAttribute("src");
        incomingImage.alt = "";
        activeIndex = nextIndex;
        numberLabel.textContent = padNumber(activeIndex + 1);
        updateThumbnails();
        transitionLocked = false;
        startProgress();
        var preload = new Image();
        preload.src = slidePaths[(activeIndex + 1) % totalSlides];
      }, reducedMotion.matches ? 20 : 820);
    }

    if (incomingImage.complete) commitSlide();
    else {
      incomingImage.onload = commitSlide;
      incomingImage.onerror = function () { transitionLocked = false; startProgress(); };
    }
  }

  function setPaused(paused) {
    isPaused = paused;
    playButton.setAttribute("aria-pressed", String(paused));
    playButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    startProgress();
  }

  previousButton.addEventListener("click", function () { showSlide(activeIndex - 1, -1); });
  nextButton.addEventListener("click", function () { showSlide(activeIndex + 1, 1); });
  playButton.addEventListener("click", function () { setPaused(!isPaused); });

  slideshow.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(activeIndex - 1, -1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showSlide(activeIndex + 1, 1); }
    if (event.key === " ") { event.preventDefault(); setPaused(!isPaused); }
  });

  stage.addEventListener("pointerdown", function (event) {
    pointerStartX = event.clientX;
  });
  stage.addEventListener("pointerup", function (event) {
    if (pointerStartX === null) return;
    var distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) < 45) return;
    showSlide(activeIndex + (distance < 0 ? 1 : -1), distance < 0 ? 1 : -1);
  });
  stage.addEventListener("pointercancel", function () { pointerStartX = null; });

  if (document.fullscreenEnabled) {
    fullscreenButton.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else slideshow.requestFullscreen();
    });
    document.addEventListener("fullscreenchange", function () {
      fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen slideshow" : "View slideshow fullscreen");
      fullscreenButton.querySelector("span").textContent = document.fullscreenElement ? "↙" : "↗";
    });
  } else {
    fullscreenButton.hidden = true;
  }

  document.addEventListener("visibilitychange", startProgress);
  setPaused(isPaused);
  document.getElementById("current-year").textContent = new Date().getFullYear();
}());
