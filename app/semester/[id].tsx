import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SemesterRepository } from '../../src/core/data/repository';
import { Semester } from '../../src/core/domain/models/Semester';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { formatDate } from '../../src/shared/utils/dateUtils';

export default function SemesterEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';
  
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [weekCount, setWeekCount] = useState('20');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!isNew && typeof id === 'string') {
      loadSemester(id);
    }
  }, [id]);

  const loadSemester = async (semesterId: string) => {
    const sem = await SemesterRepository.getSemesterById(semesterId);
    if (sem) {
      setName(sem.name);
      setStartDate(new Date(sem.startDate));
      setWeekCount(sem.weekCount.toString());
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入学期名称');
      return;
    }
    const weeks = parseInt(weekCount);
    if (isNaN(weeks) || weeks <= 0) {
      Alert.alert('错误', '请输入有效的周数');
      return;
    }

    const semesterData: Semester = {
      id: isNew ? Crypto.randomUUID() : (id as string),
      name,
      startDate: startDate.getTime(),
      weekCount: weeks,
      isCurrent: isNew ? false : (await SemesterRepository.getSemesterById(id as string))?.isCurrent || false,
    };

    if (isNew) {
      // If it's the first semester, make it current
      const all = await SemesterRepository.getAllSemesters();
      if (all.length === 0) {
        semesterData.isCurrent = true;
      }
      await SemesterRepository.addSemester(semesterData);
    } else {
      await SemesterRepository.updateSemester(semesterData);
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? '新建学期' : '编辑学期'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { fontWeight: 'bold' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <View style={styles.inputRow}>
            <Text style={styles.label}>名称</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：2023-2024 秋季学期"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>开学日期</Text>
            <TouchableOpacity onPress={() => {
              setTempStartDate(startDate);
              setShowDatePicker(true);
            }}>
              <Text style={styles.valueText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerCancel}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setStartDate(tempStartDate);
                    setShowDatePicker(false);
                  }}>
                    <Text style={styles.pickerDone}>完成</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={tempStartDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempStartDate(selectedDate);
                    }
                  }}
                  style={{ height: 200, width: '100%' }}
                />
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            <Text style={styles.label}>周数</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              keyboardType="number-pad"
              value={weekCount}
              onChangeText={setWeekCount}
            />
          </View>
        </View>
      </ScrollView>
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
  formGroup: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#c8c7cc',
    paddingLeft: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
  },
  label: {
    fontSize: 17,
    color: '#000',
    width: 80,
  },
  input: {
    flex: 1,
    fontSize: 17,
    textAlign: 'right',
  },
  valueText: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
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
