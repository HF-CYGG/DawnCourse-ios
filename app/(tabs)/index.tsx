import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { Course } from '../../src/core/domain/models/Course';
import { Semester } from '../../src/core/domain/models/Semester';
import { CourseRepository, SemesterRepository, SettingsRepository } from '../../src/core/data/repository';
import { calculateCurrentWeek, getDayOfWeek, formatDate } from '../../src/shared/utils/dateUtils';
import { isCourseActive } from '../../src/shared/utils/courseUtils';
import { TimetableLayoutEngine } from '../../src/shared/layout/TimetableLayoutEngine';
import { SectionTime } from '../../src/core/domain/models/Settings';

export default function TimetableScreen() {
  const router = useRouter();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [sectionTimes, setSectionTimes] = useState<SectionTime[]>([]);
  
  // 当页面获得焦点时刷新数据，确保课表显示最新学期与课程
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const sem = await SemesterRepository.getCurrentSemester();
    setSemester(sem);
    
    const settings = await SettingsRepository.getSettings();
    setSectionTimes(settings.sectionTimes);

    if (sem) {
      const week = calculateCurrentWeek(sem.startDate);
      setCurrentWeek(week);
      // 周次选择策略说明：
      // - 首次加载或组件状态为默认值时，将所选周重置为当前周
      // - 若用户已在本次挂载期间主动切换周次，则保持其选择，避免焦点切换导致周次跳变
      setSelectedWeek(prev => (prev === 1 && week !== 1 ? week : prev));
      
      const allCourses = await CourseRepository.getCoursesBySemester(sem.id);
      setCourses(allCourses);
    } else {
      setCourses([]);
      setCurrentWeek(1);
      setSelectedWeek(1);
    }
  };

  const handleAddCourse = () => {
    if (!semester) {
      Alert.alert('提示', '请先创建学期', [
        { text: '去创建', onPress: () => router.push('/semester/index') },
        { text: '取消', style: 'cancel' }
      ]);
      return;
    }
    router.push('/course/new');
  };

  const handleWeekChange = (week: number) => {
    if (week < 1 || (semester && week > semester.weekCount)) return;
    setSelectedWeek(week);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.push('/semester/index')} style={styles.weekButton}>
          <Text style={styles.weekText}>第 {selectedWeek} 周</Text>
          <Ionicons name="chevron-down" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.subtitle}>
          {semester ? (selectedWeek === currentWeek ? '本周' : '非本周') : '未设置学期'}
        </Text>
      </View>
      <View style={styles.headerRight}>
         <TouchableOpacity onPress={() => router.push('/import/index')} style={styles.iconButton}>
          <Ionicons name="cloud-download-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddCourse} style={styles.iconButton}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWeekBar = () => {
    // 表头显示“周一至周日”与对应日期，突出“今天”
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const today = new Date();
    const todayDay = getDayOfWeek(today); // 返回 1-7，其中 1 表示周一
    
    // 计算当前所选周的七天日期（基于学期起始日与周偏移）
    let weekDates: Date[] = [];
    if (semester) {
      const start = new Date(semester.startDate);
      // 周起始日计算：以学期开始日期为第 1 周的周起点，偏移 (selectedWeek - 1) * 7 天
      const weekStartTimestamp = start.getTime() + (selectedWeek - 1) * 7 * 24 * 60 * 60 * 1000;
      const weekStartDate = new Date(weekStartTimestamp);
      // 说明：若学校实际开学日不是周一，显示仍以起始日为基准连续 7 天；核心布局逻辑基于 dayOfWeek
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(weekStartDate.getDate() + i);
        weekDates.push(d);
      }
    }

    return (
      <View style={styles.weekBar}>
        <View style={styles.monthColumn}>
          <Text style={styles.monthText}>
            {weekDates.length > 0 ? (weekDates[0].getMonth() + 1) + '月' : ''}
          </Text>
        </View>
        {days.map((d, index) => {
          const isToday = semester && selectedWeek === currentWeek && (index + 1) === todayDay;
          return (
            <View key={index} style={[styles.dayColumn, isToday && styles.todayColumn]}>
              <Text style={[styles.dayText, isToday && styles.todayText]}>{d}</Text>
              <Text style={[styles.dateText, isToday && styles.todayText]}>
                {weekDates.length > 0 ? weekDates[index].getDate() : ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderTimetable = () => {
    // 网格高度基于每日最大节数（默认 12 节）
    const sections = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // 使用与安卓一致的“课表布局引擎”计算显示项（包含冲突分栏与背景课程层）
    const layoutItems = TimetableLayoutEngine.calculateLayoutItems(
      courses,
      selectedWeek,
      12,
      true // 暂时启用“隐藏非本周课程”，后续可从设置开关读取
    );

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {/* 左侧侧栏：显示节次编号与对应开始时间 */}
          <View style={styles.sidebar}>
            {sections.map(s => (
              <View key={s} style={styles.sidebarCell}>
                <Text style={styles.sidebarText}>{s}</Text>
                <Text style={styles.sidebarTime}>
                   {sectionTimes[s-1] ? sectionTimes[s-1].start : ''}
                </Text>
              </View>
            ))}
          </View>

          {/* 课程网格：背景虚线 + 每日竖线 + 课程块绝对定位 */}
          <View style={styles.grid}>
             {/* 背景横线：每节 60 高度，提供视觉分隔 */}
             {sections.map(s => (
               <View key={`line-${s}`} style={styles.gridLine} />
             ))}
             
             {/* 每日竖线：将网格等分为 7 列（周一至周日） */}
             {Array.from({length: 7}).map((_, i) => (
                <View key={`vline-${i}`} style={[styles.gridVLine, { left: `${(i) * (100/7)}%` }]} />
             ))}

            {/* Course Blocks（使用与安卓一致的分栏与背景课程规则） */}
            {layoutItems.map(item => {
              const top = (item.safeStartSection - 1) * 60;
              const height = (item.safeEndSection - item.safeStartSection + 1) * 60 - 2;
              const dayWidthPercent = 100 / 7;
              const laneWidthPercent = dayWidthPercent / item.laneCount;
              const dayLeftPercent = (item.safeDayOfWeek - 1) * dayWidthPercent;
              const leftPercent = dayLeftPercent + item.laneIndex * laneWidthPercent;
              return (
                <TouchableOpacity
                  key={`${item.course.id}-${item.laneIndex}-${item.safeStartSection}`}
                  style={[
                    styles.courseBlock,
                    {
                      top,
                      height,
                      left: `${leftPercent}%`,
                      width: `${laneWidthPercent}%`,
                      backgroundColor: item.course.color || '#007AFF',
                      opacity: item.isCurrentWeek ? 1 : 0.6,
                    }
                  ]}
                  onPress={() => router.push(`/course/${item.course.id}`)}
                >
                  <View style={styles.courseBlockContent}>
                    <Text style={styles.courseName} numberOfLines={3}>{item.course.name}</Text>
                    <Text style={styles.courseLocation} numberOfLines={1}>{item.course.location}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderWeekBar()}
      {renderTimetable()}
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  weekButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  weekBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  monthColumn: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 12,
    color: '#666',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayColumn: {
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  todayText: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 30,
    backgroundColor: '#f9f9f9',
  },
  sidebarCell: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  sidebarText: {
    fontSize: 12,
    color: '#333',
  },
  sidebarTime: {
    fontSize: 10,
    color: '#999',
  },
  grid: {
    flex: 1,
    position: 'relative',
    height: 60 * 12, // 每节高度按 60 像素计算，共 12 节
  },
  gridLine: {
    height: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    width: '100%',
    position: 'absolute',
    top: 0, // 网格横线采用绝对定位以匹配课程块计算；简化实现
  },
  gridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: '#eee',
  },
  courseBlock: {
    position: 'absolute',
    margin: 1,
    borderRadius: 6,
    overflow: 'hidden',
    padding: 2,
  },
  courseBlockContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  courseLocation: {
    fontSize: 9,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
  },
});
