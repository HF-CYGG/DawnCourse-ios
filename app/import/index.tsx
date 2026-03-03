import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { CourseRepository, SemesterRepository } from '../../src/core/data/repository';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { SettingsRepository } from '../../src/core/data/repository';
import { parseICS, expandToCourses } from '../../src/shared/import/icsParser';

// 导入入口页面：
// - 强智教务：通过内置脚本在 WebView 中解析页面并回传课程
// - ICS 文件：选择 .ics 文件后解析并映射为课程项

export default function ImportScreen() {
  const router = useRouter();

  const handleImportQZ = () => {
    // 跳转至网页导入页面
    router.push('/import/web');
  };

  const handleImportICS = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/calendar', // 选择 ICS 日历文件
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      // 读取 ICS 文件文本内容（UTF-8）
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' as any });
      const semester = await SemesterRepository.getCurrentSemester();
      if (!semester) {
        Alert.alert('错误', '请先创建学期');
        return;
      }
      const settings = await SettingsRepository.getSettings();
      // 解析 ICS → 展开事件 → 映射为课程项
      const raw = parseICS(content);
      const mapped = expandToCourses(raw, settings, semester);
      let saved = 0;
      for (const item of mapped) {
        const course = {
          id: String(Date.now()) + '_' + (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(item))).slice(0, 8),
          ...item
        };
        try {
          await CourseRepository.addCourse(course);
          saved++;
        } catch (e) {
          console.warn('保存课程失败', e);
        }
      }
      Alert.alert('成功', `从 ICS 导入了 ${saved} 门课程`);
    } catch (e) {
      console.error(e);
      Alert.alert('错误', '文件选取失败');
    }
  };

  const items = [
    {
      id: 'qz',
      title: '强智教务系统',
      subtitle: '适配大多数强智教务系统学校',
      icon: 'globe-outline',
      onPress: handleImportQZ,
    },
    {
      id: 'ics',
      title: 'ICS 日历文件',
      subtitle: '导入 .ics 格式的日历文件',
      icon: 'document-text-outline',
      onPress: handleImportICS,
    },
    // Add WakeUp or others
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>关闭</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>导入课程</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={item.onPress}>
            <Ionicons name={item.icon as any} size={28} color="#007AFF" style={styles.icon} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
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
  list: {
    marginTop: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
  },
  icon: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
});
