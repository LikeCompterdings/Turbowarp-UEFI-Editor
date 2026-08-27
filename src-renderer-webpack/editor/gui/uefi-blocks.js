// Dinso OS UEFI Editor - Block Definitions
// Registers 5 Scratch extensions: ccoutput, efiop, fileop, uefisound, pen

import {initCodegen, genCC} from './codegen.js';

let _ccZh = true;

function ccT(zh, en) { return _ccZh ? zh : en; }

function registerExtensions(vm) {
  try {
    const locale = vm.getLocale();
    if (locale && locale.indexOf('zh') !== 0) _ccZh = false;
  } catch(e) {}

  // Wire up codegen
  initCodegen(vm);

  // ---- ccoutput (Compile reporter) ----
  const CCCompile = function(r) { this.runtime = r; };
  CCCompile.prototype.getInfo = function() {
    return {
      id: 'ccoutput',
      name: ccT('编译', 'Compile'),
      color1: '#4C97FF', color2: '#3373CC', color3: '#3373CC',
      blocks: [
        { opcode: 'currentCode', blockType: 'reporter', text: ccT('编译', 'Compile') }
      ]
    };
  };
  CCCompile.prototype.currentCode = function() { return genCC(); };
  vm.extensionManager.addBuiltinExtension('ccoutput', CCCompile);
  vm.extensionManager.loadExtensionIdSync('ccoutput');

  // ---- efiop (UEFI operations) ----
  const CCEfi = function(r) { this.runtime = r; };
  CCEfi.prototype.getInfo = function() {
    return {
      id: 'efiop',
      name: 'UEFI',
      color1: '#4C97FF', color2: '#3373CC', color3: '#3373CC',
      blocks: [
        { opcode: 'efiStarted', blockType: 'event', text: ccT('当UEFI被启动时 任务编码[TASK]', 'when UEFI starts task [TASK]'), isEdgeActivated: false, shouldRestartExistingThreads: true,
          arguments: {
            TASK: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'enterTextMode', blockType: 'command', text: ccT('进入文本模式', 'enter text mode') },
        { opcode: 'exitFw', blockType: 'command', text: ccT('退出固件服务', 'exit firmware services') },
        { opcode: 'inputMode', blockType: 'command', text: ccT('键鼠依赖设为[MODE]', '键鼠依赖设为[MODE]'),
          arguments: {
            MODE: { type: 'number', menu: 'INPUT_MODE_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'keyRepeat', blockType: 'command', text: ccT('键盘抓取速度[ON]', '键盘抓取速度[ON]'),
          arguments: {
            ON: { type: 'number', menu: 'REPEAT_MENU', defaultValue: 1 }
          }
        },
        { opcode: 'rtcGet', blockType: 'reporter', text: ccT('时间[FIELD]', '时间[FIELD]'),
          arguments: {
            FIELD: { type: 'number', menu: 'RTC_MENU', defaultValue: 5 }
          }
        },
        { opcode: 'clearScreen', blockType: 'command', text: ccT('清空文本', 'clear text') },
        { opcode: 'conRestore', blockType: 'command', text: ccT('恢复控制台状态', 'restore console state') },
        { opcode: 'printHere', blockType: 'command', text: ccT('在当前位置输出文本[TEXT]前景[FG]背景[BG]', 'print [TEXT] here fg [FG] bg [BG]'),
          arguments: {
            TEXT: { type: 'string', defaultValue: '' },
            FG: { type: 'number', menu: 'FG_MENU', defaultValue: 7 },
            BG: { type: 'number', menu: 'BG_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'printAt', blockType: 'command', text: ccT('在x[X]y[Y]显示文本[TEXT]前景[FG]背景[BG]', 'print [TEXT] at x[X] y[Y] fg [FG] bg [BG]'),
          arguments: {
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            TEXT: { type: 'string', defaultValue: '' },
            FG: { type: 'number', menu: 'FG_MENU', defaultValue: 7 },
            BG: { type: 'number', menu: 'BG_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'shutdown', blockType: 'command', text: ccT('关机', 'shut down') },
        { opcode: 'powerCtrl', blockType: 'command', text: ccT('电源操作[OP]', 'power control [OP]'),
          arguments: {
            OP: { type: 'number', menu: 'POWER_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'timerReset', blockType: 'command', text: ccT('重置计时器', 'reset timer') },
        { opcode: 'timerVal', blockType: 'reporter', text: ccT('计时器', 'timer (seconds)') },
        { opcode: 'mouseX', blockType: 'reporter', text: ccT('鼠标x(从0开始)', 'mouse x (from left)') },
        { opcode: 'mouseY', blockType: 'reporter', text: ccT('鼠标y(从0开始)', 'mouse y (from top)') },
        { opcode: 'mouseXC', blockType: 'reporter', text: ccT('鼠标x(以中心为原点)', 'mouse x (from center)') },
        { opcode: 'mouseYC', blockType: 'reporter', text: ccT('鼠标y(以中心为原点)', 'mouse y (from center)') },
        { opcode: 'mouseLeft', blockType: 'Boolean', text: ccT('鼠标左键是否点击?', 'left button clicked?') },
        { opcode: 'mouseRight', blockType: 'Boolean', text: ccT('鼠标右键是否点击?', 'right button clicked?') },
        { opcode: 'mouseMiddle', blockType: 'Boolean', text: ccT('鼠标中键是否点击?', 'middle button clicked?') },
        { opcode: 'mouseWheelUp', blockType: 'Boolean', text: ccT('滚轮向上滚动?', 'wheel scrolled up?') },
        { opcode: 'mouseWheelDown', blockType: 'Boolean', text: ccT('滚轮向下滚动?', 'wheel scrolled down?') },
        { opcode: 'readLine', blockType: 'reporter', text: ccT('输入', 'input') },
        { opcode: 'execBin', blockType: 'command', text: ccT('运行字节码[CODE]', 'run bytecode [CODE]'),
          arguments: {
            CODE: { type: 'string', defaultValue: 'B8 01 00 00 00 C3' }
          }
        },
        { opcode: 'execEfi', blockType: 'command', text: ccT('运行EFI程序[PATH]参数[ARGS]', 'run EFI program [PATH] args [ARGS]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'app.efi' },
            ARGS: { type: 'string', defaultValue: '' }
          }
        },
        { opcode: 'runIso', blockType: 'command', text: ccT('隔离运行程序[PATH]参数为[ARGS]页表[TABLE_ID]', 'run isolated program [PATH] args [ARGS] table [TABLE_ID]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/SYSTEM/app.elf' },
            ARGS: { type: 'string', defaultValue: '' },
            TABLE_ID: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'mmCreate', blockType: 'reporter', text: ccT('创建页表', 'create page table') },
        { opcode: 'mmDestroy', blockType: 'command', text: ccT('释放页表[ID]', 'free page table [ID]'),
          arguments: {
            ID: { type: 'number', defaultValue: 1 }
          }
        },
        { opcode: 'mmLock', blockType: 'command', text: ccT('锁定页表[ID]', 'lock page table [ID]'),
          arguments: {
            ID: { type: 'number', defaultValue: 1 }
          }
        },
        { opcode: 'mmUnlock', blockType: 'command', text: ccT('切换到页表[ID]', 'switch to table [ID]'),
          arguments: {
            ID: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'mmWriteHex', blockType: 'reporter', text: ccT('在页表[ID]偏移[OFF]写入[HEX]', 'write [HEX] to table [ID] offset [OFF]'),
          arguments: {
            ID: { type: 'number', defaultValue: 1 },
            OFF: { type: 'number', defaultValue: 0 },
            HEX: { type: 'string', defaultValue: 'B8 01 00 00 00 C3' }
          }
        },
        { opcode: 'mmReadU64', blockType: 'reporter', text: ccT('读页表[ID]地址[ADDR]', 'read table [ID] at [ADDR]'),
          arguments: {
            ID: { type: 'number', defaultValue: 1 },
            ADDR: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'currentKey', blockType: 'reporter', text: ccT('当前按键', 'current key pressed') },
        { opcode: 'keyPressed', blockType: 'Boolean', text: ccT('是否按下键[KEY]', '是否按下键[KEY]'),
          arguments: {
            KEY: { type: 'number', menu: 'KEY_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'sysCall', blockType: 'command', text: ccT('调用函数[FUNC]参数1[A]参数2[B]参数3[C]参数4[D]文本[TEXT]', 'call [FUNC] args [A][B][C][D] text [TEXT]'),
          arguments: {
            FUNC: { type: 'string', defaultValue: 'open_xxx' },
            A: { type: 'number', defaultValue: 0 },
            B: { type: 'number', defaultValue: 0 },
            C: { type: 'number', defaultValue: 0 },
            D: { type: 'number', defaultValue: 0 },
            TEXT: { type: 'string', defaultValue: '' }
          }
        },
        { opcode: 'taskCrashed', blockType: 'Boolean', text: ccT('任务[TASK]是否崩溃?', 'task [TASK] crashed?'),
          arguments: {
            TASK: { type: 'number', defaultValue: 1 }
          }
        }
      ],
      menus: {
        FG_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('黑色(0)','黑色(0)'),value:'0'},{text:ccT('蓝色(1)','蓝色(1)'),value:'1'},{text:ccT('绿色(2)','绿色(2)'),value:'2'},{text:ccT('青色(3)','青色(3)'),value:'3'},
            {text:ccT('红色(4)','红色(4)'),value:'4'},{text:ccT('紫色(5)','紫色(5)'),value:'5'},{text:ccT('棕色(6)','棕色(6)'),value:'6'},{text:ccT('白色(7)','白色(7)'),value:'7'},
            {text:ccT('灰色(8)','灰色(8)'),value:'8'},{text:ccT('浅蓝(9)','浅蓝(9)'),value:'9'},{text:ccT('浅绿(10)','浅绿(10)'),value:'10'},{text:ccT('浅青(11)','浅青(11)'),value:'11'},
            {text:ccT('浅红(12)','浅红(12)'),value:'12'},{text:ccT('浅紫(13)','浅紫(13)'),value:'13'},{text:ccT('黄色(14)','黄色(14)'),value:'14'},{text:ccT('明白(15)','明白(15)'),value:'15'}
          ]
        },
        BG_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('黑色(0)','黑色(0)'),value:'0'},{text:ccT('蓝色(1)','蓝色(1)'),value:'1'},{text:ccT('绿色(2)','绿色(2)'),value:'2'},{text:ccT('青色(3)','青色(3)'),value:'3'},
            {text:ccT('红色(4)','红色(4)'),value:'4'},{text:ccT('紫色(5)','紫色(5)'),value:'5'},{text:ccT('棕色(6)','棕色(6)'),value:'6'},{text:ccT('白色(7)','白色(7)'),value:'7'},
            {text:ccT('灰色(8)','灰色(8)'),value:'8'},{text:ccT('浅蓝(9)','浅蓝(9)'),value:'9'},{text:ccT('浅绿(10)','浅绿(10)'),value:'10'},{text:ccT('浅青(11)','浅青(11)'),value:'11'},
            {text:ccT('浅红(12)','浅红(12)'),value:'12'},{text:ccT('浅紫(13)','浅紫(13)'),value:'13'},{text:ccT('黄色(14)','黄色(14)'),value:'14'},{text:ccT('明白(15)','明白(15)'),value:'15'}
          ]
        },
        POWER_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('关机','shut down'),value:'2'},
            {text:ccT('重启','重启'),value:'0'}
          ]
        },
        INPUT_MODE_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('UEFI','UEFI'),value:'1'},
            {text:ccT('EBS后','EBS后'),value:'2'},
            {text:ccT('自动','自动'),value:'0'}
          ]
        },
        REPEAT_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('慢','慢'),value:'1'},
            {text:ccT('快','快'),value:'0'}
          ]
        },
        RTC_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('年','Year'),value:'0'},
            {text:ccT('月','Month'),value:'1'},
            {text:ccT('日','Day'),value:'2'},
            {text:ccT('时','Hour'),value:'3'},
            {text:ccT('分','Minute'),value:'4'},
            {text:ccT('秒','Second'),value:'5'}
          ]
        },
        KEY_MENU: {
          acceptReporters: true,
          items: (function() {
            const a = [{text:'any key',value:'0'},{text:'space',value:'32'}];
            const n=['up arrow','down arrow','left arrow','right arrow','home','end','insert','delete','page up','page down','f1','f2','f3','f4','f5','f6','f7','f8','f9','f10','f11','f12','escape'];
            for(let i=0;i<n.length;i++) a.push({text:n[i],value:String(i+1)});
            a.push({text:'tab',value:'101'});
            a.push({text:'enter',value:'100'});
            a.push({text:'backspace',value:'102'});
            for(let c=33;c<=126;c++) a.push({text:String.fromCharCode(c),value:String(c)});
            return a;
          })()
        }
      }
    };
  };
  CCEfi.prototype.efiStarted = function() {};
  CCEfi.prototype.enterTextMode = function() {};
  CCEfi.prototype.exitFw = function() {};
  CCEfi.prototype.inputMode = function() {};
  CCEfi.prototype.keyRepeat = function() {};
  CCEfi.prototype.clearScreen = function() {};
  CCEfi.prototype.conRestore = function() {};
  CCEfi.prototype.printHere = function() {};
  CCEfi.prototype.printAt = function() {};
  CCEfi.prototype.timerReset = function() {};
  CCEfi.prototype.execBin = function() {};
  CCEfi.prototype.execEfi = function() {};
  CCEfi.prototype.sysCall = function() {};
  CCEfi.prototype.timerVal = function() { return 0; };
  CCEfi.prototype.mouseX = function() { return 0; };
  CCEfi.prototype.mouseY = function() { return 0; };
  CCEfi.prototype.mouseXC = function() { return 0; };
  CCEfi.prototype.mouseYC = function() { return 0; };
  CCEfi.prototype.mouseLeft = function() { return 0; };
  CCEfi.prototype.mouseRight = function() { return 0; };
  CCEfi.prototype.mouseMiddle = function() { return 0; };
  CCEfi.prototype.mouseWheelUp = function() { return 0; };
  CCEfi.prototype.mouseWheelDown = function() { return 0; };
  CCEfi.prototype.readLine = function() { return ''; };
  CCEfi.prototype.currentKey = function() { return ''; };
  CCEfi.prototype.keyPressed = function() { return 0; };
  CCEfi.prototype.taskCrashed = function() { return 0; };
  CCEfi.prototype.runIso = function() {};
  CCEfi.prototype.mmCreate = function() { return 0; };
  CCEfi.prototype.mmDestroy = function() {};
  CCEfi.prototype.mmLock = function() {};
  CCEfi.prototype.mmUnlock = function() {};
  CCEfi.prototype.mmWriteHex = function() { return 0; };
  CCEfi.prototype.mmReadU64 = function() { return 0; };
  vm.extensionManager.addBuiltinExtension('efiop', CCEfi);
  vm.extensionManager.loadExtensionIdSync('efiop');

  // ---- fileop (File management) ----
  const CCFile = function(r) { this.runtime = r; };
  CCFile.prototype.getInfo = function() {
    return {
      id: 'fileop',
      name: ccT('文件管理', 'Files'),
      color1: '#4CBF56', color2: '#389E3B', color3: '#389E3B',
      blocks: [
        { opcode: 'fileRead', blockType: 'reporter', text: ccT('读取文件[PATH]模式[MODE]大小[SIZE]', 'read file [PATH] mode [MODE] size [SIZE]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'boot.cfg' },
            MODE: { type: 'number', menu: 'FILE_MODE_MENU', defaultValue: 1 },
            SIZE: { type: 'number', menu: 'FILE_SIZE_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'fileWrite', blockType: 'command', text: ccT('写入文件[PATH]内容[CONTENT]模式[MODE]', 'write file [PATH] content [CONTENT] mode [MODE]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'output.txt' },
            CONTENT: { type: 'string', defaultValue: '' },
            MODE: { type: 'number', menu: 'FILE_MODE_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'fileList', blockType: 'reporter', text: ccT('列出目录[PATH]', 'list directory [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/' }
          }
        },
        { opcode: 'fileDelete', blockType: 'command', text: ccT('删除文件[PATH]', 'delete file [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'tmp.txt' }
          }
        },
        { opcode: 'fileCreate', blockType: 'command', text: ccT('创建文件[PATH]', 'create file [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'new.txt' }
          }
        },
        { opcode: 'fileExists', blockType: 'Boolean', text: ccT('文件存在?[PATH]', 'file exists? [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'boot.cfg' }
          }
        },
        { opcode: 'fileIsdir', blockType: 'Boolean', text: ccT('[PATH]文件夹是否存在?', 'folder exists? [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/' }
          }
        },
        { opcode: 'fileMkdir', blockType: 'command', text: ccT('新建文件夹[PATH]', 'make folder [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'newdir' }
          }
        },
        { opcode: 'fileRmdir', blockType: 'command', text: ccT('删除文件夹[PATH]', 'remove folder [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'newdir' }
          }
        },
        { opcode: 'fileNthSorted', blockType: 'reporter', text: ccT('目录[PATH]按时间排序第[N]个文件名', 'filename at index [N] in [PATH] sorted by time'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/' },
            N: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'fileCtime', blockType: 'reporter', text: ccT('文件[PATH]的创建时间', 'creation time of [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: 'boot.cfg' }
          }
        },
        { opcode: 'strCount', blockType: 'reporter', text: ccT('[STR]中[SUB]的数量', 'count of [SUB] in [STR]'),
          arguments: {
            STR: { type: 'string', defaultValue: 'abca' },
            SUB: { type: 'string', defaultValue: 'a' }
          }
        },
        { opcode: 'strSplit', blockType: 'reporter', text: ccT('使用[SEP]分割[STR]的第[N]项', 'item [N] of [STR] split by [SEP]'),
          arguments: {
            SEP: { type: 'string', defaultValue: '/' },
            STR: { type: 'string', defaultValue: '/system/max' },
            N: { type: 'number', defaultValue: 3 }
          }
        },
        { opcode: 'strParent', blockType: 'reporter', text: ccT('[PATH]的上一个目录', 'parent directory of [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/system/max/' }
          }
        },
        { opcode: 'strReplace', blockType: 'reporter', text: ccT('[STR]中[OLD]替换为[NEW]', 'replace [OLD] with [NEW] in [STR]'),
          arguments: {
            STR: { type: 'string', defaultValue: 'apple' },
            OLD: { type: 'string', defaultValue: 'pple' },
            NEW: { type: 'string', defaultValue: 'll' }
          }
        },
        { opcode: 'strSlice', blockType: 'reporter', text: ccT('从[START]到[END]解析文本[TEXT]', 'slice [TEXT] from [START] to [END]'),
          arguments: {
            START: { type: 'number', defaultValue: 2 },
            END: { type: 'number', defaultValue: 4 },
            TEXT: { type: 'string', defaultValue: '123456' }
          }
        },
        { opcode: 'strWrap', blockType: 'reporter', text: ccT('以最大限制[N]处理[TEXT]', 'wrap [TEXT] at width [N]'),
          arguments: {
            N: { type: 'number', defaultValue: 2 },
            TEXT: { type: 'string', defaultValue: '1234' }
          }
        },
        { opcode: 'strInsert', blockType: 'reporter', text: ccT('在[TEXT]的第[N]字符插入[INSERT]', 'insert [INSERT] into [TEXT] at char [N]'),
          arguments: {
            TEXT: { type: 'string', defaultValue: '2468' },
            N: { type: 'number', defaultValue: 2 },
            INSERT: { type: 'string', defaultValue: '23' }
          }
        },
        { opcode: 'strDelete', blockType: 'reporter', text: ccT('删除[TEXT]的第[N]项', 'delete item [N] from [TEXT]'),
          arguments: {
            TEXT: { type: 'string', defaultValue: 'apple' },
            N: { type: 'number', defaultValue: 1 }
          }
        },
        { opcode: 'getCwd', blockType: 'reporter', text: ccT('当前目录', 'current directory') },
        { opcode: 'setCwd', blockType: 'command', text: ccT('设置当前目录为[PATH]', 'set current directory to [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/' }
          }
        },
        { opcode: 'cdPath', blockType: 'command', text: ccT('进入目录[PATH]', 'enter directory [PATH]'),
          arguments: {
            PATH: { type: 'string', defaultValue: '/' }
          }
        },
        { opcode: 'fileCopy', blockType: 'command', text: ccT('拷贝文件/文件夹[SRC]到[DST]', 'copy [SRC] to [DST]'),
          arguments: {
            SRC: { type: 'string', defaultValue: '/1.txt' },
            DST: { type: 'string', defaultValue: '/deskop/1.txt' }
          }
        },
        { opcode: 'fileRename', blockType: 'command', text: ccT('重命名文件/文件夹[OLD]为[NEW]', 'rename [OLD] to [NEW]'),
          arguments: {
            OLD: { type: 'string', defaultValue: 'a.txt' },
            NEW: { type: 'string', defaultValue: 'b.txt' }
          }
        },
        { opcode: 'fileSuccess', blockType: 'Boolean', text: ccT('文件操作成功?', 'file operation success?') }
      ],
      menus: {
        FILE_MODE_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('文本','文本'),value:'0'},
            {text:ccT('2进制','2进制'),value:'1'}
          ]
        },
        FILE_SIZE_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('中等','中等'),value:'0'},
            {text:ccT('大','大'),value:'1'},
            {text:ccT('超大','超大'),value:'2'},
            {text:ccT('特大','特大'),value:'3'},
            {text:ccT('最大限制','最大限制'),value:'4'}
          ]
        }
      }
    };
  };
  CCFile.prototype.fileRead = function() { return ''; };
  CCFile.prototype.fileWrite = function() {};
  CCFile.prototype.fileList = function() { return ''; };
  CCFile.prototype.fileExists = function() { return 0; };
  CCFile.prototype.fileIsdir = function() { return 0; };
  CCFile.prototype.fileDelete = function() {};
  CCFile.prototype.fileCreate = function() {};
  CCFile.prototype.fileMkdir = function() {};
  CCFile.prototype.fileRmdir = function() {};
  CCFile.prototype.strCount = function() { return 0; };
  CCFile.prototype.strSplit = function() { return ''; };
  CCFile.prototype.strParent = function() { return ''; };
  CCFile.prototype.strReplace = function() { return ''; };
  CCFile.prototype.strSlice = function() { return ''; };
  CCFile.prototype.strInsert = function() { return ''; };
  CCFile.prototype.strDelete = function() { return ''; };
  CCFile.prototype.getCwd = function() { return ''; };
  CCFile.prototype.setCwd = function() {};
  CCFile.prototype.cdPath = function() {};
  CCFile.prototype.fileCopy = function() {};
  CCFile.prototype.fileRename = function() {};
  CCFile.prototype.fileSuccess = function() { return 0; };
  CCFile.prototype.fileNthSorted = function() { return ''; };
  CCFile.prototype.fileCtime = function() { return ''; };
  vm.extensionManager.addBuiltinExtension('fileop', CCFile);
  vm.extensionManager.loadExtensionIdSync('fileop');

  // ---- uefisound (Sound) ----
  const CCSound = function(r) { this.runtime = r; };
  CCSound.prototype.getInfo = function() {
    return {
      id: 'uefisound',
      name: ccT('声音', 'Sound'),
      color1: '#9966FF', color2: '#7744DD', color3: '#7744DD',
      blocks: [
        { opcode: 'beep', blockType: 'command', text: ccT('蜂鸣器[FREQ]Hz持续[MS]毫秒', 'beep [FREQ] Hz for [MS] ms'),
          arguments: {
            FREQ: { type: 'number', defaultValue: 1000 },
            MS: { type: 'number', defaultValue: 200 }
          }
        },
        { opcode: 'playTone', blockType: 'command', text: ccT('播放赫兹[FREQ]音量[VOL]持续[MS]毫秒', 'play tone [FREQ] vol [VOL] for [MS] ms'),
          arguments: {
            FREQ: { type: 'number', defaultValue: 1000 },
            VOL: { type: 'number', defaultValue: 60 },
            MS: { type: 'number', defaultValue: 500 }
          }
        }
      ]
    };
  };
  CCSound.prototype.beep = function() {};
  CCSound.prototype.playTone = function() {};
  vm.extensionManager.addBuiltinExtension('uefisound', CCSound);
  vm.extensionManager.loadExtensionIdSync('uefisound');

  // ---- pen (Graphics) ----
  const CCPen = function(r) { this.runtime = r; };
  CCPen.prototype.getInfo = function() {
    return {
      id: 'pen',
      name: ccT('画笔', 'Graphics'),
      color1: '#2E7D32', color2: '#1B5E20', color3: '#1B5E20',
      blocks: [
        { opcode: 'gfxInit', blockType: 'command', text: ccT('进入图形模式', 'enter graphics mode') },
        { opcode: 'gfxClear', blockType: 'command', text: ccT('清空图形', 'clear graphics') },
        { opcode: 'gfxCache', blockType: 'command', text: ccT('屏幕缓冲[MODE]', 'screen buffering [MODE]'),
          arguments: {
            MODE: { type: 'number', menu: 'CACHE_MENU', defaultValue: 0 }
          }
        },
        { opcode: 'gfxFlip', blockType: 'command', text: ccT('刷新屏幕', 'refresh screen') },
        { opcode: 'gfxMode', blockType: 'command', text: ccT('设置分辨率为[WIDTH]x[HEIGHT]', 'set resolution to [WIDTH]x[HEIGHT]'),
          arguments: {
            WIDTH: { type: 'number', defaultValue: 1920 },
            HEIGHT: { type: 'number', defaultValue: 1080 }
          }
        },
        { opcode: 'setPixel', blockType: 'command', text: ccT('在x[X]y[Y]绘制颜色为[COLOR]的像素（hex:[COLORH]）透明度[ALPHA]', '在x[X]y[Y]绘制颜色为[COLOR]的像素（hex:[COLORH]）透明度[ALPHA]'),
          arguments: {
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'fillRect', blockType: 'command', text: ccT('在x[X]y[Y]到x[X2]y[Y2]填充颜色[COLOR]的长方形（hex:[COLORH]）透明度[ALPHA]', '在x[X]y[Y]到x[X2]y[Y2]填充颜色[COLOR]的长方形（hex:[COLORH]）透明度[ALPHA]'),
          arguments: {
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            X2: { type: 'number', defaultValue: 100 },
            Y2: { type: 'number', defaultValue: 100 },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'drawText', blockType: 'command', text: ccT('使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]绘制文本[TEXT]（hex:[COLORH]）透明度[ALPHA]', '使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]绘制文本[TEXT]（hex:[COLORH]）透明度[ALPHA]'),
          arguments: {
            FONT: { type: 'string', defaultValue: '' },
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            SIZE: { type: 'number', defaultValue: 24 },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            TEXT: { type: 'string', defaultValue: 'Hello' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'drawTextOutline', blockType: 'command', text: ccT('使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]绘制文本[TEXT]轮廓粗细[OSIZE]轮廓颜色[OLCOLOR]（hex:[COLORH]）（轮廓hex:[OLCOLORH]）透明度[ALPHA]', '使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]绘制文本[TEXT]轮廓粗细[OSIZE]轮廓颜色[OLCOLOR]（hex:[COLORH]）（轮廓hex:[OLCOLORH]）透明度[ALPHA]'),
          arguments: {
            FONT: { type: 'string', defaultValue: '' },
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            SIZE: { type: 'number', defaultValue: 24 },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            TEXT: { type: 'string', defaultValue: 'Hello' },
            OSIZE: { type: 'number', defaultValue: 1 },
            OLCOLOR: { type: 'color', defaultValue: '#000000' },
            OLCOLORH: { type: 'string', defaultValue: '' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'drawBmp', blockType: 'command', text: ccT('在x[X]y[Y]显示位图[HEX]透明度[ALPHA]', '在x[X]y[Y]显示位图[HEX]透明度[ALPHA]'),
          arguments: {
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            HEX: { type: 'string', defaultValue: '' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'drawTextEsc', blockType: 'command', text: ccT('使用矢量字体[FONT]在x[X]y[Y]大小[SIZE]显示[TEXT]（默认白色，支持转义）透明度[ALPHA]', '使用矢量字体[FONT]在x[X]y[Y]大小[SIZE]显示[TEXT]（默认白色，支持转义）透明度[ALPHA]'),
          arguments: {
            FONT: { type: 'string', defaultValue: '' },
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            SIZE: { type: 'number', defaultValue: 24 },
            TEXT: { type: 'string', defaultValue: 'Hello' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'drawTextBg', blockType: 'command', text: ccT('使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]背景[BG]绘制文本[TEXT]（hex:[COLORH]）（背景hex:[BGH]）透明度[ALPHA]', '使用矢量字体[FONT]在x[X]y[Y]以字体大小[SIZE]颜色[COLOR]背景[BG]绘制文本[TEXT]（hex:[COLORH]）（背景hex:[BGH]）透明度[ALPHA]'),
          arguments: {
            FONT: { type: 'string', defaultValue: '' },
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            SIZE: { type: 'number', defaultValue: 24 },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            TEXT: { type: 'string', defaultValue: 'Hello' },
            BG: { type: 'color', defaultValue: '#000000' },
            BGH: { type: 'string', defaultValue: '' },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        },
        { opcode: 'fonText', blockType: 'command', text: ccT('使用位图字体[HEX]在x[X]y[Y]显示文本[TEXT]颜色为[COLOR]大小[SIZE]（hex:[COLORH]）透明度[ALPHA]', '使用位图字体[HEX]在x[X]y[Y]显示文本[TEXT]颜色为[COLOR]大小[SIZE]（hex:[COLORH]）透明度[ALPHA]'),
          arguments: {
            HEX: { type: 'string', defaultValue: '' },
            X: { type: 'number', defaultValue: 0 },
            Y: { type: 'number', defaultValue: 0 },
            TEXT: { type: 'string', defaultValue: 'Hello' },
            COLOR: { type: 'color', defaultValue: '#FFFFFF' },
            COLORH: { type: 'string', defaultValue: '' },
            SIZE: { type: 'number', defaultValue: 1 },
            ALPHA: { type: 'number', defaultValue: 0 }
          }
        }
      ],
      menus: {
        CACHE_MENU: {
          acceptReporters: true,
          items: [
            {text:ccT('直写屏幕','直写屏幕'),value:'0'},
            {text:ccT('缓存（手动刷新）','缓存（手动刷新）'),value:'1'},
            {text:ccT('缓存（自动刷新）','缓存（自动刷新）'),value:'2'}
          ]
        }
      }
    };
  };
  CCPen.prototype.gfxInit = function() {};
  CCPen.prototype.gfxClear = function() {};
  CCPen.prototype.gfxCache = function() {};
  CCPen.prototype.gfxFlip = function() {};
  CCPen.prototype.gfxMode = function() {};
  CCPen.prototype.fillRect = function() {};
  CCPen.prototype.setPixel = function() {};
  CCPen.prototype.drawText = function() {};
  CCPen.prototype.drawTextOutline = function() {};
  CCPen.prototype.drawTextEsc = function() {};
  CCPen.prototype.drawBmp = function() {};
  CCPen.prototype.drawTextBg = function() {};
  CCPen.prototype.fonText = function() {};
  vm.extensionManager.addBuiltinExtension('pen', CCPen);
  vm.extensionManager.loadExtensionIdSync('pen');

  vm.emitWorkspaceUpdate();
  console.log('UEFI extensions loaded');
}

export {registerExtensions};
