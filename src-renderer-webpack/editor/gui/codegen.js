// Dinso OS UEFI Editor - C Code Generator
// Extracted from gui.html inline script for proper source tree integration

import GenCC from './gencc.js';

// ---- Scope variables ----
let _vm = null;
let _isoVars = {};
let _argTypeMap = null;
let _singleTask = false;

// ---- Helper functions ----

function sane(n) { return n.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1') || '_var'; }
function esc(s) { return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '') + '"'; }

function _igP(b, M) {
  return ig(b, 'PROCEDURE', M) || ig(b, 'custom_block', M);
}

function procName(b, M) {
  let m = b.mutation;
  if (!m && b.opcode === 'procedures_definition') {
    const p = _igP(b, M);
    if (p) m = p.mutation;
  }
  if (m && m.proccode) {
    let pc = m.proccode;
    pc = pc.replace(/%.?/g, '').replace(/\s+/g, '').replace(/[^a-zA-Z0-9_]/g, '_');
    return pc || '_proc';
  }
  const p = _igP(b, M);
  return p ? sane(fv(p, 'PROCEDURE')) : '';
}

function procArgs(m) {
  if (!m) return {ids:[], names:[], types:[]};
  const ids = JSON.parse(m.argumentids || '[]');
  const names = JSON.parse(m.argumentnames || '[]');
  const proccode = m.proccode || '';
  const types = [];
  let pi = 0;
  for (let i = 0; i < ids.length; i++) {
    const idx = proccode.indexOf('%', pi);
    if (idx >= 0 && idx + 1 < proccode.length) {
      types.push(proccode[idx + 1] === 's' ? 'str' : 'num');
      pi = idx + 2;
    } else {
      types.push('num');
    }
  }
  return {ids, names, types};
}

function varIsStr(name) {
  return name.indexOf('string_') === 0;
}

function toNum(e) {
  if (!e) return '0';
  if (e.t === 'num') return e.c;
  return '_atof(' + e.c + ')';
}

function parseColor(e) {
  let v = e && e.c !== undefined ? e.c : e;
  if (typeof v === 'number') return '0x' + ((v & 0xFFFFFF) >>> 0).toString(16).toUpperCase();
  v = String(v).trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(v)) return '0x' + v.toUpperCase();
  return '0xFFFFFF';
}

function toStr(e) {
  if (!e) return '""';
  if (e.t === 'str') return e.c;
  return '_num_to_str(' + e.c + ')';
}

function parseHexClr(b, n, M) {
  const h = sv(b, n + 'H', M);
  if (h) {
    const hv = String(h && h.c !== undefined ? h.c : h).trim();
    if (hv !== '' && hv !== '""') {
      if (/^"(.+)"$/.test(hv)) {
        const hx = hv.replace(/^"|"$/g, '').replace(/^#/, '');
        if (/^[0-9a-fA-F]{6}$/.test(hx)) return '0x' + hx.toUpperCase();
        if (/^[0-9a-fA-F]{3}$/.test(hx))
          return '0x' + hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2].toUpperCase();
      }
      return '_hex2u32(' + toStr(h) + ')';
    }
  }
  return parseColor(sv(b, n, M));
}

// ---- Input helpers ----

function sv(b, n, M) { return ev(b,n,M) || null; }

function ev(b, n, M) {
  if (!b.inputs || !b.inputs[n]) return null;
  const inp = b.inputs[n];
  if (Array.isArray(inp)) {
    if (inp[1] && typeof inp[1] === 'string' && M[inp[1]]) return xv(M[inp[1]], M);
    if (inp[2] && typeof inp[2] === 'string' && M[inp[2]]) return xv(M[inp[2]], M);
    if (Array.isArray(inp[1]) && inp[1][1] !== undefined)
      return {c: String(inp[1][1]), t: 'num'};
    if (Array.isArray(inp[2]) && inp[2][1] !== undefined)
      return {c: String(inp[2][1]), t: 'num'};
    return null;
  }
  const blockId = inp.block;
  if (blockId && typeof blockId === 'string' && M[blockId]) return xv(M[blockId], M);
  const shadowId = inp.shadow;
  if (shadowId) {
    if (typeof shadowId === 'string' && M[shadowId]) return xv(M[shadowId], M);
    if (typeof shadowId === 'object') return xv(shadowId, M);
  }
  if (inp.value !== undefined) return {c: String(inp.value), t: 'num'};
  return null;
}

function ig(b, n, M) {
  if (!b.inputs || !b.inputs[n]) return null;
  const inp = b.inputs[n];
  if (Array.isArray(inp)) {
    if (inp[1] && M[inp[1]]) return M[inp[1]];
    return null;
  }
  if (inp.block && typeof inp.block === 'string' && M[inp.block]) return M[inp.block];
  return null;
}

function fv(b, n) { return (b.fields && b.fields[n] && b.fields[n].value) || ''; }

