import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SettingsRepository } from '../../src/core/data/repository';
import { SectionTime } from '../../src/core/domain/models/Settings';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SectionTimeSettingsScreen() {
  const router = useRouter();
  const [times, setTimes] = useState<SectionTime[]>([]);
  const [editingIndex, setEditingIndex] = useState<{ index: number, field: 'start' | 'end' } | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    // 首次进入页面时加载当前节次时间配置
    loadTimes();
  }, []);

  const loadTimes = async () => {
    const settings = await SettingsRepository.getSettings();
    setTimes(settings.sectionTimes);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmTime = () => {
    if (editingIndex) {
      const hours = tempDate.getHours().toString().padStart(2, '0');
      const minutes = tempDate.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const newTimes = [...times];
      if (editingIndex.field === 'start') {
        newTimes[editingIndex.index].start = timeStr;
      } else {
        newTimes[editingIndex.index].end = timeStr;
      }
      setTimes(newTimes);
      setEditingIndex(null);
    }
  };

  const openTimePicker = (index: number, field: 'start' | 'end') => {
    // 打开时间选择器，并以当前节次时间作为初始值
    const timeStr = field === 'start' ? times[index].start : times[index].end;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempDate(date);
    setEditingIndex({ index, field });
  };

  const handleSave = async () => {
    // 保存作息时间配置到本地设置
    await SettingsRepository.updateSettings({ sectionTimes: times });
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>作息时间</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { fontWeight: 'bold' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {times.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.label}>第 {index + 1} 节</Text>
            <View style={styles.timeContainer}>
              <TouchableOpacity onPress={() => openTimePicker(index, 'start')} style={styles.timeButton}>
                <Text style={styles.timeText}>{item.start}</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>-</Text>
              <TouchableOpacity onPress={() => openTimePicker(index, 'end')} style={styles.timeButton}>
                <Text style={styles.timeText}>{item.end}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {editingIndex && (
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setEditingIndex(null)}>
                <Text style={styles.pickerCancel}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmTime}>
                <Text style={styles.pickerDone}>完成</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={{ height: 200, width: '100%' }}
            />
          </View>
        </View>
      )}
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
  content: {
    paddingTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 17,
    color: '#007AFF',
  },
  separator: {
    marginHorizontal: 8,
    color: '#666',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  pickerCancel: {
    fontSize: 17,
    color: '#666',
  },
  pickerDone: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
