import { Alert, Linking } from 'react-native';
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
      
      // 版本比较：
      // 说明：当前版本号应从原生信息读取（示例使用占位值）
      const currentVersionCode = 100; // Placeholder, sync with app.json
      
      if (versionInfo.versionCode > currentVersionCode) {
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
