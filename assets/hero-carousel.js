/**
 * Hero Carousel Component
 *
 * Custom element for a hero carousel with thumbnail navigation,
 * autoplay progress bars, and pause/play toggle.
 *
 * @typedef {Object} HeroCarouselRefs
 * @property {HTMLElement} slidesContainer - The slides wrapper
 * @property {HTMLElement[]} slides - Individual slide elements
 * @property {HTMLElement[]} thumbnails - Thumbnail buttons
 * @property {HTMLElement[]} progressBars - Progress bar fill elements
 * @property {HTMLButtonElement} pauseBtn - Pause/play toggle button
 */

class HeroCarouselComponent extends HTMLElement {
  /** @type {number|undefined} */
  #autoplayTimer = undefined;

  /** @type {number} */
  #currentIndex = 0;

  /** @type {boolean} */
  #isPaused = false;

  /** @type {boolean} */
  #wasManuallyPaused = false;

  /** @type {boolean} */
  #reducedMotion = false;

  /** @type {AbortController|null} */
  #abortController = null;

  /** @type {number} */
  #touchStartX = 0;

  /** @type {number} */
  #touchEndX = 0;

  connectedCallback() {
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    this.#currentIndex = 0;
    this.#updateSlide(0, false);

    if (this.autoplay && !this.#reducedMotion) {
      this.#startAutoplay();
    }

    this.#bindEvents(signal);
  }

