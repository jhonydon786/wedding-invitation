import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { audioController } from './audioEffects.js';

export class InvitationUI {
  constructor(options = {}) {
    this.onReplayRequested = options.onReplayRequested || (() => {});

    this.heroSection = null;
    this.riveWrapper = null;
    this.cardContainer = null;
    this.interactiveCue = null;
    this.countdownTimer = null;
    this.weddingDate = new Date('2026-10-24T16:00:00');
    this.timeline = null;
  }

  init() {
    this.heroSection = document.getElementById('hero-section');
    this.riveWrapper = document.getElementById('rive-container');
    this.cardContainer = document.getElementById('invitation-card-container');
    this.interactiveCue = document.getElementById('interactive-cue');

    this.initCountdown();
    this.initRsvpModal();
    this.initCalendarButton();
    this.initReplayButton();
    this.initAudioToggle();
    this.initAmbientParticles();
    this.initGalleryLightbox();
  }

  // Called immediately when user clicks the envelope
  handleOpenTriggered() {
    if (this.interactiveCue) {
      gsap.to(this.interactiveCue, {
        opacity: 0,
        y: 10,
        duration: 0.4,
        ease: 'power2.out',
      });
    }

    // Gentle pulse on the container
    if (this.riveWrapper) {
      gsap.to(this.riveWrapper, {
        scale: 1.03,
        duration: 0.6,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      });
    }
  }

  // Called when envelope animation completes (~1.5s)
  handleOpenComplete() {
    // 1. Launch luxury gold & champagne confetti burst
    this.launchCelebratoryConfetti();

    // 2. Smoothly fade and shrink the envelope canvas
    gsap.to(this.heroSection, {
      opacity: 0,
      scale: 0.88,
      y: -30,
      duration: 1.1,
      ease: 'power3.inOut',
      onComplete: () => {
        if (this.heroSection) {
          this.heroSection.style.display = 'none';
        }
      },
    });

    // 3. Make the card container visible and animate in
    if (this.cardContainer) {
      this.cardContainer.style.display = 'flex';
      this.cardContainer.style.opacity = '1';

      // Create GSAP editorial reveal timeline
      this.timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      this.timeline
        .fromTo(
          '.invitation-card',
          { opacity: 0, y: 50, scale: 0.94, filter: 'blur(10px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.3 }
        )
        .fromTo(
          '.stagger-drift',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 },
          '-=0.8'
        )
        .fromTo(
          '.floating-control-bar',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        );
    }
  }

