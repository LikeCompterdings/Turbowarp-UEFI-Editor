// Dinso OS UEFI Editor - Main entry point
// Imports CSS, waits for VM, registers extensions, installs compile button

import './uefi.css';
import {registerExtensions} from './uefi-blocks.js';
import {installCompileButton, installEyedropperFake} from './compile-btn.js';

function waitForVM(callback) {
  const timer = setInterval(function() {
    if (!window.ReduxStore) return;
    const store = window.ReduxStore;
    const vm = store.getState().scratchGui && store.getState().scratchGui.vm;
    if (!vm || !vm.runtime || !vm.extensionManager) return;
    clearInterval(timer);
    callback(vm);
  }, 500);
}

waitForVM(function(vm) {
  try {
    registerExtensions(vm);
    installCompileButton();
    installEyedropperFake();
  } catch(e) {
    console.error('UEFI extension error:', e);
  }
});