  disconnectedCallback() {
    this.#stopAutoplay();
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  /** @returns {boolean} */
  get autoplay() {
    return this.getAttribute('data-autoplay') === 'true';
  }

  /** @returns {number} */
  get autoplaySpeed() {
    const speed = parseInt(this.getAttribute('data-autoplay-speed'), 10);
    return (isNaN(speed) ? 5 : speed) * 1000;
  }

  /** @returns {number} */
  get slideCount() {
    return this.querySelectorAll('[data-hero-slide]').length;
  }

  /**
   * Bind all event listeners
   * @param {AbortSignal} signal
   */
  #bindEvents(signal) {
    const thumbnails = this.querySelectorAll('[data-hero-thumbnail]');
    for (const thumb of thumbnails) {
      thumb.addEventListener('click', (e) => {
        const index = parseInt(thumb.getAttribute('data-hero-thumbnail'), 10);
        this.#goToSlide(index, true);
      }, { signal });
    }

    const pauseBtn = this.querySelector('[data-hero-pause]');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.#togglePause();
      }, { signal });
    }

    this.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.#goToSlide(this.#getPrevIndex(), true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.#goToSlide(this.#getNextIndex(), true);
      }
    }, { signal });

    this.addEventListener('touchstart', (e) => {
      this.#touchStartX = e.changedTouches[0].screenX;
    }, { passive: true, signal });

    this.addEventListener('touchend', (e) => {
      this.#touchEndX = e.changedTouches[0].screenX;
      this.#handleSwipe();
    }, { passive: true, signal });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.#pauseAutoplayTemporarily();
      } else if (!this.#wasManuallyPaused) {
        this.#resumeAutoplay();
      }
    }, { signal });

    this.addEventListener('mouseenter', () => {
      if (!this.#wasManuallyPaused && this.autoplay) {
        this.#pauseAutoplayTemporarily();
      }
    }, { signal });

    this.addEventListener('mouseleave', () => {
      if (!this.#wasManuallyPaused && this.autoplay) {
        this.#resumeAutoplay();
      }
    }, { signal });

    this.addEventListener('focusin', () => {
      if (!this.#wasManuallyPaused && this.autoplay) {
        this.#pauseAutoplayTemporarily();
      }
    }, { signal });

    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget) && !this.#wasManuallyPaused && this.autoplay) {
        this.#resumeAutoplay();
      }
    }, { signal });
  }

  #handleSwipe() {
    const diff = this.#touchStartX - this.#touchEndX;
    const threshold = 50;

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      this.#goToSlide(this.#getNextIndex(), true);
    } else {
      this.#goToSlide(this.#getPrevIndex(), true);
    }
  }

  /** @returns {number} */
  #getNextIndex() {
    return (this.#currentIndex + 1) % this.slideCount;
  }

  /** @returns {number} */
  #getPrevIndex() {
    return (this.#currentIndex - 1 + this.slideCount) % this.slideCount;
  }

  /**
   * Navigate to a specific slide
   * @param {number} index
   * @param {boolean} [userInitiated=false]
   */
  #goToSlide(index, userInitiated = false) {
    if (index === this.#currentIndex) return;
    if (index < 0 || index >= this.slideCount) return;

    this.#updateSlide(index, true);
    this.#currentIndex = index;

    if (userInitiated && this.autoplay && !this.#wasManuallyPaused) {
      this.#restartAutoplay();
    }
  }

  /**
   * Update slide visibility and progress bar
   * @param {number} index
   * @param {boolean} animate
   */
  #updateSlide(index, animate) {
    const slides = this.querySelectorAll('[data-hero-slide]');
    const thumbnails = this.querySelectorAll('[data-hero-thumbnail]');
    const progressBars = this.querySelectorAll('[data-hero-progress]');
    const container = this.querySelector('[data-hero-slides]');

    if (container) {
      if (animate && !this.#reducedMotion) {
        container.style.transition = 'transform 0.5s ease';
      } else {
        container.style.transition = 'none';
      }
      container.style.transform = `translateX(-${index * 100}%)`;
    }

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      if (i === index) {
        slide.setAttribute('aria-hidden', 'false');
        slide.removeAttribute('inert');
      } else {
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('inert', '');
      }
    }

    for (let i = 0; i < thumbnails.length; i++) {
      thumbnails[i].setAttribute('aria-selected', `${i === index}`);
      thumbnails[i].classList.toggle('hero-carousel__thumbnail--active', i === index);
    }

    for (let i = 0; i < progressBars.length; i++) {
      const bar = progressBars[i];
      bar.classList.remove('hero-carousel__progress-fill--active');
      bar.classList.remove('hero-carousel__progress-fill--done');
      bar.style.animationDuration = '';

      if (i < index) {
        bar.classList.add('hero-carousel__progress-fill--done');
      } else if (i === index && this.autoplay && !this.#isPaused && !this.#reducedMotion) {
        void bar.offsetWidth;
        bar.style.animationDuration = `${this.autoplaySpeed}ms`;
        bar.classList.add('hero-carousel__progress-fill--active');
      }
    }
  }

  #startAutoplay() {
    this.#stopAutoplay();
    this.#isPaused = false;

    this.#autoplayTimer = window.setInterval(() => {
      this.#goToSlide(this.#getNextIndex(), false);
      this.#resetProgressBar();
    }, this.autoplaySpeed);

    this.#resetProgressBar();
    this.#updatePauseButton();
    this.#updateAriaLive();
  }

  #stopAutoplay() {
    if (this.#autoplayTimer !== undefined) {
      clearInterval(this.#autoplayTimer);
      this.#autoplayTimer = undefined;
    }
  }

  #restartAutoplay() {
    this.#stopAutoplay();
    this.#resetProgressBar();
    if (this.autoplay && !this.#wasManuallyPaused && !this.#reducedMotion) {
      this.#autoplayTimer = window.setInterval(() => {
        this.#goToSlide(this.#getNextIndex(), false);
        this.#resetProgressBar();
      }, this.autoplaySpeed);
    }
  }

  #resetProgressBar() {
    const progressBars = this.querySelectorAll('[data-hero-progress]');
    for (let i = 0; i < progressBars.length; i++) {
      const bar = progressBars[i];
      bar.classList.remove('hero-carousel__progress-fill--active');
      bar.classList.remove('hero-carousel__progress-fill--done');
      bar.style.animationDuration = '';

      if (i < this.#currentIndex) {
        bar.classList.add('hero-carousel__progress-fill--done');
      } else if (i === this.#currentIndex && this.autoplay && !this.#isPaused && !this.#reducedMotion) {
        void bar.offsetWidth;
        bar.style.animationDuration = `${this.autoplaySpeed}ms`;
        bar.classList.add('hero-carousel__progress-fill--active');
      }
    }
  }

  #pauseAutoplayTemporarily() {
    this.#isPaused = true;
    this.#stopAutoplay();

    const bar = this.querySelectorAll('[data-hero-progress]')[this.#currentIndex];
    if (bar) {
      bar.style.animationPlayState = 'paused';
    }
    this.#updateAriaLive();
  }

  #resumeAutoplay() {
    if (this.#wasManuallyPaused || !this.autoplay) return;
    this.#isPaused = false;
    this.#restartAutoplay();
    this.#updateAriaLive();
  }

  #togglePause() {
    if (this.#wasManuallyPaused) {
      this.#wasManuallyPaused = false;
      this.#isPaused = false;
      this.#startAutoplay();
    } else {
      this.#wasManuallyPaused = true;
      this.#isPaused = true;
      this.#stopAutoplay();
      this.#clearAllProgressBars();
    }
    this.#updatePauseButton();
    this.#updateAriaLive();
  }

  #clearAllProgressBars() {
    const progressBars = this.querySelectorAll('[data-hero-progress]');
    for (const bar of progressBars) {
      bar.classList.remove('hero-carousel__progress-fill--active');
      bar.classList.remove('hero-carousel__progress-fill--done');
      bar.style.animationDuration = '';
      bar.style.animationPlayState = '';
    }
  }

  #updatePauseButton() {
    const btn = this.querySelector('[data-hero-pause]');
    if (!btn) return;

    const pauseIcon = btn.querySelector('[data-icon-pause]');
    const playIcon = btn.querySelector('[data-icon-play]');

    if (this.#isPaused || this.#wasManuallyPaused) {
      btn.setAttribute('aria-label', 'Start slide rotation');
      if (pauseIcon) pauseIcon.style.display = 'none';
      if (playIcon) playIcon.style.display = 'block';
    } else {
      btn.setAttribute('aria-label', 'Stop slide rotation');
      if (pauseIcon) pauseIcon.style.display = 'block';
      if (playIcon) playIcon.style.display = 'none';
    }
  }

  #updateAriaLive() {
    const liveRegion = this.querySelector('[data-hero-slides]');
    if (!liveRegion) return;

    liveRegion.setAttribute('aria-live', this.#isPaused || this.#wasManuallyPaused ? 'polite' : 'off');
  }
}

if (!customElements.get('hero-carousel-component')) {
  customElements.define('hero-carousel-component', HeroCarouselComponent);
}