  // Elegant golden champagne confetti celebration
  launchCelebratoryConfetti() {
    const count = 100;
    const defaults = {
      origin: { y: 0.55 },
      colors: ['#D4AF37', '#F3E5AB', '#FAF8F5', '#E5C378', '#B76E79', '#FFFFFF'],
      disableForReducedMotion: true,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 45, scalar: 0.9 });
    fire(0.2, { spread: 60, scalar: 1.1 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 40 });
  }

  // Live countdown to October 24, 2026
  initCountdown() {
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');

    if (!daysEl) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = this.weddingDate.getTime() - now;

      if (distance < 0) {
        if (daysEl) daysEl.innerText = '00';
        if (hoursEl) hoursEl.innerText = '00';
        if (minsEl) minsEl.innerText = '00';
        if (secsEl) secsEl.innerText = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      daysEl.innerText = String(days).padStart(2, '0');
      hoursEl.innerText = String(hours).padStart(2, '0');
      minsEl.innerText = String(minutes).padStart(2, '0');
      secsEl.innerText = String(seconds).padStart(2, '0');
    };

    updateTimer();
    this.countdownTimer = setInterval(updateTimer, 1000);
  }

  // Interactive RSVP modal dialog
  initRsvpModal() {
    const rsvpBtn = document.getElementById('open-rsvp-btn');
    const modal = document.getElementById('rsvp-modal');
    const closeBtn = document.getElementById('close-rsvp-btn');
    const form = document.getElementById('rsvp-form');
    const toast = document.getElementById('rsvp-toast');

    if (!rsvpBtn || !modal) return;

    rsvpBtn.addEventListener('click', () => {
      modal.classList.add('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('guest-name');
        const guestName = nameInput ? nameInput.value.trim() : 'Guest';
        modal.classList.remove('active');

        // Show elegant confirmation toast
        if (toast) {
          toast.innerHTML = `<span>✨</span> Thank you, <strong>${guestName}</strong>! Your RSVP has been graciously received.`;
          toast.classList.add('visible');
          setTimeout(() => {
            toast.classList.remove('visible');
          }, 4500);
        }
        form.reset();
      });
    }
  }

  // Add to Calendar integration (.ics file generator and Google Calendar URL)
  initCalendarButton() {
    const calBtn = document.getElementById('calendar-btn');
    if (!calBtn) return;

    calBtn.addEventListener('click', () => {
      const title = encodeURIComponent('Wedding: Maria & Alexander');
      const location = encodeURIComponent('Villa Balbiano, Lake Como, Italy');
      const details = encodeURIComponent('Celebrating the marriage of Maria & Alexander. Reception to follow.');
      // ISO strings in UTC: Oct 24, 2026 14:00:00Z to Oct 24, 2026 23:00:00Z
      const dates = '20261024T140000Z/20261024T230000Z';
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

      // Open Google Calendar in new tab
      window.open(googleUrl, '_blank');
    });
  }

  // Replay Opening Animation
  initReplayButton() {
    const replayBtn = document.getElementById('replay-btn');
    if (!replayBtn) return;

    replayBtn.addEventListener('click', () => {
      if (this.timeline) {
        this.timeline.reverse();
      }

      gsap.to(this.cardContainer, {
        opacity: 0,
        y: 40,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          if (this.cardContainer) {
            this.cardContainer.style.display = 'none';
          }
          if (this.heroSection) {
            this.heroSection.style.display = 'flex';
            gsap.fromTo(
              this.heroSection,
              { opacity: 0, scale: 0.9, y: 30 },
              { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }
            );
          }
          if (this.interactiveCue) {
            gsap.to(this.interactiveCue, { opacity: 1, y: 0, duration: 0.6, delay: 0.3 });
          }

          // Trigger reset on Rive manager
          this.onReplayRequested();
        },
      });
    });
  }

  // Music toggle button
  initAudioToggle() {
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (!audioBtn) return;

    audioBtn.addEventListener('click', () => {
      const isPlaying = audioController.toggleAmbientMusic();
      audioBtn.classList.toggle('playing', isPlaying);
      const label = audioBtn.querySelector('.audio-label');
      if (label) {
        label.innerText = isPlaying ? 'Music: On' : 'Music: Off';
      }
    });
  }

  // Ambient floating dust particles in background
  initAmbientParticles() {
    const container = document.getElementById('ambient-particles');
    if (!container) return;

    for (let i = 0; i < 24; i++) {
      const particle = document.createElement('div');
      particle.className = 'ambient-dust';
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 12 + 10}s`;
      particle.style.animationDelay = `${Math.random() * 6}s`;
      container.appendChild(particle);
    }
  }

  // High-Resolution Editorial Lightbox viewer
  initGalleryLightbox() {
    const lightbox = document.getElementById('image-lightbox');
    const closeBtn = document.getElementById('close-lightbox-btn');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const backdrop = lightbox ? lightbox.querySelector('.lightbox-backdrop') : null;

    if (!lightbox) return;

    const galleryData = {
      portrait: {
        src: '/assets/images/couple-portrait.jpg',
        title: 'Maria Elizabeth Vance & Alexander Cole Wright',
        desc: 'Lake Como, Italy • Fine-art wedding editorial on the grand terrace balustrade.',
      },
      venue: {
        src: '/assets/images/villa-balbiano.jpg',
        title: 'Villa Balbiano • Lake Como Riviera',
        desc: 'A 16th-century historic palazzo overlooking Tremezzina, manicured Italian gardens, and Alpine peaks.',
      },
      reception: {
        src: '/assets/images/reception-ambiance.jpg',
        title: 'Dinner & Dancing Under the Stars',
        desc: 'An evening of candlelight, exquisite Italian gastronomy, Tuscan wines, and lakeside music.',
      },
    };

    const openLightbox = (key) => {
      const data = galleryData[key];
      if (!data) return;

      if (lightboxImg) {
        lightboxImg.src = data.src;
        lightboxImg.alt = data.title;
      }
      if (lightboxTitle) lightboxTitle.textContent = data.title;
      if (lightboxDesc) lightboxDesc.textContent = data.desc;

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    // Attach click triggers
    const triggerElements = document.querySelectorAll('[data-gallery]');
    triggerElements.forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-gallery');
        openLightbox(key);
      });

      // Keyboard accessibility (Enter / Space)
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const key = el.getAttribute('data-gallery');
          openLightbox(key);
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeLightbox);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // Fallback / Loader state visual feedback
  setLoaderState(state) {
    const loader = document.getElementById('rive-loader');
    const container = document.getElementById('rive-container');
    if (!loader) return;

    if (state === 'loading') {
      loader.classList.add('visible');
    } else if (state === 'loaded') {
      loader.classList.remove('visible');
      if (container) container.classList.add('ready');
    } else if (state === 'fallback') {
      loader.classList.remove('visible');
      if (container) container.classList.add('ready');
    }
  }

  cleanup() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }
}
