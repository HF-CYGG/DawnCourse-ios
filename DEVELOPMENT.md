# Dawn Course iOS (Expo) 开发指南

## 1. 环境准备

本工程基于 Expo + React Native 开发，主要支持 iOS 端。
由于包含原生代码（Widget / App Group），**不能使用 Expo Go** 进行完整调试，必须使用 **Development Build (Dev Client)**。

### 1.1 前置要求
- Node.js (LTS)
- EAS CLI: `npm install -g eas-cli`
- Expo CLI: `npm install -g expo-cli`
- (可选) Watchman

## 2. 构建开发包 (Development Build)

由于我们在 Windows 环境下开发，无法直接运行 `npx expo run:ios`。
需要通过 EAS Build 云端构建开发包，然后安装到测试设备或模拟器上。

### 2.1 构建命令

**真机调试 (需注册 Apple Developer 设备)**:
```bash
eas build --profile development --platform ios
```

**模拟器调试 (无需证书)**:
```bash
eas build --profile development-simulator --platform ios
```

### 2.2 安装开发包
构建完成后，EAS 会提供一个二维码或下载链接。
- **真机**: 扫码安装（需先安装 Expo Go 或者是 ad-hoc 分发的 IPA）。*注意：iOS 16+ 需要开启开发者模式。*
- **模拟器**: 下载 `.tar.gz` 解压后拖入模拟器。

## 3. 启动调试

安装好开发包后，在 Windows 终端启动 Metro 服务：

```bash
cd ios-app
npx expo start --dev-client
```

手机/模拟器上打开 "Dawn Course" (Dev Client 版本)，连接到电脑的 IP 地址（需在同一局域网）。

## 4. 关键注意事项

- **原生模块变更**: 每当安装了新的包含原生代码的库（如 `expo-sqlite`, `expo-notifications`），或者修改了 `ios/` 目录下的原生代码（Widget），都必须**重新构建 Development Build**。
- **App Group**: 本项目使用了 App Group (`group.com.dawncourse.ios`) 来共享数据给 Widget。请确保在 Apple Developer Portal 中创建了该 App Group 并在 Identifier 中启用。
- **Widget Extension**: 
  - 本项目包含一个 Widget Extension (`DawnWidget`)。
  - 由于 Expo 自动配置原生 Target 较为复杂，目前的 `plugins/withWidget.js` 主要负责配置 App Group Entitlements。
  - **初次配置建议**:
    1. 执行 `npx expo prebuild` 生成 `ios` 目录。
    2. 打开 `ios/DawnCourse.xcworkspace`。
    3. File -> New -> Target -> Widget Extension -> 命名为 `DawnWidget` (取消勾选 "Include Configuration Intent")。
    4. 将 `plugins/widget/DawnWidget.swift` 的内容复制到 Xcode 生成的 `DawnWidget.swift` 中。
    5. 确保主 App Target 和 DawnWidget Target 都添加了 "App Groups" Capability，并勾选 `group.com.dawncourse.ios`。
    6. 此后，EAS Build 会尝试复用配置，或者需要编写更高级的 Config Plugin 来自动化此步骤（建议参考 Expo 官方文档关于 "Expo Modules" 或 "Config Plugins" 的高级用法）。

- **Bundle ID**: `com.dawncourse.ios`。

## 5. 功能模块说明

- **核心数据**: SQLite (`src/core/data/database.ts`) 存储课程与学期。
- **小组件**: 
  - JS 侧生成快照 (`src/shared/widget/WidgetSnapshotGenerator.ts`)。
  - 写入 App Group (`src/shared/widget/WidgetSnapshotWriter.ts`)。
  - Swift 侧读取并渲染 (`plugins/widget/DawnWidget.swift`)。
- **后台刷新**: 
  - `src/core/tasks/backgroundFetch.ts`: 注册后台任务，每 30 分钟尝试刷新 Widget。
- **通知**:
  - `src/core/services/NotificationService.ts`: 处理权限与静默推送。
  - `src/core/services/NotificationScheduler.ts`: 每次数据变更时重排未来 7 天的课前提醒。

## 6. 发布流程

**内测 (TestFlight)**:
```bash
eas build --profile preview --platform ios
```

**正式发布 (App Store)**:
```bash
eas build --profile production --platform ios
eas submit --platform ios
```