function getMenuVal(b, n, M) {
  if (b.fields && b.fields[n] && b.fields[n].value !== undefined) return String(b.fields[n].value);
  if (b.inputs && b.inputs[n]) {
    const inp = b.inputs[n];
    const ref = inp.shadow || inp.block;
    if (ref) {
      const sb = typeof ref === 'string' ? M[ref] : ref;
      if (sb && sb.fields) for (const k in sb.fields) if (sb.fields[k].value !== undefined) return String(sb.fields[k].value);
    }
    if (inp.value !== undefined) return String(inp.value);
  }
  return '0';
}

function xv(b, M) {
  if (!b) return null;
  const o = b.opcode;
  if (o==='math_number'||o==='math_positive_number'||o==='math_integer'||o==='math_whole_number')
    return {c: fv(b,'NUM')||'0', t: 'num'};
  if (o==='text')
    return {c: esc(fv(b,'TEXT')), t: 'str'};
  if (o==='colour_picker')
    return {c: fv(b,'COLOUR'), t: 'str'};
  function numOp(n1, n2, op) {
    return {c: '(((' + toNum(sv(b,n1,M)) + ')' + op + '(' + toNum(sv(b,n2,M)) + ')))', t: 'num'};
  }
  if (typeof GenCC !== 'undefined' && o && o.indexOf('operator_') === 0) {
    const r = GenCC.operatorDispatch(o, b, M, sv);
    if (r) return r;
  }
  switch (o) {
    case 'data_variable': {
      const n = sane(fv(b,'VARIABLE'));
      const nIsStr = varIsStr(n);
      if (_isoVars && _isoVars[n]) return {c: '_open_vars[_sched_cur].' + n, t: nIsStr ? 'str' : 'num'};
      return {c: n, t: nIsStr ? 'str' : 'num'};
    }
    case 'operator_add': {
      const a1=sv(b,'NUM1',M), a2=sv(b,'NUM2',M);
      if (a1 && a2 && a1.t==='num' && a2.t==='num')
        return {c: '(((' + a1.c + ')+(' + a2.c + ')))', t: 'num'};
      return {c: '_join_tmp(' + toStr(a1) + ',' + toStr(a2) + ')', t: 'str'};
    }
    case 'operator_subtract': return numOp('NUM1','NUM2','-');
    case 'operator_multiply': return numOp('NUM1','NUM2','*');
    case 'operator_divide': return numOp('NUM1','NUM2','/');
    case 'operator_lt': {
      const a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
      if (a1 && a2 && a1.t==='str' && a2.t==='str')
        return {c: '(_strcmp('+a1.c+','+a2.c+')<0)', t: 'num'};
      return {c: '(((' + (a1.t==='str'?'_atof('+a1.c+')':a1.c) + ')<(' + (a2.t==='str'?'_atof('+a2.c+')':a2.c) + ')))', t: 'num'};
    }
    case 'operator_equals': {
      const a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
      if (a1 && a2 && a1.t==='str' && a2.t==='str')
        return {c: '(_strcmp('+a1.c+','+a2.c+')==0)', t: 'num'};
      return {c: '(((' + (a1.t==='str'?'_atof('+a1.c+')':a1.c) + ')==(' + (a2.t==='str'?'_atof('+a2.c+')':a2.c) + ')))', t: 'num'};
    }
    case 'operator_gt': {
      const a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
      if (a1 && a2 && a1.t==='str' && a2.t==='str')
        return {c: '(_strcmp('+a1.c+','+a2.c+')>0)', t: 'num'};
      return {c: '(((' + (a1.t==='str'?'_atof('+a1.c+')':a1.c) + ')>(' + (a2.t==='str'?'_atof('+a2.c+')':a2.c) + ')))', t: 'num'};
    }
    case 'operator_and': return numOp('OPERAND1','OPERAND2','&&');
    case 'operator_or': return numOp('OPERAND1','OPERAND2','||');
    case 'operator_not':
      return GenCC.operatorDispatch('operator_not', b, M, sv);
    case 'operator_join': return {c: '_join_tmp(' + toStr(sv(b,'STRING1',M)) + ',' + toStr(sv(b,'STRING2',M)) + ')', t: 'str'};
    case 'operator_random': return {c: '_rand_i(' + toNum(sv(b,'FROM',M)) + ',' + toNum(sv(b,'TO',M)) + ')', t: 'num'};
    case 'operator_letter_of': {
      const ls=toStr(sv(b,'STRING',M)), ll=toNum(sv(b,'LETTER',M));
      return {c: '({static char _r[2];_r[0]=0;_r[1]=0;int _i=0;while('+ls+'[_i])_i++;if('+ll+'>0&&'+ll+'<=_i)_r[0]='+ls+'[(int)('+ll+'-1)];_r;})', t: 'str'};
    }
    case 'operator_contains': {
      const s1=toStr(sv(b,'STRING1',M)), s2=toStr(sv(b,'STRING2',M));
      return {c: '({int _r=0;char *_s='+s1+',*_t,*_p;while(*_s&&!_r){_t='+s2+';_p=_s;while(*_p&&*_t&&*_p==*_t){_p++;_t++;}if(!*_t)_r=1;_s++;}_r;})', t: 'num'};
    }
    case 'operator_length': {
      const s=toStr(sv(b,'STRING',M));
      return {c: '({int _i=0;while('+s+'[_i])_i++;_i;})', t: 'num'};
    }
    case 'operator_mathop': {
      const maps = {
        abs:'_abs', floor:'_floor', ceil:'_ceil', sqrt:'_sqrt',
        sin:'_sin', cos:'_cos', tan:'_tan',
        asin:'_asin', acos:'_acos', atan:'_atan',
        ln:'_ln', log:'_log',
        'e ^':'_exp', '10 ^':'_pow10'
      };
      return {c: (maps[fv(b,'OPERATOR')]||'_abs') + '(' + toNum(sv(b,'NUM',M)) + ')', t: 'num'};
    }
    case 'operator_mod': return {c: '(((int)(' + toNum(sv(b,'NUM1',M)) + '))%((int)(' + toNum(sv(b,'NUM2',M)) + ')))', t: 'num'};
    case 'operator_round': return {c: '_round_d(' + toNum(sv(b,'NUM',M)) + ')', t: 'num'};
    case 'argument_reporter_string_number':
    case 'argument_reporter_stringnumber': {
      const n = sane(fv(b,'VALUE'));
      let t = varIsStr(n) ? 'str' : 'num';
      if (_argTypeMap && _argTypeMap[n]) t = _argTypeMap[n];
      return {c: n, t};
    }
    case 'argument_reporter_boolean': {
      const n = sane(fv(b,'VALUE'));
      return {c: n, t: 'num'};
    }
    case 'efiop_timerVal':
      return {c: '_timer_seconds()', t: 'num'};
    case 'efiop_rtcGet':
      return {c: '_rtc_get(' + getMenuVal(b,'FIELD',M) + ')', t: 'num'};
    case 'efiop_mmCreate':
      return {c: '_mm_create()', t: 'num'};
    case 'efiop_mmWriteHex':
      return {c: '_mm_write_hex(' + toNum(sv(b,'ID',M)) + ',' + toNum(sv(b,'OFF',M)) + ',' + toStr(sv(b,'HEX',M)) + ')', t: 'num'};
    case 'efiop_mmReadU64':
      return {c: '_mm_read_u64(' + toNum(sv(b,'ID',M)) + ',' + toNum(sv(b,'ADDR',M)) + ')', t: 'num'};
    case 'efiop_mouseX':
      return {c: '_mouse_x()', t: 'num'};
    case 'efiop_mouseY':
      return {c: '_mouse_y()', t: 'num'};
    case 'efiop_mouseXC':
      return {c: '_mouse_xc()', t: 'num'};
    case 'efiop_mouseYC':
      return {c: '_mouse_yc()', t: 'num'};
    case 'efiop_mouseLeft':
      return {c: '_mouse_left()', t: 'num'};
    case 'efiop_mouseRight':
      return {c: '_mouse_right()', t: 'num'};
    case 'efiop_mouseMiddle':
      return {c: '_mouse_middle()', t: 'num'};
    case 'efiop_mouseWheelUp':
      return {c: '_mouse_wheel_up()', t: 'num'};
    case 'efiop_mouseWheelDown':
      return {c: '_mouse_wheel_down()', t: 'num'};
    case 'efiop_keyPressed': {
      let sc = getMenuVal(b,'KEY',M);
      if (sc === '100') sc = '13';
      else if (sc === '101') sc = '9';
      else if (sc === '102') sc = '8';
      return {c: '_key_down(' + sc + ')', t: 'num'};
    }
    case 'fileop_fileRead': {
      const mode = getMenuVal(b,'MODE',M);
      const size = getMenuVal(b,'SIZE',M);
      return {c: '_file_read(' + toStr(sv(b,'PATH',M)) + ',' + mode + ',' + size + ')', t: 'str'};
    }
    case 'fileop_fileList':
      return {c: '_file_list(' + toStr(sv(b,'PATH',M)) + ')', t: 'str'};
    case 'fileop_fileExists':
      return {c: '_file_exists(' + toStr(sv(b,'PATH',M)) + ')', t: 'num'};
    case 'fileop_fileIsdir':
      return {c: '_file_isdir(' + toStr(sv(b,'PATH',M)) + ')', t: 'num'};
    case 'fileop_fileNthSorted':
      return {c: '_file_nth_sorted(' + toStr(sv(b,'PATH',M)) + ',' + toNum(sv(b,'N',M)) + ')', t: 'str'};
    case 'fileop_fileCtime':
      return {c: '_file_ctime(' + toStr(sv(b,'PATH',M)) + ')', t: 'str'};
    case 'fileop_fileSuccess':
      return {c: '_file_op_success()', t: 'num'};
    case 'fileop_strCount':
      return {c: '_str_count(' + toStr(sv(b,'STR',M)) + ',' + toStr(sv(b,'SUB',M)) + ')', t: 'num'};
    case 'fileop_strSplit':
      return {c: '_str_split(' + toStr(sv(b,'STR',M)) + ',' + toStr(sv(b,'SEP',M)) + ',' + toNum(sv(b,'N',M)) + ')', t: 'str'};
    case 'fileop_strParent':
      return {c: '_str_parent(' + toStr(sv(b,'PATH',M)) + ')', t: 'str'};
    case 'fileop_strReplace':
      return {c: '_str_replace(' + toStr(sv(b,'STR',M)) + ',' + toStr(sv(b,'OLD',M)) + ',' + toStr(sv(b,'NEW',M)) + ')', t: 'str'};
    case 'fileop_strSlice':
      return {c: '_str_slice(' + toStr(sv(b,'TEXT',M)) + ',' + toNum(sv(b,'START',M)) + ',' + toNum(sv(b,'END',M)) + ')', t: 'str'};
    case 'fileop_strWrap':
      return {c: '_str_wrap(' + toStr(sv(b,'TEXT',M)) + ',' + toNum(sv(b,'N',M)) + ')', t: 'str'};
    case 'fileop_strInsert':
      return {c: '_str_insert(' + toStr(sv(b,'TEXT',M)) + ',' + toNum(sv(b,'N',M)) + ',' + toStr(sv(b,'INSERT',M)) + ')', t: 'str'};
    case 'fileop_strDelete':
      return {c: '_str_delete(' + toStr(sv(b,'TEXT',M)) + ',' + toNum(sv(b,'N',M)) + ')', t: 'str'};
    case 'fileop_getCwd':
      return {c: '_get_cwd()', t: 'str'};
    case 'efiop_readLine':
      return {c: '_readline()', t: 'str'};
    case 'efiop_currentKey':
      return {c: '_key_name()', t: 'str'};
    case 'efiop_taskCrashed':
      return {c: '_task_crashed(' + toNum(sv(b,'TASK',M)) + ')', t: 'num'};
    default: if (b.shadow) return null; return {c: '/*'+o+'*/0', t: 'num'};
  }
}

