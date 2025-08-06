import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useTodoStore } from '../stores/todoStore';
import CameraComponent from './CameraComponent';

const { width: screenWidth } = Dimensions.get('window');

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MyComponents = () => {
  const [hasPermission, setHasPermission] = useState<{
    camera: boolean | null;
    location: boolean | null;
    notifications: boolean | null;
  }>({
    camera: null,
    location: null,
    notifications: null,
  });
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [newTodoText, setNewTodoText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCamera, setShowCamera] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const {
    todos,
    filter,
    addTodo,
    toggleTodo,
    deleteTodo,
    setFilter,
    clearCompleted,
    getFilteredTodos,
  } = useTodoStore();

  useEffect(() => {
    requestPermissions();
    startAnimations();
  }, []);

  const requestPermissions = async () => {
    // 위치 권한
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    
    // 알림 권한
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();

    setHasPermission({
      camera: false, // 카메라는 별도 컴포넌트에서 처리
      location: locationStatus === 'granted',
      notifications: notificationStatus === 'granted',
    });
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCurrentLocation = async () => {
    if (hasPermission.location) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        Alert.alert(
          '위치 정보',
          `위도: ${location.coords.latitude}\n경도: ${location.coords.longitude}`
        );
      } catch (error) {
        Alert.alert('오류', '위치를 가져올 수 없습니다.');
      }
    }
  };

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim(), selectedPriority);
      setNewTodoText('');
      Alert.alert('성공', '할일이 추가되었습니다!');
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return '#ff4444';
      case 'medium':
        return '#ffaa00';
      case 'low':
        return '#44ff44';
      default:
        return '#666666';
    }
  };

  const getPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'remove-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  if (showCamera) {
    return <CameraComponent onClose={() => setShowCamera(false)} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>React Native 데모 앱</Text>
        <Text style={styles.subtitle}>다양한 기능들을 체험해보세요</Text>
      </Animated.View>

      {/* 권한 상태 표시 */}
      <Animated.View
        style={[
          styles.permissionSection,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.sectionTitle}>권한 상태</Text>
        <View style={styles.permissionGrid}>
          <View style={styles.permissionItem}>
            <Ionicons
              name={hasPermission.camera ? 'camera' : 'camera-outline'}
              size={24}
              color={hasPermission.camera ? '#4CAF50' : '#FF5722'}
            />
            <Text style={styles.permissionText}>카메라</Text>
          </View>
          <View style={styles.permissionItem}>
            <Ionicons
              name={hasPermission.location ? 'location' : 'location-outline'}
              size={24}
              color={hasPermission.location ? '#4CAF50' : '#FF5722'}
            />
            <Text style={styles.permissionText}>위치</Text>
          </View>
          <View style={styles.permissionItem}>
            <Ionicons
              name={hasPermission.notifications ? 'notifications' : 'notifications-off'}
              size={24}
              color={hasPermission.notifications ? '#4CAF50' : '#FF5722'}
            />
            <Text style={styles.permissionText}>알림</Text>
          </View>
        </View>
      </Animated.View>

      {/* 카메라 및 위치 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>디바이스 기능</Text>
        
        {/* 카메라 버튼 */}
        <TouchableOpacity style={styles.button} onPress={() => setShowCamera(true)}>
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.buttonText}>카메라 열기</Text>
        </TouchableOpacity>
        
        {/* 위치 정보 */}
        {hasPermission.location && (
          <>
            <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
              <Ionicons name="location" size={20} color="white" />
              <Text style={styles.buttonText}>현재 위치 가져오기</Text>
            </TouchableOpacity>
            {location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  위도: {location.coords.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  경도: {location.coords.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* 할일 관리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>할일 관리 (Zustand)</Text>
        
        {/* 새 할일 추가 */}
        <View style={styles.addTodoSection}>
          <TextInput
            style={styles.input}
            placeholder="새 할일을 입력하세요"
            value={newTodoText}
            onChangeText={setNewTodoText}
            onSubmitEditing={handleAddTodo}
          />
          <View style={styles.priorityButtons}>
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: selectedPriority === priority ? getPriorityColor(priority) : '#f0f0f0',
                  },
                ]}
                onPress={() => setSelectedPriority(priority)}
              >
                <Ionicons
                  name={getPriorityIcon(priority)}
                  size={16}
                  color={selectedPriority === priority ? 'white' : '#666'}
                />
                <Text
                  style={[
                    styles.priorityText,
                    { color: selectedPriority === priority ? 'white' : '#666' },
                  ]}
                >
                  {priority.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.buttonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {/* 필터 버튼 */}
        <View style={styles.filterSection}>
          {(['all', 'active', 'completed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                { backgroundColor: filter === filterType ? '#007AFF' : '#f0f0f0' },
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === filterType ? 'white' : '#666' },
                ]}
              >
                {filterType === 'all' ? '전체' : filterType === 'active' ? '진행중' : '완료'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 할일 목록 */}
        <View style={styles.todoList}>
          {getFilteredTodos().map((todo) => (
            <Animated.View
              key={todo.id}
              style={[
                styles.todoItem,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.todoContent}
                onPress={() => toggleTodo(todo.id)}
              >
                <Ionicons
                  name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={todo.completed ? '#4CAF50' : '#666'}
                />
                <View style={styles.todoTextContainer}>
                  <Text
                    style={[
                      styles.todoText,
                      { textDecorationLine: todo.completed ? 'line-through' : 'none' },
                    ]}
                  >
                    {todo.text}
                  </Text>
                  <View style={styles.todoMeta}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(todo.priority) },
                      ]}
                    >
                      <Ionicons
                        name={getPriorityIcon(todo.priority)}
                        size={12}
                        color="white"
                      />
                      <Text style={styles.priorityBadgeText}>
                        {todo.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.todoDate}>
                      {new Date(todo.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTodo(todo.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF5722" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* 완료된 할일 정리 */}
        {todos.some((todo) => todo.completed) && (
          <TouchableOpacity style={styles.clearButton} onPress={clearCompleted}>
            <Ionicons name="trash" size={16} color="white" />
            <Text style={styles.buttonText}>완료된 할일 정리</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 통계 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>통계</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todos.length}</Text>
            <Text style={styles.statLabel}>전체</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {todos.filter((todo) => !todo.completed).length}
            </Text>
            <Text style={styles.statLabel}>진행중</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {todos.filter((todo) => todo.completed).length}
            </Text>
            <Text style={styles.statLabel}>완료</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  permissionSection: {
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  permissionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  permissionItem: {
    alignItems: 'center',
  },
  permissionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  section: {
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  locationInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  addTodoSection: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  filterSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  todoList: {
    marginBottom: 15,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  todoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginLeft: 2,
  },
  todoDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});

export default MyComponents;
