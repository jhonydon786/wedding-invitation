import './style.css';
import { RiveManager } from './riveManager.js';
import { InvitationUI } from './invitationUI.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Initializing Wedding Invitation Application...');

  let riveManager = null;

  // Initialize the Invitation Card and UI manager
  const invitationUI = new InvitationUI({
    onReplayRequested: () => {
      console.log('[App] Replay requested: resetting Rive envelope state.');
      if (riveManager) {
        riveManager.reset();
      }
    },
  });

  invitationUI.init();

  // Initialize the Rive envelope manager
  riveManager = new RiveManager({
    canvasId: 'rive-canvas',
    containerId: 'rive-container',
    src: '/assets/envelope.riv',
    stateMachineName: 'State Machine 1',
    inputName: 'isOpen',
    onLoadState: (state) => {
      invitationUI.setLoaderState(state);
    },
    onOpenTriggered: () => {
      console.log('[App] Envelope opening animation triggered!');
      invitationUI.handleOpenTriggered();
    },
    onOpenComplete: () => {
      console.log('[App] Envelope opening complete — revealing wedding invitation card.');
      invitationUI.handleOpenComplete();
    },
  });

  riveManager.init();

  // Clean up Rive WebGL resources when page unloads to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if (riveManager) {
      riveManager.cleanup();
    }
    if (invitationUI) {
      invitationUI.cleanup();
    }
  });
});
