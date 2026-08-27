// Dinso OS C Code Generator - Operator Logic
// Extracted from gui.html for easier maintenance
// This handles all operator code generation for Scratch blocks

const GenCC = (function() {
  // ---- Helper: get the inner block for an input slot ----
  // Equivalent to gui.html's ig() - returns the raw block, not the {c,t} expression
  function ig(b, n, M) {
    if (!b.inputs || !b.inputs[n]) return null;
    var inp = b.inputs[n];
    if (Array.isArray(inp)) {
      if (inp[1] && typeof inp[1] === 'string' && M[inp[1]]) return M[inp[1]];
      return null;
    }
    if (inp.block && typeof inp.block === 'string' && M[inp.block]) return M[inp.block];
    return null;
  }

  // ---- Numeric helpers ----
  // Get numeric C expression, converting string types via _atof
  function toNumVal(operand) {
    if (!operand) return '0';
    if (operand.t === 'str') return '_atof(' + operand.c + ')';
    return operand.c;
  }

  // Legacy: get the .c field with cross-type conversion (matching gui.html behavior)
  // For string types, converts via _atof()
  function toNum(expr) {
    if (!expr) return '0';
    if (expr.t === 'num') return expr.c;
    return '_atof(' + expr.c + ')';
  }

  // Get string C expression, returns quoted string for text literals
  // For numeric types, converts via _num_to_str() (matching gui.html behavior)
  function toStr(expr) {
    if (!expr) return '""';
    if (expr.t === 'str') return expr.c;
    return '_num_to_str(' + expr.c + ')';
  }

  // Escape string for C
  function esc(s) {
    if (!s) return '';
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  // ---- Core: binary operation with double-parenthesis protection ----
  // Prevents ambiguity like "a--b" (自减) from being parsed as a - (-b)
  // Uses toNumVal for cross-type safety (string operands → _atof conversion)
  function numOp(n1, n2, op) {
    return {c: '(((' + toNumVal(n1) + ')' + op + '(' + toNumVal(n2) + ')))', t: 'num'};
  }

  // ---- Comparison operators: handle str-str, num-num, and cross-type ----
  function cmpOp(n1, n2, op, strFn) {
    if (n1 && n2 && n1.t === 'str' && n2.t === 'str')
      return {c: '(' + strFn + '(' + n1.c + ',' + n2.c + ')' + op + '0)', t: 'num'};
    // Cross-type: convert string to number via _atof
    return {c: '(((' + toNumVal(n1) + ')' + op + '(' + toNumVal(n2) + ')))', t: 'num'};
  }

  // ---- Main dispatcher for operator_* opcodes ----
  function operatorDispatch(o, b, M, sv) {
    switch (o) {
      case 'operator_add': {
        var a1=sv(b,'NUM1',M), a2=sv(b,'NUM2',M);
        if (a1 && a2 && a1.t==='num' && a2.t==='num')
          return {c: '(((' + a1.c + ')+(' + a2.c + ')))', t: 'num'};
        return {c: '_join_tmp(' + toStr(a1) + ',' + toStr(a2) + ')', t: 'str'};
      }
      case 'operator_subtract': return numOp(sv(b,'NUM1',M), sv(b,'NUM2',M), '-');
      case 'operator_multiply': return numOp(sv(b,'NUM1',M), sv(b,'NUM2',M), '*');
      case 'operator_divide': return numOp(sv(b,'NUM1',M), sv(b,'NUM2',M), '/');
      case 'operator_lt': {
        var a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
        return cmpOp(a1, a2, '<', '_strcmp');
      }
      case 'operator_equals': {
        var a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
        return cmpOp(a1, a2, '==', '_strcmp');
      }
      case 'operator_gt': {
        var a1=sv(b,'OPERAND1',M), a2=sv(b,'OPERAND2',M);
        return cmpOp(a1, a2, '>', '_strcmp');
      }
      case 'operator_and': return numOp(sv(b,'OPERAND1',M), sv(b,'OPERAND2',M), '&&');
      case 'operator_or': return numOp(sv(b,'OPERAND1',M), sv(b,'OPERAND2',M), '||');
      case 'operator_not': {
        var _ob = ig(b,'OPERAND',M);
        if (_ob && _ob.opcode === 'efiop_keyPressed') {
          var _sc = GenCC.getMenuVal(_ob,'KEY',M);
          if (_sc === '100') _sc = '13';
          else if (_sc === '101') _sc = '9';
          else if (_sc === '102') _sc = '8';
          return {c: '(!_key_is(' + _sc + '))', t: 'num'};
        }
        return {c: '(!(' + toNumVal(sv(b,'OPERAND',M)) + '))', t: 'num'};
      }
      case 'operator_join': return {c: '_join_tmp(' + toStr(sv(b,'STRING1',M)) + ',' + toStr(sv(b,'STRING2',M)) + ')', t: 'str'};
      case 'operator_random': return {c: '_rand_i(' + toNumVal(sv(b,'FROM',M)) + ',' + toNumVal(sv(b,'TO',M)) + ')', t: 'num'};
      case 'operator_letter_of': {
        var ls=toStr(sv(b,'STRING',M)), ll=toNumVal(sv(b,'LETTER',M));
        return {c: '({static char _r[2];_r[0]=0;_r[1]=0;int _i=0;while('+ls+'[_i])_i++;if('+ll+'>0&&'+ll+'<=_i)_r[0]='+ls+'[(int)('+ll+'-1)];_r;})', t: 'str'};
      }
      case 'operator_contains': {
        var s1=toStr(sv(b,'STRING1',M)), s2=toStr(sv(b,'STRING2',M));
        return {c: '({int _r=0;char *_s='+s1+',*_t,*_p;while(*_s&&!_r){_t='+s2+';_p=_s;while(*_p&&*_t&&*_p==*_t){_p++;_t++;}if(!*_t)_r=1;_s++;}_r;})', t: 'num'};
      }
      case 'operator_length': {
        var s=toStr(sv(b,'STRING',M));
        return {c: '({int _i=0;while('+s+'[_i])_i++;_i;})', t: 'num'};
      }
      case 'operator_mathop': {
        var maps = {
          abs:'_abs', floor:'_floor', ceil:'_ceil', sqrt:'_sqrt',
          sin:'_sin', cos:'_cos', tan:'_tan',
          asin:'_asin', acos:'_acos', atan:'_atan',
          ln:'_ln', log:'_log',
          'e ^':'_exp', '10 ^':'_pow10'
        };
        var fv = GenCC.fv;
        return {c: (maps[fv(b,'OPERATOR')]||'_abs') + '(' + toNumVal(sv(b,'NUM',M)) + ')', t: 'num'};
      }
      case 'operator_mod': return {c: '(((int)(' + toNumVal(sv(b,'NUM1',M)) + '))%((int)(' + toNumVal(sv(b,'NUM2',M)) + ')))', t: 'num'};
      case 'operator_round': return {c: '_round_d(' + toNumVal(sv(b,'NUM',M)) + ')', t: 'num'};
      default: return null;
    }
  }

  return {
    ig: ig,
    numOp: numOp,
    toNum: toNum,
    toStr: toStr,
    toNumVal: toNumVal,
    cmpOp: cmpOp,
    esc: esc,
    operatorDispatch: operatorDispatch,
    // Placeholders - will be set by codegen.js after loading
    getMenuVal: null,
    fv: null
  };
})();

export default GenCC;
