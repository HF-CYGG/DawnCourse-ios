import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { WidgetSnapshot } from '../../core/domain/models/WidgetSnapshot';

// 说明：需与 iOS 工程的 App Group 标识一致，供主应用与 WidgetKit 共享数据
const APP_GROUP_IDENTIFIER = 'group.com.dawncourse.ios';
const WIDGET_SNAPSHOT_KEY = 'widget_snapshot_v1';

export const WidgetSnapshotWriter = {
  async writeSnapshot(snapshot: WidgetSnapshot): Promise<void> {
    try {
      // 将快照序列化为 JSON 字符串，便于 Swift 端使用 JSONDecoder 解码
      await SharedGroupPreferences.setItem(
        WIDGET_SNAPSHOT_KEY,
        JSON.stringify(snapshot),
        APP_GROUP_IDENTIFIER
      );
      console.log('已写入小部件快照至 App Group:', APP_GROUP_IDENTIFIER);
    } catch (e) {
      console.error('写入小部件快照失败', e);
      // 开发阶段（模拟器）若未正确配置 App Group，写入可能失败，此处仅记录日志
    }
  }
};