// ---- Walk function: C code generation for block sequences ----

function walk(b, M, d, L) {
  while (b) {
    const o = b.opcode;
    const I = Array(d+1).join('  ');
    switch (o) {
      case 'procedures_definition': break;
      case 'control_wait': L.push(I + '_task_wait(' + toNum(sv(b,'DURATION',M)) + ');'); break;
      case 'control_repeat': {
        const tm=toNum(sv(b,'TIMES',M)), sb=ig(b,'SUBSTACK',M);
        L.push(I + '{int _i;for(_i=0;_i<'+tm+';_i++){');
        sb ? walk(sb,M,d+2,L) : null;
        if (!_singleTask) L.push(I + '  _task_yield();');
        L.push(I + '}}');
        break;
      }
      case 'control_forever': {
        const sb2=ig(b,'SUBSTACK',M);
        L.push(I + 'while (1) {');
        sb2 ? walk(sb2,M,d+1,L) : null;
        if (!_singleTask) L.push(I + '  _task_yield();');
        L.push(I + '}');
        break;
      }
      case 'control_if': {
        L.push(I + 'if (' + toNum(sv(b,'CONDITION',M)) + ') {');
        const tb=ig(b,'SUBSTACK',M);
        tb ? walk(tb,M,d+1,L) : null;
        L.push(I + '}');
        break;
      }
      case 'control_if_else': {
        L.push(I + 'if (' + toNum(sv(b,'CONDITION',M)) + ') {');
        const tb2=ig(b,'SUBSTACK',M);
        tb2 ? walk(tb2,M,d+1,L) : null;
        L.push(I + '} else {');
        const eb=ig(b,'SUBSTACK2',M);
        eb ? walk(eb,M,d+1,L) : null;
        L.push(I + '}');
        break;
      }
      case 'control_stop': {
        const so = getMenuVal(b, 'STOP_OPTION', M);
        if (so === 'all') L.push(I + '_stop_all(); return 0;');
        else if (so === 'other scripts in sprite') L.push(I + '_stop_others();');
        else L.push(I + 'return 0;');
        break;
      }
      case 'control_wait_until':
        L.push(I + 'while (!' + toNum(sv(b,'CONDITION',M)) + (_singleTask ? ') { _task_wait(0.01); }' : ') { _task_yield(); }'));
        break;
      case 'control_repeat_until': {
        L.push(I + 'while (!' + toNum(sv(b,'CONDITION',M)) + ') {');
        const sb3=ig(b,'SUBSTACK',M);
        sb3 ? walk(sb3,M,d+1,L) : null;
        if (!_singleTask) L.push(I + '  _task_yield();');
        L.push(I + '}');
        break;
      }
      case 'data_setvariableto': {
        const vn = sane(fv(b,'VARIABLE')), vnIsStr = varIsStr(vn), val = sv(b,'VALUE',M);
        const vnFinal = (_isoVars && _isoVars[vn]) ? '_open_vars[_sched_cur].' + vn : vn;
        if (vnIsStr) L.push(I + '_strcpy(' + vnFinal + ',' + toStr(val) + ');');
        else L.push(I + vnFinal + ' = ' + toNum(val) + ';');
        break;
      }
      case 'data_changevariableby': {
        const vn = sane(fv(b,'VARIABLE')), vnIsStr = varIsStr(vn), val = sv(b,'VALUE',M);
        const vnFinal = (_isoVars && _isoVars[vn]) ? '_open_vars[_sched_cur].' + vn : vn;
        if (vnIsStr) L.push(I + vnFinal + '[0] = 0; /* change on string */');
        else L.push(I + vnFinal + ' += ' + toNum(val) + ';');
        break;
      }
      case 'procedures_call': {
        const fn = procName(b,M);
        let pa = procArgs(b.mutation);
        if (!pa.ids.length) {
          for (const _k in M) {
            const _d = M[_k];
            if (_d && _d.opcode === 'procedures_definition' && procName(_d, M) === fn) {
              const _p = _igP(_d, M);
              pa = procArgs(_p ? _p.mutation : null);
              break;
            }
          }
        }
        const aargs = [];
        for (let i = 0; i < pa.ids.length; i++) {
          const aid = pa.ids[i];
          const aexpr = sv(b, aid, M);
          if (pa.types[i] === 'str') aargs.push(toStr(aexpr));
          else aargs.push(toNum(aexpr));
        }
        L.push(I + fn + '(' + aargs.join(', ') + ');');
        break;
      }
      case 'efiop_enterTextMode': L.push(I + '_con_unmute(); con->SetMode(con,0); con->EnableCursor(con,1);'); break;
      case 'efiop_exitFw': L.push(I + '_ebs();'); break;
      case 'efiop_inputMode': L.push(I + '_set_input_mode(' + getMenuVal(b,'MODE',M) + ');'); break;
      case 'efiop_keyRepeat': L.push(I + '_set_key_repeat(' + getMenuVal(b,'ON',M) + ');'); break;
      case 'efiop_powerCtrl': {
        const op = getMenuVal(b,'OP',M);
        L.push(I + '_power_ctrl(' + op + ');');
        break;
      }
      case 'efiop_shutdown': L.push(I + '_power_ctrl(2);'); break;
      case 'efiop_execBin':
        L.push(I + '_exec_bin(' + toStr(sv(b,'CODE',M)) + ');');
        break;
      case 'efiop_execEfi':
        L.push(I + '_exec_efi(' + toStr(sv(b,'PATH',M)) + ',' + toStr(sv(b,'ARGS',M)) + ');');
        break;
      case 'efiop_runIso': {
        const tid = sv(b,'TABLE_ID',M);
        L.push(I + 'if (' + toNum(tid) + ' > 0) {');
        L.push(I + '  _mm_run((int)' + toNum(tid) + ',' + toStr(sv(b,'PATH',M)) + ',' + toStr(sv(b,'ARGS',M)) + ');');
        L.push(I + '} else {');
        L.push(I + '  _run_iso(' + toStr(sv(b,'PATH',M)) + ',' + toStr(sv(b,'ARGS',M)) + ');');
        L.push(I + '}');
        break;
      }
      case 'efiop_mmCreate':
        L.push(I + '_mm_create()');
        break;
      case 'efiop_mmDestroy':
        L.push(I + '_mm_destroy(' + toNum(sv(b,'ID',M)) + ');');
        break;
      case 'efiop_mmLock':
        L.push(I + '_mm_lock(' + toNum(sv(b,'ID',M)) + ');');
        break;
      case 'efiop_mmUnlock':
        L.push(I + '_mm_unlock(' + toNum(sv(b,'ID',M)) + ');');
        break;
      case 'efiop_mmWriteHex':
        L.push(I + '_mm_write_hex(' + toNum(sv(b,'ID',M)) + ',' + toNum(sv(b,'OFF',M)) + ',' + toStr(sv(b,'HEX',M)) + ')');
        break;
      case 'fileop_fileWrite': {
        const wm = getMenuVal(b,'MODE',M);
        L.push(I + '_file_write(' + toStr(sv(b,'PATH',M)) + ',' + toStr(sv(b,'CONTENT',M)) + ',' + wm + ');');
        break;
      }
      case 'fileop_fileDelete':
        L.push(I + '_file_delete(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_fileCreate':
        L.push(I + '_file_create(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_fileMkdir':
        L.push(I + '_file_mkdir(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_fileRmdir':
        L.push(I + '_file_rmdir(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_setCwd':
        L.push(I + '_set_cwd(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_cdPath':
        L.push(I + '_set_cwd(' + toStr(sv(b,'PATH',M)) + ');');
        break;
      case 'fileop_fileCopy':
        L.push(I + '_file_copy(' + toStr(sv(b,'SRC',M)) + ',' + toStr(sv(b,'DST',M)) + ');');
        break;
      case 'fileop_fileRename':
        L.push(I + '_file_rename(' + toStr(sv(b,'OLD',M)) + ',' + toStr(sv(b,'NEW',M)) + ');');
        break;
      case 'efiop_timerReset': L.push(I + '_timer_reset();'); break;
      case 'uefisound_beep': {
        const fq=toNum(sv(b,'FREQ',M)), ms=toNum(sv(b,'MS',M));
        L.push(I + '_beep((' + fq + '),(' + ms + '));');
        break;
      }
      case 'uefisound_playTone': {
        const fq=toNum(sv(b,'FREQ',M)), vl=toNum(sv(b,'VOL',M)), ms=toNum(sv(b,'MS',M));
        L.push(I + '_audio_tone((' + fq + '),(' + vl + '),(' + ms + '));');
        break;
      }
      case 'pen_gfxInit': L.push(I + '_gfx_init();'); break;
      case 'pen_gfxClear': L.push(I + '_gfx_clear();'); break;
      case 'pen_gfxCache': {
        const cm=getMenuVal(b,'MODE',M);
        L.push(I + '_gfx_set_cache((' + cm + '));');
        break;
      }
      case 'pen_gfxFlip': L.push(I + '_gfx_flip();'); break;
      case 'pen_gfxMode': {
        const mw=toNum(sv(b,'WIDTH',M)), mh=toNum(sv(b,'HEIGHT',M));
        L.push(I + '_gfx_set_mode((' + mw + '),(' + mh + '));');
        break;
      }
      case 'pen_fillRect': {
        const rx=toNum(sv(b,'X',M)), ry=toNum(sv(b,'Y',M)), rx2=toNum(sv(b,'X2',M)), ry2=toNum(sv(b,'Y2',M)), rc=parseHexClr(b,'COLOR',M), ra=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_fill_rect((' + rx + '),(' + ry + '),(' + rx2 + '),(' + ry2 + '),(' + rc + '),(' + ra + '));');
        break;
      }
      case 'pen_setPixel': {
        const px=toNum(sv(b,'X',M)), py=toNum(sv(b,'Y',M)), pc=parseHexClr(b,'COLOR',M), pa=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_set_pixel((' + px + '),(' + py + '),(' + pc + '),(' + pa + '));');
        break;
      }
      case 'pen_drawText': {
        const tx=toNum(sv(b,'X',M)), ty=toNum(sv(b,'Y',M)), tz=toNum(sv(b,'SIZE',M));
        const tc=parseHexClr(b,'COLOR',M), tt=sv(b,'TEXT',M), tf=sv(b,'FONT',M), ta=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_draw_text(' + toStr(tf) + ',(' + tx + '),(' + ty + '),' + toStr(tt) + ',(' + tc + '),(' + tz + '),0,0,(' + ta + '));');
        break;
      }
      case 'pen_drawTextOutline': {
        const tx=toNum(sv(b,'X',M)), ty=toNum(sv(b,'Y',M)), tz=toNum(sv(b,'SIZE',M));
        const tc=parseHexClr(b,'COLOR',M), tt=sv(b,'TEXT',M), tf=sv(b,'FONT',M);
        const tzo=toNum(sv(b,'OSIZE',M)), tco=parseHexClr(b,'OLCOLOR',M), tao=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_draw_text(' + toStr(tf) + ',(' + tx + '),(' + ty + '),' + toStr(tt) + ',(' + tc + '),(' + tz + '),(' + tco + '),(' + tzo + '),(' + tao + '));');
        break;
      }
      case 'pen_drawTextEsc': {
        const tx=toNum(sv(b,'X',M)), ty=toNum(sv(b,'Y',M)), tz=toNum(sv(b,'SIZE',M));
        const tt=sv(b,'TEXT',M), tf=sv(b,'FONT',M), tae=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_draw_text_esc(' + toStr(tf) + ',(' + tx + '),(' + ty + '),' + toStr(tt) + ',(' + tz + '),(' + tae + '));');
        break;
      }
      case 'pen_sysCall': {
        const sf=toStr(sv(b,'FUNC',M));
        const sa=[toNum(sv(b,'A',M)),toNum(sv(b,'B',M)),toNum(sv(b,'C',M)),toNum(sv(b,'D',M))];
        const st=toStr(sv(b,'TEXT',M));
        L.push(I + '_sys_call(' + sf + ',(UINTN)(long long)(' + sa[0] + '),(UINTN)(long long)(' + sa[1] + '),(UINTN)(long long)(' + sa[2] + '),(UINTN)(long long)(' + sa[3] + '),(UINTN)(const char*)(' + st + '));');
        break;
      }
      case 'pen_drawBmp': {
        const bx=toNum(sv(b,'X',M)), by=toNum(sv(b,'Y',M)), bh=sv(b,'HEX',M), ba=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_draw_bmp(' + toStr(bh) + ',(' + bx + '),(' + by + '),(' + ba + '));');
        break;
      }
      case 'pen_drawTextBg': {
        const tx=toNum(sv(b,'X',M)), ty=toNum(sv(b,'Y',M)), tz=toNum(sv(b,'SIZE',M));
        const tc=parseHexClr(b,'COLOR',M), tt=sv(b,'TEXT',M), tf=sv(b,'FONT',M), tb=parseHexClr(b,'BG',M), tab=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_draw_text_bg(' + toStr(tf) + ',(' + tx + '),(' + ty + '),' + toStr(tt) + ',(' + tc + '),(' + tz + '),(' + tb + '),(' + tab + '));');
        break;
      }
      case 'pen_fonText': {
        const fh=sv(b,'HEX',M), fx=toNum(sv(b,'X',M)), fy=toNum(sv(b,'Y',M)), ft=sv(b,'TEXT',M);
        const fc=parseHexClr(b,'COLOR',M), fz=toNum(sv(b,'SIZE',M)), fa=toNum(sv(b,'ALPHA',M));
        L.push(I + '_gfx_fon_text(' + toStr(fh) + ',(' + fx + '),(' + fy + '),' + toStr(ft) + ',(' + fc + '),(' + fz + '),(' + fa + '));');
        break;
      }
      case 'efiop_clearScreen': L.push(I + 'con->ClearScreen(con);'); break;
      case 'efiop_conRestore': L.push(I + '_con_restore();'); break;
      case 'efiop_printHere': {
        const pt=sv(b,'TEXT',M), pf=getMenuVal(b,'FG',M), pb=getMenuVal(b,'BG',M);
        L.push(I + '{_to_wide(_ws,'+toStr(pt)+',1024);con->SetAttribute(con,(('+pf+')|(('+pb+')<<4)));con->OutputString(con,_ws);}');
        break;
      }
      case 'efiop_printAt': {
        const px=toNum(sv(b,'X',M)), py=toNum(sv(b,'Y',M)), pt=sv(b,'TEXT',M), pf=getMenuVal(b,'FG',M), pb=getMenuVal(b,'BG',M);
        L.push(I + '{_to_wide(_ws,'+toStr(pt)+',1024);con->SetAttribute(con,(('+pf+')|(('+pb+')<<4)));con->SetCursorPosition(con,('+px+'),('+py+'));con->OutputString(con,_ws);}');
        break;
      }
      default: if (b.shadow) break; L.push(I + '// ' + o);
    }
    b = b.next ? M[b.next] : null;
  }
}

// ---- Main genCC function ----

function genCC() {
  const rt = _vm.runtime;
  const L = [], defs = [], vars = [], opens = [], procs = [];
  _isoVars = {};
  _argTypeMap = null;

  if (!rt || !rt.targets) return '// no project';

  // Collect open_ procedure variables
  const ovset = {};
  for (let t0 = 0; t0 < rt.targets.length; t0++) {
    const tg0 = rt.targets[t0];
    if (!tg0.blocks) continue;
    const al0 = tg0.blocks._blocks;
    Object.keys(al0).forEach(function(sid) {
      const b0 = al0[sid];
      if (!b0 || b0.opcode !== 'procedures_definition') return;
      const pn0 = procName(b0, al0);
      if (!pn0 || pn0.indexOf('open_') !== 0) return;
      let bd = ig(b0,'SUBSTACK',al0) || ig(b0,'STACK',al0);
      if (!bd && b0.next && al0[b0.next]) bd = al0[b0.next];
      (function collect(blk) {
        while (blk && typeof blk === 'string') {
          const bb = al0[blk];
          if (!bb) break;
          if (bb.opcode === 'data_variable' || bb.opcode === 'data_setvariableto' || bb.opcode === 'data_changevariableby') {
            const vn0 = sane(fv(bb,'VARIABLE'));
            if (vn0) ovset[vn0] = 1;
          }
          if (bb.inputs) for (const k0 in bb.inputs) {
            const inp0 = bb.inputs[k0];
            if (Array.isArray(inp0)) {
              if (inp0[1] && typeof inp0[1] === 'string') collect(inp0[1]);
              if (inp0[2] && typeof inp0[2] === 'string') collect(inp0[2]);
            } else if (inp0.block && typeof inp0.block === 'string') collect(inp0.block);
          }
          blk = bb.next;
        }
      })(bd);
    });
  }

  // Process targets
  const isoFields = [];
  for (let t = 0; t < rt.targets.length; t++) {
    const tg = rt.targets[t];
    if (!tg.blocks) continue;
    const all = tg.blocks._blocks;

    if (tg.variables) Object.keys(tg.variables).forEach(function(k) {
      const v = tg.variables[k];
      if (!v || !v.name) return;
      const n = sane(v.name);
      if (!n) return;
      const isLocal = !tg.isStage || v.scope === 'local';
      const isBig = n.indexOf('big') >= 0 || n.indexOf('max') >= 0;
      if (isLocal && ovset[n] && !isBig) {
        if (!_isoVars[n]) {
          _isoVars[n] = 1;
          if (varIsStr(n)) isoFields.push('  char ' + n + '[1024];');
          else isoFields.push('  double ' + n + ';');
        }
      } else if (varIsStr(n)) vars.push('char ' + n + '[' + ((n.indexOf('big') >= 0 || n.indexOf('max') >= 0) ? 33554432 : 1024) + '];');
      else vars.push('double ' + n + ';');
    });

    Object.keys(all).forEach(function(sid) {
      const b = all[sid];
      if (!b) return;
      if (b.opcode === 'procedures_definition') {
        const pn = procName(b, all);
        if (pn) {
          const proto = _igP(b, all);
          const pa = procArgs(proto ? proto.mutation : null);
          const plist = [];
          const amap = {};
          for (let i = 0; i < pa.names.length; i++) {
            const an = sane(pa.names[i]);
            amap[an] = pa.types[i] === 'str' ? 'str' : 'num';
            if (pa.types[i] === 'str') plist.push('const char *' + an);
            else plist.push('double ' + an);
          }
          const oldMap = _argTypeMap;
          _argTypeMap = amap;
          const pSig = 'void ' + pn + '(' + plist.join(', ') + ')';
          if (!procs.some(function(p) { return p.name === pn; })) procs.push({ name: pn, sig: pSig });
          defs.push(pSig + ' {');
          let _body = ig(b,'SUBSTACK',all) || ig(b,'STACK',all);
          if (!_body && b.next && all[b.next]) _body = all[b.next];
          walk(_body, all, 1, defs);
          defs.push('}');
          _argTypeMap = oldMap;
          if (pn.indexOf('open_') === 0 && pa.ids.length <= 5) {
            const wp = ['static UINTN _owp_' + pn + '(UINTN a1, UINTN a2, UINTN a3, UINTN a4, UINTN a5) {'];
            const ca = [];
            for (let ai = 0; ai < pa.ids.length; ai++) {
              if (pa.types[ai] === 'str') ca.push('(const char*)a' + (ai + 1));
              else ca.push('(double)(long long)a' + (ai + 1));
            }
            wp.push('  ' + pn + '(' + ca.join(', ') + ');');
            wp.push('  return 0;');
            wp.push('}');
            defs.push(wp.join('\n'));
            opens.push(pn);
          }
        }
      }
    });
  }

  // Build output
  const out = [];
  out.push('#include "s_io.h"');
  out.push('#include "uefi_control.h"');
  out.push('#include "usb.h"');
  out.push('#include "sched.h"');
  out.push('void *ImageHandle;');
  out.push('void *SystemTable;');
  out.push('int _fltused = 0;');
  out.push('void __chkstk() {}');

  if (isoFields.length) {
    out.push('typedef struct {');
    out.push(...isoFields);
    out.push('} _OPEN_VARS;');
    out.push('static _OPEN_VARS _open_vars[SCHED_MAX_TASKS];');
    out.push('');
  }

  if (vars.length) out.push('');
  out.push(...vars);

  if (defs.length) out.push('');
  if (procs.length) {
    procs.forEach(function(p) { out.push(p.sig + ';'); });
    out.push('');
  }
  out.push(...defs);

  if (opens.length) {
    out.push('static const char *_open_names[] = { ' + opens.map(function(n){ return '"' + n + '"'; }).join(', ') + ' };');
    out.push('static void *_open_fns[] = { ' + opens.map(function(n){ return '(void*)_owp_' + n; }).join(', ') + ' };');
    out.push('static _SYS_PROTOCOL _open_proto = { 1, ' + opens.length + ', _open_names, _open_fns };');
  }
  out.push('');

  // Collect task definitions
  const taskDefs = [];
  for (let t = 0; t < rt.targets.length; t++) {
    const tg = rt.targets[t];
    if (!tg.blocks) continue;
    const all = tg.blocks._blocks;
    (tg.blocks._scripts || []).forEach(function(sid) {
      const b = all[sid];
      if (!b || b.opcode !== 'efiop_efiStarted') return;
      taskDefs.push({ b, M: all, uid: getMenuVal(b, 'TASK', all) });
    });
  }

  _singleTask = taskDefs.length === 1;
  taskDefs.forEach(function(tk, i) {
    out.push('static int _task' + i + '(void) {');
    walk(tk.b, tk.M, 1, out);
    if (!_singleTask) out.push('  _task_exit();');
    out.push('  return 0;');
    out.push('}');
  });
  out.push('');

  out.push('int s_main()');
  out.push('{');
  out.push('  if (SystemTable) s_init();');
  out.push('  _timer_init();');
  if (opens.length) out.push('  _sys_register(&_open_proto);');
  if (_singleTask) {
    out.push('  _task0();');
  } else {
    taskDefs.forEach(function(tk, i) {
      out.push('  _task_create(_task' + i + ', ' + tk.uid + ');');
    });
    out.push('  _task_run();');
  }
  out.push('  return 0;');
  out.push('}');

  return out.join('\n') || '// no efi scripts';
}

// Wire up GenCC dependencies
if (typeof GenCC !== 'undefined') {
  GenCC.getMenuVal = getMenuVal;
  GenCC.fv = fv;
}

export function initCodegen(vm) {
  _vm = vm;
  return genCC;
}

export { genCC, getMenuVal, sane, esc, toNum, toStr, fv, ig, sv, ev, xv, walk, parseHexClr };
