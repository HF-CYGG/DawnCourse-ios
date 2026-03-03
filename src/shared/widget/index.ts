import WidgetCenter from 'react-native-widget-center';
import { WidgetSnapshotGenerator } from './WidgetSnapshotGenerator';
import { WidgetSnapshotWriter } from './WidgetSnapshotWriter';

let isRefreshing = false; // 刷新中的互斥标记，避免并发刷新
let lastRefreshTime = 0;  // 上次刷新时间戳
const THROTTLE_MS = 2000; // 刷新节流：2 秒内最多刷新一次

export async function refreshWidget(force: boolean = false): Promise<void> {
  const now = Date.now();
  if (!force && isRefreshing) return;
  if (!force && now - lastRefreshTime < THROTTLE_MS) return;

  try {
    isRefreshing = true;
    console.log('开始刷新小部件快照...');
    
    // 1. 生成快照（聚合今日课程等数据）
    const snapshot = await WidgetSnapshotGenerator.generateSnapshot();
    
    // 2. 写入 App Group（供 WidgetKit 读取）
    await WidgetSnapshotWriter.writeSnapshot(snapshot);
    
    // 3. 请求系统刷新所有时间线（触发小部件重载）
    WidgetCenter.reloadAllTimelines();
    
    lastRefreshTime = Date.now();
    console.log('小部件刷新成功');
  } catch (e) {
    console.error('小部件刷新失败', e);
  } finally {
    isRefreshing = false;
  }
}
