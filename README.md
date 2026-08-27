# Turbowarp-UEFI-编辑器
真正实现Turbowarp制作UEFI操作系统的可行性，只是一个测试项目

基于 [TurboWarp Desktop](https://github.com/TurboWarp/desktop) 修改的第三方 UEFI 操作系统开发工具。通过 Scratch 可视化积木编程生成 C 代码，编译为 UEFI 应用程序

## 功能特性

### 新功能

| 名称 | 功能 |
|------|------|
| 编译 | 将 Scratch 项目编译为 C 代码 |
| UEFI | 文本模式、固件服务、输入设备、内存管理、进程调度 |
| 文件管理 | FAT32 文件系统操作、字符串处理 |
| 声音 | 蜂鸣器、音频播放 |
| 画笔 | 图形模式、像素绘制、矢量字体、BMP 渲染 |

### 代码生成

Scratch 积木 → C 源码 (`main.c`) → Clang 交叉编译 → UEFI PE 可执行文件

- 自动处理变量声明、函数定义、任务调度
- 支持多任务协作式调度
- 支持 `open_` 前缀的系统协议注册

## 变量与函数类型

### 变量命名规则

| 前缀 | 效果 | 示例 |
|------|------|------|
| `string_` | 编译时自动声明为字符串类型 | `string_name` → `char name[1024]` |
| `big_` | 增大字符串缓冲区（32MB） | `big_buffer` → `char big_buffer[33554432]` |

> **注意：** `big_` 前缀会分配大量内存，请谨慎使用。

### 自制积木（函数）命名规则

| 前缀 | 效果 | 示例 |
|------|------|------|
| `open_` | 自动注册为系统调用（syscall），可被其他程序调用 | `open_read_file` |

以 `open_` 开头的自制积木会被编译为系统协议，其他 EFI 程序可以通过 `_sys_call()` 调用这些函数。

## C 语言特性

积木编程本质上是 C 语言的语法糖。在积木中使用文本输入时，支持 C 转义符：

例如：`Hello\nWorld` 会在输出时换行。

## 镜像与预置文件

如果你需要在软盘镜像中预先放置文件可以将文件放入以下目录：

```
c/qemu/.efi_boot/
```

该目录中的所有文件会在构建 QEMU 镜像时被自动复制到 FAT32 引导分区的根目录。

### 示例

```
c/qemu/.efi_boot/
├── EFI/
│   ├── BOOT  
│      ├── BOOTX64.EFI 
```
## 快速入门

链接: https://pan.baidu.com/s/1f6bjuCqzUAG5KANfxDh1uA?pwd=TWUE 提取码: TWUE 

## asar构建

### 前置要求

- Node.js 16-18
- npm
- Clang

### 安装依赖

```bash
npm install
```

### 开发构建

```bash
npm run webpack:compile
```

### 生产构建

```bash
npm run webpack:prod
```

### 启动

```bash
npm run electron:start
```

## 许可证

基于 [TurboWarp Desktop](https://github.com/TurboWarp/desktop) 修改，遵循 [GPL-3.0](LICENSE) 许可证。
