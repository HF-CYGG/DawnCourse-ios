import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../src/core/data/database';
import { registerBackgroundFetchAsync } from '../src/core/tasks/backgroundFetch';
import { NotificationService } from '../src/core/services/NotificationService';
import { refreshWidget } from '../src/shared/widget';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      // 1. 初始化本地数据库（建表与迁移）
      await initDatabase();
      console.log('Database initialized');

      // 2. 注册后台任务：用于周期刷新 Widget 快照
      await registerBackgroundFetchAsync();

      // 3. 配置通知：注册处理器并申请权限，成功后获取推送令牌
      await NotificationService.setup();
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await NotificationService.getPushToken();
      }

      // 4. 首次刷新 Widget：保证桌面小组件在首次打开 App 时有数据
      await refreshWidget();
    }
    
    init();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="semester/index" options={{ presentation: 'modal', title: '学期管理' }} />
        <Stack.Screen name="semester/[id]" options={{ presentation: 'modal', title: '编辑学期' }} />
        <Stack.Screen name="import/index" options={{ presentation: 'modal', title: '导入课程' }} />
        <Stack.Screen name="import/web" options={{ presentation: 'modal', title: '网页导入' }} />
        <Stack.Screen name="settings/time" options={{ presentation: 'modal', title: '作息时间' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
