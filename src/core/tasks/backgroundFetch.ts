import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { refreshWidget } from '../../shared/widget';

export const WIDGET_REFRESH_TASK = 'WIDGET_SNAPSHOT_REFRESH';

// 在全局作用域定义后台抓取任务：
// 用途：周期性刷新小部件快照（系统约束下时间间隔可能不精确）
TaskManager.defineTask(WIDGET_REFRESH_TASK, async () => {
  try {
    console.log(`[BackgroundFetch] Task ${WIDGET_REFRESH_TASK} started`);
    const now = Date.now();
    
    // 刷新小部件快照
    // 说明：后台任务为显式触发，故强制刷新（force = true）
    await refreshWidget(true);
    
    console.log(`[BackgroundFetch] Task ${WIDGET_REFRESH_TASK} completed successfully`);
    // Return result
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error(`[BackgroundFetch] Task ${WIDGET_REFRESH_TASK} failed`, error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_REFRESH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(WIDGET_REFRESH_TASK, {
        minimumInterval: 60 * 30, // 最小 30 分钟（iOS 有系统限制）
        stopOnTerminate: false,   // 应用被终止时继续（尽力而为，受平台影响）
        startOnBoot: true,        // 开机自启（仅安卓生效）
      });
      console.log(`[BackgroundFetch] Registered task: ${WIDGET_REFRESH_TASK}`);
    } else {
      console.log(`[BackgroundFetch] Task already registered: ${WIDGET_REFRESH_TASK}`);
    }
  } catch (err) {
    console.error('[BackgroundFetch] 后台抓取任务注册失败', err);
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_REFRESH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(WIDGET_REFRESH_TASK);
      console.log(`[BackgroundFetch] Unregistered task: ${WIDGET_REFRESH_TASK}`);
    }
  } catch (err) {
    console.error('[BackgroundFetch] 后台抓取任务取消失败', err);
  }
}
