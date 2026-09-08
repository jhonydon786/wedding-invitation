import * as rive from '@rive-app/canvas';
import { audioController } from './audioEffects.js';

export class RiveManager {
  constructor(options = {}) {
    this.canvasId = options.canvasId || 'rive-canvas';
    this.containerId = options.containerId || 'rive-container';
    this.src = options.src || '/assets/envelope.riv';
    this.stateMachineName = options.stateMachineName || 'State Machine 1';
    this.inputName = options.inputName || 'isOpen';
    this.onOpenTriggered = options.onOpenTriggered || (() => {});
    this.onOpenComplete = options.onOpenComplete || (() => {});
    this.onLoadState = options.onLoadState || (() => {});

    this.riveInstance = null;
    this.canvas = null;
    this.container = null;
    this.openTriggerInput = null;
    this.hasOpened = false;
    this.isLoaded = false;
    this.isFallbackActive = false;
    this.openTimeoutId = null;

    this.handleContainerClick = this.handleContainerClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  async init() {
    this.canvas = document.getElementById(this.canvasId);
    this.container = document.getElementById(this.containerId);

    if (!this.canvas || !this.container) {
      console.error('[RiveManager] Canvas or Container element not found.');
      this.activateFallback();
      return;
    }

    this.onLoadState('loading');
    this.container.addEventListener('click', this.handleContainerClick);
    window.addEventListener('resize', this.handleResize);

    try {
      // Configure high-DPI responsive canvas resolution
      this.resizeCanvas();

      this.riveInstance = new rive.Rive({
        src: this.src,
        canvas: this.canvas,
        autoplay: true,
        layout: new rive.Layout({
          fit: rive.Fit.Contain,
          alignment: rive.Alignment.Center,
        }),
        onLoad: () => {
          this.isLoaded = true;
          this.onLoadState('loaded');
          console.log('[RiveManager] .riv loaded successfully from', this.src);
          this.setupStateMachine();
        },
        onLoadError: (err) => {
          console.warn('[RiveManager] Failed to load .riv file or WebGL error:', err);
          this.activateFallback();
        },
        onStateChange: (event) => {
          console.log('[RiveManager] State changed:', event.data);
          // If the state machine signals an opened or finished state
          const stateNames = Array.isArray(event.data) ? event.data : [event.data];
          const hasOpenState = stateNames.some(s => 
            typeof s === 'string' && (s.toLowerCase().includes('open') || s.toLowerCase().includes('end') || s.toLowerCase().includes('reveal'))
          );
          if (hasOpenState && !this.hasOpened) {
            // Already handled via click trigger or synchronized timing
          }
        },
      });
    } catch (err) {
      console.error('[RiveManager] Unexpected error during Rive initialization:', err);
      this.activateFallback();
    }
  }

  setupStateMachine() {
    if (!this.riveInstance) return;

    try {
      // Get all available state machines
      const availableStateMachines = this.riveInstance.stateMachineNames || [];
      console.log('[RiveManager] Available state machines:', availableStateMachines);

      let targetStateMachine = this.stateMachineName;
      if (!availableStateMachines.includes(targetStateMachine) && availableStateMachines.length > 0) {
        console.warn(`[RiveManager] "${targetStateMachine}" not found. Falling back to: "${availableStateMachines[0]}"`);
        targetStateMachine = availableStateMachines[0];
      }

      if (targetStateMachine) {
        const inputs = this.riveInstance.stateMachineInputs(targetStateMachine) || [];
        console.log(`[RiveManager] State Machine "${targetStateMachine}" inputs:`, inputs.map(i => ({ name: i.name, type: i.type })));

        // Look for matching input: isOpen, Open, ClickToOpen, or any Trigger / Boolean
        this.openTriggerInput = inputs.find(i => 
          i.name.toLowerCase() === this.inputName.toLowerCase() ||
          i.name.toLowerCase() === 'open' ||
          i.name.toLowerCase() === 'isopen' ||
          i.name.toLowerCase().includes('click') ||
          i.name.toLowerCase().includes('trigger')
        );

        if (!this.openTriggerInput && inputs.length > 0) {
          // Default to the first trigger or boolean input available
          this.openTriggerInput = inputs.find(i => i.type === rive.StateMachineInputType.Trigger || i.type === rive.StateMachineInputType.Boolean) || inputs[0];
          console.log('[RiveManager] Selected best matching input:', this.openTriggerInput?.name);
        }
      }
    } catch (e) {
      console.warn('[RiveManager] Could not inspect state machine inputs:', e);
    }
  }

  resizeCanvas() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.floor(rect.width || 480);
    const height = Math.floor(rect.height || 480);

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.riveInstance && this.riveInstance.resizeDrawingSurfaceToCanvas) {
      this.riveInstance.resizeDrawingSurfaceToCanvas();
    }
  }

  handleResize() {
    this.resizeCanvas();
  }

  handleContainerClick(e) {
    if (this.hasOpened) return;
    this.triggerOpen();
  }

  triggerOpen() {
    if (this.hasOpened) return;
    this.hasOpened = true;

    // 1. Play paper-rustling sound effect
    audioController.playPaperRustle();

    // 2. Notify callback that envelope opening started
    this.onOpenTriggered();

    // 3. Fire Rive state machine input
    if (this.riveInstance && this.openTriggerInput) {
      console.log(`[RiveManager] Firing state machine input: "${this.openTriggerInput.name}"`);
      if (typeof this.openTriggerInput.fire === 'function') {
        this.openTriggerInput.fire();
      } else if ('value' in this.openTriggerInput) {
        this.openTriggerInput.value = true;
      }
    } else if (this.riveInstance) {
      // If no input was found but an animation exists, play "open" or primary animation
      try {
        const anims = this.riveInstance.animationNames || [];
        const openAnim = anims.find(a => a.toLowerCase().includes('open')) || anims[0];
        if (openAnim) {
          this.riveInstance.play(openAnim);
        }
      } catch (e) {
        console.warn('[RiveManager] Could not play animation fallback:', e);
      }
    }

    // 4. If running in fallback mode, trigger the CSS 3D envelope opening animation
    if (this.isFallbackActive) {
      const fallbackEnvelope = document.getElementById('fallback-envelope');
      if (fallbackEnvelope) {
        fallbackEnvelope.classList.add('opened');
      }
    }

    // 5. Synchronized transition to invitation reveal (1.5s animation duration)
    this.openTimeoutId = setTimeout(() => {
      audioController.playChime();
      this.onOpenComplete();
    }, 1500);
  }

  // Graceful fallback: renders a high-end luxury wax-sealed CSS/SVG 3D envelope
  activateFallback() {
    this.isFallbackActive = true;
    this.onLoadState('fallback');
    console.log('[RiveManager] Activating luxury interactive 3D envelope fallback.');

    if (this.canvas) {
      this.canvas.style.display = 'none';
    }

    const fallbackContainer = document.getElementById('fallback-envelope-container');
    if (fallbackContainer) {
      fallbackContainer.style.display = 'flex';
    }
  }

  // Reset the state to allow replaying the opening sequence
  reset() {
    this.hasOpened = false;
    if (this.openTimeoutId) {
      clearTimeout(this.openTimeoutId);
      this.openTimeoutId = null;
    }

    if (this.riveInstance && this.openTriggerInput) {
      if ('value' in this.openTriggerInput) {
        this.openTriggerInput.value = false;
      }
    }

    const fallbackEnvelope = document.getElementById('fallback-envelope');
    if (fallbackEnvelope) {
      fallbackEnvelope.classList.remove('opened');
    }
  }

  // Proper cleanup to prevent WebGL and memory leaks
  cleanup() {
    console.log('[RiveManager] Cleaning up Rive instance and listeners.');
    if (this.openTimeoutId) {
      clearTimeout(this.openTimeoutId);
    }
    if (this.container) {
      this.container.removeEventListener('click', this.handleContainerClick);
    }
    window.removeEventListener('resize', this.handleResize);

    if (this.riveInstance) {
      try {
        this.riveInstance.stop();
        this.riveInstance.cleanup();
      } catch (e) {
        console.warn('[RiveManager] Error during rive cleanup:', e);
      }
      this.riveInstance = null;
    }
  }
}
