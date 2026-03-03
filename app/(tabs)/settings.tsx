import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { SettingsRepository } from '../../src/core/data/repository';
import { Settings } from '../../src/core/domain/models/Settings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UpdateService } from '../../src/core/services/UpdateService';
import { NotificationService } from '../../src/core/services/NotificationService';
import { NotificationScheduler } from '../../src/core/services/NotificationScheduler';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);

  useFocusEffect(
    useCallback(() => {
      // 页面聚焦时刷新设置，保证展示与存储同步
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const s = await SettingsRepository.getSettings();
    setSettings(s);
  };

  const toggleNotifications = async (value: boolean) => {
    if (!settings) return;
    // 切换提醒开关时，尝试请求权限并同步调度
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert('提醒未开启', '未授予通知权限');
        return;
      }
    }
    const newSettings = { ...settings, enableNotifications: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ enableNotifications: value });
    if (value) {
      await NotificationScheduler.scheduleReminders();
    }
  };

  // 切换周末显示
  const toggleShowWeekend = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, showWeekend: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ showWeekend: value });
  };

  const toggleDynamicColor = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, dynamicColor: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ dynamicColor: value });
  };

  const toggleShowSidebarTime = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, showSidebarTime: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ showSidebarTime: value });
  };

  const toggleShowSidebarIndex = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, showSidebarIndex: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ showSidebarIndex: value });
  };

  const toggleShowDateInHeader = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, showDateInHeader: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ showDateInHeader: value });
  };

  // 切换非本周课程显示
  const toggleHideNonCurrentWeekCourses = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, hideNonCurrentWeekCourses: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ hideNonCurrentWeekCourses: value });
  };

  // 选择主题模式
  const selectTheme = () => {
    if (!settings) return;
    Alert.alert('选择主题', '', [
      { text: '跟随系统', onPress: () => updateTheme('system') },
      { text: '浅色', onPress: () => updateTheme('light') },
      { text: '深色', onPress: () => updateTheme('dark') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新主题设置
  const updateTheme = async (theme: string) => {
    if (!settings) return;
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ theme });
  };

  // 选择新建课程默认时长
  const selectDefaultCourseDuration = () => {
    if (!settings) return;
    Alert.alert('默认课程时长', '', [
      { text: '1 节', onPress: () => updateDefaultCourseDuration(1) },
      { text: '2 节', onPress: () => updateDefaultCourseDuration(2) },
      { text: '3 节', onPress: () => updateDefaultCourseDuration(3) },
      { text: '4 节', onPress: () => updateDefaultCourseDuration(4) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新默认课程时长
  const updateDefaultCourseDuration = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, defaultCourseDuration: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ defaultCourseDuration: value });
  };

  // 选择单节高度
  const selectCourseItemHeight = () => {
    if (!settings) return;
    Alert.alert('单节高度', '', [
      { text: '44 px', onPress: () => updateCourseItemHeight(44) },
      { text: '48 px', onPress: () => updateCourseItemHeight(48) },
      { text: '52 px', onPress: () => updateCourseItemHeight(52) },
      { text: '56 px', onPress: () => updateCourseItemHeight(56) },
      { text: '60 px', onPress: () => updateCourseItemHeight(60) },
      { text: '64 px', onPress: () => updateCourseItemHeight(64) },
      { text: '68 px', onPress: () => updateCourseItemHeight(68) },
      { text: '72 px', onPress: () => updateCourseItemHeight(72) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新单节高度
  const updateCourseItemHeight = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, courseItemHeight: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ courseItemHeight: value });
  };

  // 选择卡片圆角
  const selectCourseCardRadius = () => {
    if (!settings) return;
    Alert.alert('卡片圆角', '', [
      { text: '0 px', onPress: () => updateCourseCardRadius(0) },
      { text: '4 px', onPress: () => updateCourseCardRadius(4) },
      { text: '6 px', onPress: () => updateCourseCardRadius(6) },
      { text: '8 px', onPress: () => updateCourseCardRadius(8) },
      { text: '10 px', onPress: () => updateCourseCardRadius(10) },
      { text: '12 px', onPress: () => updateCourseCardRadius(12) },
      { text: '16 px', onPress: () => updateCourseCardRadius(16) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新卡片圆角
  const updateCourseCardRadius = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, courseCardRadius: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ courseCardRadius: value });
  };

  const toggleShowCourseIcons = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, showCourseIcons: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ showCourseIcons: value });
  };

  const selectCourseCardOpacity = () => {
    if (!settings) return;
    Alert.alert('卡片不透明度', '', [
      { text: '30%', onPress: () => updateCourseCardOpacity(0.3) },
      { text: '40%', onPress: () => updateCourseCardOpacity(0.4) },
      { text: '50%', onPress: () => updateCourseCardOpacity(0.5) },
      { text: '60%', onPress: () => updateCourseCardOpacity(0.6) },
      { text: '70%', onPress: () => updateCourseCardOpacity(0.7) },
      { text: '80%', onPress: () => updateCourseCardOpacity(0.8) },
      { text: '90%', onPress: () => updateCourseCardOpacity(0.9) },
      { text: '100%', onPress: () => updateCourseCardOpacity(1) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateCourseCardOpacity = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, courseCardOpacity: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ courseCardOpacity: value });
  };

  // 选择网格线宽
  const selectGridLineWidth = () => {
    if (!settings) return;
    Alert.alert('网格线宽', '', [
      { text: '0.5 px', onPress: () => updateGridLineWidth(0.5) },
      { text: '1.0 px', onPress: () => updateGridLineWidth(1) },
      { text: '1.5 px', onPress: () => updateGridLineWidth(1.5) },
      { text: '2.0 px', onPress: () => updateGridLineWidth(2) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新网格线宽
  const updateGridLineWidth = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, gridLineWidth: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ gridLineWidth: value });
  };

  const selectGridLineColor = () => {
    if (!settings) return;
    Alert.alert('网格线颜色', '', [
      { text: '浅灰', onPress: () => updateGridLineColor('#E5E7EB') },
      { text: '灰色', onPress: () => updateGridLineColor('#C8C7CC') },
      { text: '蓝色', onPress: () => updateGridLineColor('#007AFF') },
      { text: '绿色', onPress: () => updateGridLineColor('#34C759') },
      { text: '橙色', onPress: () => updateGridLineColor('#FF9500') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateGridLineColor = async (value: string) => {
    if (!settings) return;
    const newSettings = { ...settings, gridLineColor: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ gridLineColor: value });
  };

  const selectGridLineAlpha = () => {
    if (!settings) return;
    Alert.alert('网格线透明度', '', [
      { text: '20%', onPress: () => updateGridLineAlpha(0.2) },
      { text: '40%', onPress: () => updateGridLineAlpha(0.4) },
      { text: '60%', onPress: () => updateGridLineAlpha(0.6) },
      { text: '80%', onPress: () => updateGridLineAlpha(0.8) },
      { text: '100%', onPress: () => updateGridLineAlpha(1) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateGridLineAlpha = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, gridLineAlpha: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ gridLineAlpha: value });
  };

  const selectGridLineStyle = () => {
    if (!settings) return;
    Alert.alert('网格线样式', '', [
      { text: '实线', onPress: () => updateGridLineStyle('solid') },
      { text: '虚线', onPress: () => updateGridLineStyle('dashed') },
      { text: '点线', onPress: () => updateGridLineStyle('dotted') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateGridLineStyle = async (value: 'solid' | 'dashed' | 'dotted') => {
    if (!settings) return;
    const newSettings = { ...settings, gridLineStyle: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ gridLineStyle: value });
  };

  const selectFontStyle = () => {
    if (!settings) return;
    Alert.alert('字体风格', '', [
      { text: '系统默认', onPress: () => updateFontStyle('system') },
      { text: '衬线字体', onPress: () => updateFontStyle('serif') },
      { text: '等宽字体', onPress: () => updateFontStyle('monospace') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateFontStyle = async (value: 'system' | 'serif' | 'monospace') => {
    if (!settings) return;
    const newSettings = { ...settings, fontStyle: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ fontStyle: value });
  };

  const selectWallpaperMode = () => {
    if (!settings) return;
    Alert.alert('壁纸显示模式', '', [
      { text: '裁剪适应', onPress: () => updateWallpaperMode('crop') },
      { text: '拉伸填充', onPress: () => updateWallpaperMode('fill') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateWallpaperMode = async (value: 'crop' | 'fill') => {
    if (!settings) return;
    const newSettings = { ...settings, wallpaperMode: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ wallpaperMode: value });
  };

  const selectBackgroundBlur = () => {
    if (!settings) return;
    Alert.alert('背景模糊程度', '', [
      { text: '0', onPress: () => updateBackgroundBlur(0) },
      { text: '10', onPress: () => updateBackgroundBlur(10) },
      { text: '20', onPress: () => updateBackgroundBlur(20) },
      { text: '30', onPress: () => updateBackgroundBlur(30) },
      { text: '40', onPress: () => updateBackgroundBlur(40) },
      { text: '60', onPress: () => updateBackgroundBlur(60) },
      { text: '80', onPress: () => updateBackgroundBlur(80) },
      { text: '100', onPress: () => updateBackgroundBlur(100) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateBackgroundBlur = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, backgroundBlur: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ backgroundBlur: value });
  };

  const selectBackgroundBrightness = () => {
    if (!settings) return;
    Alert.alert('背景亮度', '', [
      { text: '60%', onPress: () => updateBackgroundBrightness(0.6) },
      { text: '70%', onPress: () => updateBackgroundBrightness(0.7) },
      { text: '80%', onPress: () => updateBackgroundBrightness(0.8) },
      { text: '90%', onPress: () => updateBackgroundBrightness(0.9) },
      { text: '100%', onPress: () => updateBackgroundBrightness(1) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateBackgroundBrightness = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, backgroundBrightness: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ backgroundBrightness: value });
  };

  const selectTransparency = () => {
    if (!settings) return;
    Alert.alert('背景遮罩浓度', '', [
      { text: '0%', onPress: () => updateTransparency(0) },
      { text: '10%', onPress: () => updateTransparency(0.1) },
      { text: '20%', onPress: () => updateTransparency(0.2) },
      { text: '30%', onPress: () => updateTransparency(0.3) },
      { text: '40%', onPress: () => updateTransparency(0.4) },
      { text: '50%', onPress: () => updateTransparency(0.5) },
      { text: '60%', onPress: () => updateTransparency(0.6) },
      { text: '70%', onPress: () => updateTransparency(0.7) },
      { text: '80%', onPress: () => updateTransparency(0.8) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const updateTransparency = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, transparency: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ transparency: value });
  };

  const pickWallpaper = async () => {
    if (!settings) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const directory = `${FileSystem.Paths.document.uri}wallpaper`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const fileName = asset.name || `wallpaper_${Date.now()}`;
    const targetUri = `${directory}/${fileName}`;
    if (asset.uri !== targetUri) {
      await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    }
    const newSettings = { ...settings, wallpaper: targetUri };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ wallpaper: targetUri });
  };

  const clearWallpaper = async () => {
    if (!settings) return;
    const newSettings = { ...settings, wallpaper: undefined };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ wallpaper: undefined });
  };

  // 选择提前提醒时间
  const selectNotificationAdvance = () => {
    if (!settings) return;
    Alert.alert('提前提醒时间', '', [
      { text: '5 分钟', onPress: () => updateNotificationAdvance(5) },
      { text: '10 分钟', onPress: () => updateNotificationAdvance(10) },
      { text: '15 分钟', onPress: () => updateNotificationAdvance(15) },
      { text: '20 分钟', onPress: () => updateNotificationAdvance(20) },
      { text: '30 分钟', onPress: () => updateNotificationAdvance(30) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  // 更新提前提醒时间并重新调度
  const updateNotificationAdvance = async (value: number) => {
    if (!settings) return;
    const newSettings = { ...settings, notificationAdvanceMinutes: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ notificationAdvanceMinutes: value });
    if (newSettings.enableNotifications) {
      await NotificationScheduler.scheduleReminders();
    }
  };

  const togglePersistentNotification = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, enablePersistentNotification: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ enablePersistentNotification: value });
    if (value) {
      Alert.alert('提示', 'iOS 不支持常驻通知，将仅保存设置。');
    }
  };

  const toggleAutoMute = async (value: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, enableAutoMute: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ enableAutoMute: value });
    if (value) {
      Alert.alert('提示', 'iOS 不支持自动静音，将仅保存设置。');
    }
  };

  // 打开开源地址
  const openSourceUrl = () => {
    Linking.openURL('https://github.com/HF-CYGG/DawnCourse');
  };

  const checkUpdate = () => {
    UpdateService.checkUpdate(true);
  };

  const renderItem = (label: string, value?: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.itemRight}>
        {value && <Text style={styles.itemValue}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
      </View>
    </TouchableOpacity>
  );

  // 主题显示文案
  const getThemeLabel = (theme: string) => {
    if (theme === 'system') return '跟随系统';
    if (theme === 'light') return '浅色';
    if (theme === 'dark') return '深色';
    return theme;
  };

  // 网格线宽显示文案
  const getGridLineWidthLabel = (value: number) => {
    const text = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
    return `${text} px`;
  };

  const getGridLineStyleLabel = (value: 'solid' | 'dashed' | 'dotted') => {
    if (value === 'solid') return '实线';
    if (value === 'dashed') return '虚线';
    return '点线';
  };

  const getFontStyleLabel = (value: 'system' | 'serif' | 'monospace') => {
    if (value === 'serif') return '衬线字体';
    if (value === 'monospace') return '等宽字体';
    return '系统默认';
  };

  const getOpacityLabel = (value: number) => `${Math.round(value * 100)}%`;

  const getTransparencyLabel = (value: number) => `${Math.round(value * 100)}%`;

  const getWallpaperModeLabel = (value: 'crop' | 'fill') => (value === 'fill' ? '拉伸填充' : '裁剪适应');

  const getGridLineColorLabel = (value: string) => value.toUpperCase();

  const getGridLineAlphaLabel = (value: number) => `${Math.round(value * 100)}%`;

  const getBackgroundBlurLabel = (value: number) => `${Math.round(value)}`;

  const getBackgroundBrightnessLabel = (value: number) => `${Math.round(value * 100)}%`;

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.headerTitle}>设置</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>常规</Text>
          <View style={styles.sectionContent}>
             {renderItem('学期管理', undefined, () => router.push('/semester/index'))}
             {renderItem('作息时间', undefined, () => router.push('/settings/time'))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>显示</Text>
          <View style={styles.sectionContent}>
            {renderItem('主题', getThemeLabel(settings.theme), selectTheme)}
            {renderItem(
              '动态取色',
              undefined,
              undefined,
              <Switch value={settings.dynamicColor} onValueChange={toggleDynamicColor} />
            )}
            {renderItem('字体风格', getFontStyleLabel(settings.fontStyle), selectFontStyle)}
            {renderItem(
              '自定义壁纸',
              settings.wallpaper ? '已设置' : '未设置',
              pickWallpaper,
              settings.wallpaper ? (
                <TouchableOpacity onPress={clearWallpaper}>
                  <Text style={styles.inlineAction}>清除</Text>
                </TouchableOpacity>
              ) : undefined
            )}
            {settings.wallpaper && renderItem('壁纸显示模式', getWallpaperModeLabel(settings.wallpaperMode), selectWallpaperMode)}
            {renderItem('背景遮罩浓度', getTransparencyLabel(settings.transparency), selectTransparency)}
            {renderItem('背景模糊程度', getBackgroundBlurLabel(settings.backgroundBlur), selectBackgroundBlur)}
            {renderItem('背景亮度', getBackgroundBrightnessLabel(settings.backgroundBrightness), selectBackgroundBrightness)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>课表</Text>
          <View style={styles.sectionContent}>
            {renderItem(
              '显示周末',
              undefined,
              undefined,
              <Switch value={settings.showWeekend} onValueChange={toggleShowWeekend} />
            )}
            {renderItem(
              '显示侧边栏时间',
              undefined,
              undefined,
              <Switch value={settings.showSidebarTime} onValueChange={toggleShowSidebarTime} />
            )}
            {renderItem(
              '显示侧边栏节次',
              undefined,
              undefined,
              <Switch value={settings.showSidebarIndex} onValueChange={toggleShowSidebarIndex} />
            )}
            {renderItem(
              '显示表头日期',
              undefined,
              undefined,
              <Switch value={settings.showDateInHeader} onValueChange={toggleShowDateInHeader} />
            )}
            {renderItem(
              '隐藏非本周课程',
              undefined,
              undefined,
              <Switch value={settings.hideNonCurrentWeekCourses} onValueChange={toggleHideNonCurrentWeekCourses} />
            )}
            {renderItem('新建课程默认时长', `${settings.defaultCourseDuration} 节`, selectDefaultCourseDuration)}
            {renderItem('单节高度', `${settings.courseItemHeight} px`, selectCourseItemHeight)}
            {renderItem('卡片圆角', `${settings.courseCardRadius} px`, selectCourseCardRadius)}
            {renderItem('卡片不透明度', getOpacityLabel(settings.courseCardOpacity), selectCourseCardOpacity)}
            {renderItem('网格线宽', getGridLineWidthLabel(settings.gridLineWidth), selectGridLineWidth)}
            {renderItem('网格线样式', getGridLineStyleLabel(settings.gridLineStyle), selectGridLineStyle)}
            {renderItem('网格线颜色', getGridLineColorLabel(settings.gridLineColor), selectGridLineColor)}
            {renderItem('网格线透明度', getGridLineAlphaLabel(settings.gridLineAlpha), selectGridLineAlpha)}
            {renderItem(
              '课程图标',
              undefined,
              undefined,
              <Switch value={settings.showCourseIcons} onValueChange={toggleShowCourseIcons} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>提醒</Text>
          <View style={styles.sectionContent}>
             {renderItem(
               '课前提醒', 
               undefined, 
               undefined, 
               <Switch value={settings.enableNotifications} onValueChange={toggleNotifications} />
             )}
             {settings.enableNotifications && renderItem(
               '提前时间', 
               `${settings.notificationAdvanceMinutes} 分钟`,
               selectNotificationAdvance
             )}
             {renderItem(
               '常驻通知栏',
               undefined,
               undefined,
               <Switch value={settings.enablePersistentNotification} onValueChange={togglePersistentNotification} />
             )}
             {renderItem(
               '课后自动静音',
               undefined,
               undefined,
               <Switch value={settings.enableAutoMute} onValueChange={toggleAutoMute} />
             )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>关于</Text>
          <View style={styles.sectionContent}>
            {renderItem('检查更新', `v${Constants.expoConfig?.version || '1.0.0'}`, checkUpdate)}
            {renderItem('开源地址', 'GitHub', openSourceUrl)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS Grouped Background
  },
  scrollView: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 10,
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#c8c7cc',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc', // Separator
    marginLeft: 16, // Inset separator
  },
  itemLabel: {
    fontSize: 17,
    color: '#000',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16, // Offset the inset
  },
  itemValue: {
    fontSize: 17,
    color: '#8e8e93',
    marginRight: 6,
  },
  inlineAction: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
});
