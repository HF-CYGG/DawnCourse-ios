import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { SemesterRepository } from '../../src/core/data/repository';
import { Semester } from '../../src/core/domain/models/Semester';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../src/shared/utils/dateUtils';

export default function SemesterListScreen() {
  const router = useRouter();
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useFocusEffect(
    useCallback(() => {
      // 页面聚焦时刷新学期列表，确保显示最新状态
      loadSemesters();
    }, [])
  );

  const loadSemesters = async () => {
    const list = await SemesterRepository.getAllSemesters();
    setSemesters(list);
  };

  const handleSetCurrent = async (id: string) => {
    // 设为当前学期（并自动刷新列表）
    await SemesterRepository.setCurrentSemester(id);
    loadSemesters();
  };

  const handleDelete = (id: string) => {
    Alert.alert('确认删除', '删除学期将同时删除该学期下的所有课程，且不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          // 删除学期及其下课程（数据库外键联动）
          await SemesterRepository.deleteSemester(id);
          loadSemesters();
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Semester }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={styles.itemContent} 
        onPress={() => router.push(`/semester/${item.id}`)}
      >
        <View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDate}>
            {formatDate(new Date(item.startDate))} 开学 · 共 {item.weekCount} 周
          </Text>
        </View>
        {item.isCurrent && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>当前</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.actions}>
        {!item.isCurrent && (
          <TouchableOpacity onPress={() => handleSetCurrent(item.id)} style={styles.actionButton}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerButton}>关闭</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>学期管理</Text>
        <TouchableOpacity onPress={() => router.push('/semester/new')}>
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={semesters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无学期，请点击右上角添加</Text>
          </View>
        }
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
  listContent: {
    paddingVertical: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#8e8e93',
  },
  tag: {
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  actionButton: {
    marginLeft: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
