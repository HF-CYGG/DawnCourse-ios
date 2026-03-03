import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { SettingsRepository } from '../../src/core/data/repository';
import { Settings } from '../../src/core/domain/models/Settings';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { UpdateService } from '../../src/core/services/UpdateService';

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
    const newSettings = { ...settings, enableNotifications: value };
    setSettings(newSettings);
    await SettingsRepository.updateSettings({ enableNotifications: value });
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
            {renderItem('主题', settings.theme === 'system' ? '跟随系统' : settings.theme)}
            {/* 可在此扩展更多显示相关设置 */}
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
               () => {
                 // 简化逻辑：当前版本固定为 20 分钟，可在未来版本改为可编辑弹窗
                 Alert.alert('提示', '暂支持固定提前 20 分钟');
               }
             )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>关于</Text>
          <View style={styles.sectionContent}>
            {renderItem('检查更新', 'v1.0.0', checkUpdate)}
            {renderItem('开源地址', 'GitHub', () => {})}
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
});
