import * as Notifications from 'expo-notifications';
import { refreshWidget } from '../../shared/widget';
import * as TaskManager from 'expo-task-manager';
import { WIDGET_REFRESH_TASK } from '../tasks/backgroundFetch';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

// 定义“后台通知”任务：用于处理静默推送（content-available: 1），以执行小部件刷新等操作
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
  if (error) {
    console.error('[NotificationService] 后台通知任务失败', error);
    return;
  }
  
  if (data) {
    console.log('[NotificationService] 收到后台通知:', data);
    // 静默推送：用于刷新桌面小部件等无需 UI 干预的操作
    const payload = (data as any)?.notification?.request?.content?.data ?? (data as any)?.notification?.data;
    if (payload?.type === 'WIDGET_REFRESH') {
      console.log('静默推送触发小部件刷新');
      await refreshWidget(true);
    }
  }
});

export const NotificationService = {
  // 初始化通知行为（横幅/列表/声音/角标）
  async setup() {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        } as Notifications.NotificationBehavior;
      },
    });
    
    // 注册后台通知任务：
    // - 用于处理静默推送（content-available: 1）
    // - iOS 需要启用 Info.plist 的 remote-notification 能力（由 expo-notifications 插件处理）
    try {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('已注册后台通知任务');
    } catch (e) {
      console.log('后台通知任务注册失败（可能已注册或模拟器不支持）', e);
    }
  },

  async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('用户未授予通知权限');
      return false;
    }
    return true;
  },

  async getPushToken() {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo 推送令牌:', token);
      return token;
    } catch (e) {
      console.error('获取推送令牌失败', e);
      return null;
    }
  },

  // 处理静默推送逻辑：用于刷新小部件等后台操作
  async handleSilentPush(notification: Notifications.Notification) {
    const content = notification.request.content;
    // 判定是否为用于刷新小部件的静默推送
    if (content.data?.type === 'WIDGET_REFRESH') {
      console.log('收到用于刷新小部件的静默推送');
      await refreshWidget(true);
    }
  }
};
