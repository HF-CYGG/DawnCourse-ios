import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { SettingsRepository } from '../data/repository/SettingsRepository';

const UPDATE_URL = 'http://yyh163.xyz:10000/version.json';
const FALLBACK_URL = 'http://47.105.76.193/version.json';

// 与服务器 version.json 对应的数据结构
export interface VersionInfo {
  versionCode: number;
  versionName: string;
  type: 'standard' | 'bugfix' | 'security' | 'feature' | 'major';
  title: string;
  updateContent: string;
  downloadUrl: string;
  forceUpdate?: boolean;
  sha256?: string;
}

export const UpdateService = {
  async checkUpdate(isManual = false) {
    try {
      let versionInfo: VersionInfo | null = null;
      
      try {
        const response = await fetch(UPDATE_URL);
        if (response.ok) {
          versionInfo = await response.json();
        }
      } catch (e) {
        console.warn('主更新源访问失败，尝试备用源', e);
      }
      
      if (!versionInfo) {
        try {
          const response = await fetch(FALLBACK_URL);
          if (response.ok) {
            versionInfo = await response.json();
          }
        } catch (e) {
          console.error('备用更新源也不可用', e);
        }
      }
      
      if (!versionInfo) {
        if (isManual) Alert.alert('检查失败', '无法连接到更新服务器');
        return;
      }
      
      // 版本比较策略：
      // 1) 优先使用版本号（versionCode）进行比较
      // 2) 若本地未配置 versionCode，则回退为版本名（versionName）逐段比较
      const { versionCode: currentVersionCode, versionName: currentVersionName } = getCurrentVersion();
      
      const shouldUpdate =
        currentVersionCode > 0
          ? versionInfo.versionCode > currentVersionCode
          : compareVersionName(versionInfo.versionName, currentVersionName) > 0;

      if (shouldUpdate) {
        // 检查“忽略此版本”逻辑
        const settings = await SettingsRepository.getSettings();
        if (!isManual && settings.ignoreVersion === versionInfo.versionName && !versionInfo.forceUpdate) {
          return;
        }
        
        Alert.alert(
          versionInfo.title || '发现新版本',
          versionInfo.updateContent + '\n\n(iOS 用户请前往 TestFlight 或 App Store 更新)',
          [
            {
              text: '忽略',
              onPress: () => {
                if (!versionInfo?.forceUpdate) {
                   SettingsRepository.updateSettings({ ignoreVersion: versionInfo!.versionName });
                }
              },
              style: 'cancel'
            },
            {
              text: '前往更新',
              onPress: () => {
                // iOS 端应打开 App Store / TestFlight（此处打开配置中的链接）
                Linking.openURL(versionInfo!.downloadUrl);
              }
            }
          ],
          { cancelable: !versionInfo.forceUpdate }
        );
      } else {
        if (isManual) Alert.alert('已是最新', '当前版本已是最新版本');
      }
      
    } catch (e) {
      console.error('检查更新异常', e);
      if (isManual) Alert.alert('错误', '检查更新时发生错误');
    }
  }
};

// 读取当前应用版本信息
// 说明：优先读取配置中的 versionCode，便于与服务端数字版本对齐
const getCurrentVersion = () => {
  const versionName = Constants.expoConfig?.version ?? '0.0.0';
  const rawVersionCode = Constants.expoConfig?.extra?.versionCode;
  const versionCode = typeof rawVersionCode === 'number' ? rawVersionCode : 0;
  return { versionName, versionCode };
};

// 按“主.次.修订...”逐段比较版本名
const compareVersionName = (serverVersion: string, currentVersion: string) => {
  const serverParts = serverVersion.split('.').map(n => parseInt(n, 10));
  const currentParts = currentVersion.split('.').map(n => parseInt(n, 10));
  const maxLen = Math.max(serverParts.length, currentParts.length);
  for (let i = 0; i < maxLen; i++) {
    const s = serverParts[i] || 0;
    const c = currentParts[i] || 0;
    if (s > c) return 1;
    if (s < c) return -1;
  }
  return 0;
};
