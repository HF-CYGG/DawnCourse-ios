import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { Course } from '../../src/core/domain/models/Course';
import { Semester } from '../../src/core/domain/models/Semester';
import { CourseRepository, SemesterRepository, SettingsRepository } from '../../src/core/data/repository';
import { calculateCurrentWeek, getDayOfWeek } from '../../src/shared/utils/dateUtils';
import { TimetableLayoutEngine } from '../../src/shared/layout/TimetableLayoutEngine';
import { SectionTime } from '../../src/core/domain/models/Settings';

const applyAlphaToHex = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hex;
};

export default function TimetableScreen() {
  const router = useRouter();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [sectionTimes, setSectionTimes] = useState<SectionTime[]>([]);
  // 设置项：是否隐藏非本周课程、是否显示周末
  const [hideNonCurrentWeekCourses, setHideNonCurrentWeekCourses] = useState(true);
  const [showWeekend, setShowWeekend] = useState(true);
  const [showSidebarTime, setShowSidebarTime] = useState(true);
  const [showSidebarIndex, setShowSidebarIndex] = useState(true);
  const [showDateInHeader, setShowDateInHeader] = useState(false);
  // 设置项：课表单节高度、卡片圆角、网格线宽
  const [courseItemHeight, setCourseItemHeight] = useState(60);
  const [courseCardRadius, setCourseCardRadius] = useState(6);
  const [gridLineWidth, setGridLineWidth] = useState(0.5);
  const [courseCardOpacity, setCourseCardOpacity] = useState(1);
  const [gridLineStyle, setGridLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [gridLineColor, setGridLineColor] = useState('#E5E7EB');
  const [gridLineAlpha, setGridLineAlpha] = useState(1);
  const [showCourseIcons, setShowCourseIcons] = useState(true);
  const [fontStyle, setFontStyle] = useState<'system' | 'serif' | 'monospace'>('system');
  const [wallpaperUri, setWallpaperUri] = useState<string | undefined>(undefined);
  const [wallpaperMode, setWallpaperMode] = useState<'crop' | 'fill'>('crop');
  const [transparency, setTransparency] = useState(0);
  const [backgroundBlur, setBackgroundBlur] = useState(0);
  const [backgroundBrightness, setBackgroundBrightness] = useState(1);
  
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
    // 同步显示相关设置，确保课表布局与用户配置一致
    setHideNonCurrentWeekCourses(settings.hideNonCurrentWeekCourses);
    setShowWeekend(settings.showWeekend);
    setShowSidebarTime(settings.showSidebarTime);
    setShowSidebarIndex(settings.showSidebarIndex);
    setShowDateInHeader(settings.showDateInHeader);
    setCourseItemHeight(settings.courseItemHeight);
    setCourseCardRadius(settings.courseCardRadius);
    setGridLineWidth(settings.gridLineWidth);
    setCourseCardOpacity(settings.courseCardOpacity);
    setGridLineStyle(settings.gridLineStyle);
    setGridLineColor(settings.gridLineColor);
    setGridLineAlpha(settings.gridLineAlpha);
    setShowCourseIcons(settings.showCourseIcons);
    setFontStyle(settings.fontStyle);
    setWallpaperUri(settings.wallpaper);
    setWallpaperMode(settings.wallpaperMode);
    setTransparency(settings.transparency);
    setBackgroundBlur(settings.backgroundBlur);
    setBackgroundBrightness(settings.backgroundBrightness);

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

  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'monospace' ? 'monospace' : undefined;
  const textFontStyle = fontFamily ? { fontFamily } : undefined;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.push('/semester/index')} style={styles.weekButton}>
          <Text style={[styles.weekText, textFontStyle]}>第 {selectedWeek} 周</Text>
          <Ionicons name="chevron-down" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={[styles.subtitle, textFontStyle]}>
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
    const dayNumbers = showWeekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
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
        {dayNumbers.map((dayNumber) => {
          const dayLabel = days[dayNumber - 1];
          const isToday = semester && selectedWeek === currentWeek && dayNumber === todayDay;
          return (
            <View key={dayNumber} style={[styles.dayColumn, isToday && styles.todayColumn]}>
              <Text style={[styles.dayText, isToday && styles.todayText, textFontStyle]}>{dayLabel}</Text>
              {showDateInHeader && (
                <Text style={[styles.dateText, isToday && styles.todayText, textFontStyle]}>
                  {weekDates.length > 0 ? weekDates[dayNumber - 1]?.getDate() : ''}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTimetable = () => {
    // 网格高度基于每日最大节数（优先使用设置中的节次数量）
    const maxSections = sectionTimes.length > 0 ? sectionTimes.length : 12;
    const sections = Array.from({ length: maxSections }, (_, i) => i + 1);
    const dayCount = showWeekend ? 7 : 5;
    const sectionHeight = courseItemHeight;
    const gridHeight = sectionHeight * maxSections;
    const borderStyle = gridLineStyle;
    
    // 使用与安卓一致的“课表布局引擎”计算显示项（包含冲突分栏与背景课程层）
    const layoutItems = TimetableLayoutEngine.calculateLayoutItems(
      courses,
      selectedWeek,
      maxSections,
      hideNonCurrentWeekCourses
    ).filter(item => showWeekend || item.safeDayOfWeek <= 5);

    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.gridContainer}>
          {/* 左侧侧栏：显示节次编号与对应开始时间 */}
          <View style={styles.sidebar}>
            {sections.map(s => (
              <View key={s} style={[styles.sidebarCell, { height: sectionHeight }]}>
                {showSidebarIndex && <Text style={[styles.sidebarText, textFontStyle]}>{s}</Text>}
                {showSidebarTime && (
                  <Text style={[styles.sidebarTime, textFontStyle]}>
                    {sectionTimes[s-1] ? sectionTimes[s-1].start : ''}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* 课程网格：背景横线 + 每日竖线 + 课程块绝对定位 */}
          <View style={[styles.grid, { height: gridHeight }]}>
             {/* 背景横线：每节高度基于设置，提供视觉分隔 */}
             {sections.map(s => (
               <View
                 key={`line-${s}`}
                 style={[
                   styles.gridLine,
                   {
                     height: sectionHeight,
                     top: (s - 1) * sectionHeight,
                     borderBottomWidth: gridLineWidth,
                     borderStyle,
                     borderBottomColor: applyAlphaToHex(gridLineColor, gridLineAlpha),
                   }
                 ]}
               />
             ))}
             
             {/* 每日竖线：将网格等分为 5/7 列（根据设置隐藏周末） */}
             {Array.from({length: dayCount}).map((_, i) => (
                <View
                  key={`vline-${i}`}
                  style={[
                    styles.gridVLine,
                    {
                      left: `${(i) * (100 / dayCount)}%`,
                      borderLeftWidth: gridLineWidth,
                      borderStyle,
                      borderLeftColor: applyAlphaToHex(gridLineColor, gridLineAlpha),
                    }
                  ]}
                />
             ))}

            {/* Course Blocks（使用与安卓一致的分栏与背景课程规则） */}
            {layoutItems.map(item => {
              const top = (item.safeStartSection - 1) * sectionHeight;
              const height = (item.safeEndSection - item.safeStartSection + 1) * sectionHeight - 2;
              const dayWidthPercent = 100 / dayCount;
              const laneWidthPercent = dayWidthPercent / item.laneCount;
              const dayLeftPercent = (item.safeDayOfWeek - 1) * dayWidthPercent;
              const leftPercent = dayLeftPercent + item.laneIndex * laneWidthPercent;
              const baseOpacity = item.isCurrentWeek ? 1 : 0.6;
              const finalOpacity = Math.max(0, Math.min(1, baseOpacity * courseCardOpacity));
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
                      borderRadius: courseCardRadius,
                      opacity: finalOpacity,
                    }
                  ]}
                  onPress={() => router.push(`/course/${item.course.id}`)}
                >
                  <View style={styles.courseBlockContent}>
                    {showCourseIcons && <Ionicons name="book" size={12} color="#fff" style={styles.courseIcon} />}
                    <Text style={[styles.courseName, textFontStyle]} numberOfLines={3}>{item.course.name}</Text>
                    <Text style={[styles.courseLocation, textFontStyle]} numberOfLines={1}>{item.course.location}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  };

  const content = (
    <SafeAreaView style={[styles.container, wallpaperUri && styles.containerTransparent]} edges={['top']}>
      {renderHeader()}
      {renderWeekBar()}
      {renderTimetable()}
    </SafeAreaView>
  );

  if (!wallpaperUri) {
    return content;
  }

  return (
    <ImageBackground
      source={{ uri: wallpaperUri }}
      style={styles.wallpaperBackground}
      resizeMode={wallpaperMode === 'fill' ? 'stretch' : 'cover'}
      blurRadius={Math.round(backgroundBlur)}
    >
      <View style={[styles.wallpaperBrightnessMask, { backgroundColor: `rgba(0,0,0,${Math.max(0, Math.min(1, 1 - backgroundBrightness))})` }]}>
        <View style={[styles.wallpaperMask, { backgroundColor: `rgba(255,255,255,${transparency})` }]}>
          {content}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  wallpaperBackground: {
    flex: 1,
  },
  wallpaperBrightnessMask: {
    flex: 1,
  },
  wallpaperMask: {
    flex: 1,
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
    height: 60 * 12, // 默认高度（运行时会按设置覆盖）
  },
  gridLine: {
    height: 60,
    borderBottomWidth: 0,
    borderBottomColor: '#eee',
    width: '100%',
    position: 'absolute',
    top: 0, // 网格横线采用绝对定位以匹配课程块计算；简化实现
  },
  gridVLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 0,
    borderLeftColor: '#eee',
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
  courseIcon: {
    marginBottom: 2,
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
