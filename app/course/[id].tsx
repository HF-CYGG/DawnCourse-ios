import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { CourseRepository, SemesterRepository } from '../../src/core/data/repository';
import { Course } from '../../src/core/domain/models/Course';
import * as Crypto from 'expo-crypto';

const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
  '#8E8E93', '#C7C7CC', '#D1D1D6', '#E5E5EA'
];

export default function CourseEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [location, setLocation] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startSection, setStartSection] = useState(1);
  const [duration, setDuration] = useState(2);
  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(16);
  const [weekType, setWeekType] = useState(0); // 0: all, 1: odd, 2: even
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (!isNew && typeof id === 'string') {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    const course = await CourseRepository.getCourseById(courseId);
    if (course) {
      setName(course.name);
      setTeacher(course.teacher || '');
      setLocation(course.location || '');
      setDayOfWeek(course.dayOfWeek);
      setStartSection(course.startSection);
      setDuration(course.duration);
      setStartWeek(course.startWeek);
      setEndWeek(course.endWeek);
      setWeekType(course.weekType);
      setColor(course.color || COLORS[0]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('错误', '请输入课程名称');
      return;
    }

    const currentSemester = await SemesterRepository.getCurrentSemester();
    if (!currentSemester) {
      Alert.alert('错误', '当前没有选中的学期');
      return;
    }

    const courseData: Course = {
      id: isNew ? Crypto.randomUUID() : (id as string),
      semesterId: currentSemester.id,
      name,
      teacher,
      location,
      dayOfWeek,
      startSection,
      duration,
      startWeek,
      endWeek,
      weekType,
      color,
      isModified: true,
    };

    if (isNew) {
      await CourseRepository.addCourse(courseData);
    } else {
      await CourseRepository.updateCourse(courseData);
    }

    router.back();
  };

  const renderSection = (label: string, value: string | number, onValueChange: (v: string) => void, keyboardType: any = 'default') => (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value.toString()}
        onChangeText={onValueChange}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? '新建课程' : '编辑课程'}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { fontWeight: 'bold' }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          {renderSection('课程名称', name, setName)}
          {renderSection('教师', teacher, setTeacher)}
          {renderSection('地点', location, setLocation)}
        </View>

        <View style={[styles.formGroup, { marginTop: 20 }]}>
          {renderSection('星期', dayOfWeek, v => setDayOfWeek(parseInt(v) || 1), 'number-pad')}
          {renderSection('开始节次', startSection, v => setStartSection(parseInt(v) || 1), 'number-pad')}
          {renderSection('持续节数', duration, v => setDuration(parseInt(v) || 1), 'number-pad')}
        </View>

        <View style={[styles.formGroup, { marginTop: 20 }]}>
          {renderSection('开始周', startWeek, v => setStartWeek(parseInt(v) || 1), 'number-pad')}
          {renderSection('结束周', endWeek, v => setEndWeek(parseInt(v) || 1), 'number-pad')}
          <View style={styles.inputRow}>
             <Text style={styles.label}>周期类型</Text>
             <View style={styles.typeSelector}>
               {['每周', '单周', '双周'].map((type, index) => (
                 <TouchableOpacity 
                   key={index} 
                   onPress={() => setWeekType(index)}
                   style={[styles.typeButton, weekType === index && styles.typeButtonActive]}
                 >
                   <Text style={[styles.typeText, weekType === index && styles.typeTextActive]}>{type}</Text>
                 </TouchableOpacity>
               ))}
             </View>
          </View>
        </View>

        <View style={[styles.formGroup, { marginTop: 20, borderBottomWidth: 0 }]}>
          <Text style={[styles.label, { paddingVertical: 12 }]}>颜色</Text>
          <View style={styles.colorGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorCircle, { backgroundColor: c }, color === c && styles.colorCircleActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>
        
        {!isNew && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => {
              Alert.alert('确认删除', '确定要删除此课程吗？', [
                { text: '取消', style: 'cancel' },
                { text: '删除', style: 'destructive', onPress: async () => {
                  await CourseRepository.deleteCourse(id as string);
                  router.back();
                }}
              ]);
            }}
          >
            <Text style={styles.deleteText}>删除课程</Text>
          </TouchableOpacity>
        )}
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
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#F2F2F7',
    marginLeft: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#333',
  },
  typeTextActive: {
    color: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 16,
    paddingRight: 16,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginBottom: 12,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#000',
  },
  deleteButton: {
    marginTop: 40,
    marginBottom: 40,
    backgroundColor: '#fff',
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#c8c7cc',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '500',
  },
});
