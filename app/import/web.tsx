import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { CourseRepository, SemesterRepository } from '../../src/core/data/repository';
import * as Crypto from 'expo-crypto';
import { qzInjectionBootstrap } from '../../src/shared/import/qzScripts';
import { SettingsRepository } from '../../src/core/data/repository';

// 说明：脚本可从本地资源或远端拉取，本实现直接内置字符串以便离线可用
const INJECTED_JAVASCRIPT = qzInjectionBootstrap;

export default function WebImportScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [url, setUrl] = useState('https://jwxt.xxxx.edu.cn'); // Default or user input
  // 地址输入框状态：用于展示与编辑
  const [inputUrl, setInputUrl] = useState('https://jwxt.xxxx.edu.cn');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 读取上次访问地址，提升多次导入的便捷性
    const loadLastUrl = async () => {
      const settings = await SettingsRepository.getSettings();
      const lastUrl = settings.lastImportUrl || 'https://jwxt.xxxx.edu.cn';
      setUrl(lastUrl);
      setInputUrl(lastUrl);
    };
    loadLastUrl();
  }, []);

  // 应用输入地址并持久化
  const applyUrl = async () => {
    const nextUrl = inputUrl.trim();
    if (!nextUrl) {
      Alert.alert('提示', '请输入教务系统网址');
      return;
    }
    setUrl(nextUrl);
    await SettingsRepository.updateSettings({ lastImportUrl: nextUrl });
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'error') {
        Alert.alert('解析失败', data.message || '无法解析当前页面');
        return;
      }
      if (data.type === 'courses') {
        setLoading(true);
        const parsed = data.data as Array<any>;
        // 获取当前学期、设置
        const semester = await SemesterRepository.getCurrentSemester();
        if (!semester) {
           Alert.alert('错误', '请先创建学期');
           setLoading(false);
           return;
        }
        const settings = await SettingsRepository.getSettings();
        
        // 转换并保存
        let saved = 0;
        for (const item of parsed) {
          // weeks 未提供时，默认整个学期
          const weeks: number[] = Array.isArray(item.weeks) && item.weeks.length > 0
            ? item.weeks
            : Array.from({ length: semester.weekCount }, (_, i) => i + 1);
          const minWeek = Math.min(...weeks);
          const maxWeek = Math.max(...weeks);
          const course = {
            id: String(Date.now()) + '_' + (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(item))).slice(0, 8),
            semesterId: semester.id,
            name: String(item.name || '未命名课程'),
            teacher: item.teacher ? String(item.teacher) : undefined,
            location: item.location ? String(item.location) : undefined,
            dayOfWeek: Number(item.dayOfWeek) || 1,
            startSection: Number(item.startSection) || 1,
            duration: Number(item.duration) || 1,
            startWeek: minWeek || 1,
            endWeek: maxWeek || semester.weekCount,
            weekType: Number(item.weekType) || 0,
            color: '#007AFF',
            isModified: false,
            note: undefined,
            originId: undefined,
          };
          try {
            await CourseRepository.addCourse(course);
            saved++;
          } catch (e) {
            console.warn('保存课程失败', e);
          }
        }
        setLoading(false);
        Alert.alert('成功', `导入了 ${saved} 门课程`);
        router.back();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>网页导入</Text>
        <TouchableOpacity onPress={() => {
            // 手动触发脚本注入：执行页面内提取逻辑并通过 postMessage 返回结果
            webviewRef.current?.injectJavaScript(INJECTED_JAVASCRIPT);
        }}>
          <Text style={styles.headerButton}>提取</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.urlBar}>
        <TextInput
          style={styles.urlInput}
          value={inputUrl}
          onChangeText={setInputUrl}
          placeholder="输入教务系统网址"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={applyUrl}
        />
        <TouchableOpacity style={styles.urlAction} onPress={applyUrl}>
          <Text style={styles.urlActionText}>前往</Text>
        </TouchableOpacity>
      </View>
      {loading && (
        <View style={styles.loadingMask}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 8, color: '#333' }}>正在解析并保存...</Text>
        </View>
      )}
      <WebView
        ref={webviewRef}
        source={{ uri: url }} // 后续可增加 URL 输入与历史记录，适配不同学校入口
        onMessage={handleMessage}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  headerButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f2f2f7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d1d6',
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: '#d1d1d6',
  },
  urlAction: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  urlActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMask: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    zIndex: 9,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});
