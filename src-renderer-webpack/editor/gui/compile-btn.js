// Dinso OS UEFI Editor - Compile Button
// Creates a floating compile button that writes main.c and runs build

import {genCC} from './codegen.js';

function installCompileButton() {
  const btn = document.createElement('div');
  btn.id = 'tw-c-compile-btn';
  btn.innerHTML = '<svg viewBox="0 0 16.63 17.5" width="20" height="22"><path d="M.75,2A6.44,6.44,0,0,1,8.44,2h0a6.44,6.44,0,0,0,7.69,0V12.4a6.44,6.44,0,0,1-7.69,0h0a6.44,6.44,0,0,0-7.69,0" fill="#4cbf56" stroke="#45993d" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><line x1="0.75" y1="16.75" x2="0.75" y2="0.75" stroke="#45993d" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>';
  btn.title = '编译 (Compile)';
  Object.assign(btn.style, {
    position: 'fixed', top: '52px', right: '12px', zIndex: '99999',
    width: '36px', height: '36px', cursor: 'pointer', borderRadius: '2px',
    background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
  });
  btn.onclick = function() {
    try {
      const fs = require('fs');
      const p = require('path');
      const cp = require('child_process');
      const cwd = require('process').cwd();
      const dir = p.join(cwd, 'c');
      try { fs.mkdirSync(dir); } catch(e) {}
      const code = genCC();
      if (code.indexOf('// no project') >= 0) { alert('没有项目 (No project)'); return; }
      fs.writeFileSync(p.join(dir, 'main.c'), code, 'utf8');
      cp.exec('cmd /c "' + p.join(dir, 'run.bat') + '"', {cwd: dir, windowsHide: true}, function(err, stdout, stderr) {
        if (err) {
          alert('编译失败！\n\n' + (stderr || stdout || err.message));
        }
      });
    } catch(e) { console.error(e); alert(e.message); }
  };
  document.body.appendChild(btn);
}

// Install eyedropper fake (prevent Scratch from opening native color picker)
function installEyedropperFake() {
  const fake = function(cb) { if (typeof cb === 'function') cb('#FFFFFF'); };
  function install() {
    const F = (window.Blockly && window.Blockly.FieldColourSlider) ||
            (window.ScratchBlocks && window.ScratchBlocks.FieldColourSlider);
    if (F && F.activateEyedropper_ !== fake) F.activateEyedropper_ = fake;
  }
  install();
  setInterval(install, 1000);
}

export {installCompileButton, installEyedropperFake};
