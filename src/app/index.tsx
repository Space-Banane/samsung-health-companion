import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  initialize,
  requestPermission,
  readRecords,
  insertRecords
} from 'react-native-health-connect';

interface CalorieRecord {
  startTime: string;
  endTime: string;
  energy: {
    inCalories: number;
    inJoules: number;
    inKilojoules: number;
    inKilocalories: number;
  };
  metadata: {
    id: string;
    lastModifiedTime: string;
    dataOrigin: string;
  };
}

export default function Page() {
  const [calorieData, setCalorieData] = useState<CalorieRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const readSampleData = async () => {
    try {
      setIsLoading(true);
      
      // initialize the client
      const initialized = await initialize();
      setIsInitialized(initialized);
      
      if (!initialized) {
        Alert.alert('Error', 'Failed to initialize Health Connect');
        return;
      }

      // request permissions
      const grantedPermissions = await requestPermission([
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      ]);

      // read records from last 7 days
      const endTime = new Date().toISOString();
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const result = await readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime,
          endTime,
        },
      });

      setCalorieData(
        (result.records || []).map((record: any) => ({
          ...record,
          metadata: {
            id: record.metadata.id ?? "",
            lastModifiedTime: record.metadata.lastModifiedTime,
            dataOrigin: record.metadata.dataOrigin,
          },
        }))
      );
    } catch (error) {
      Alert.alert('Error', `Failed to read health data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex flex-1 bg-gray-900">
      <Header />
      <Content 
        calorieData={calorieData}
        isLoading={isLoading}
        isInitialized={isInitialized}
        onRefresh={readSampleData}
      />
    </View>
  );
}

function Content({ 
  calorieData, 
  isLoading, 
  isInitialized, 
  onRefresh 
}: {
  calorieData: CalorieRecord[];
  isLoading: boolean;
  isInitialized: boolean;
  onRefresh: () => void;
}) {
  return (
    <ScrollView className="flex-1 px-4">
      <View className="py-8">
        <Text className="text-3xl font-bold text-white text-center mb-2">
          Samsung Health Data
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          Active Calories Burned (Last 7 Days)
        </Text>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mb-6"
        >
          <Text className="text-white font-medium text-center">
            {isLoading ? 'Loading...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>

        {!isInitialized && (
          <View className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <Text className="text-red-200">
              Health Connect not initialized. Please check permissions.
            </Text>
          </View>
        )}

        {calorieData.length === 0 && !isLoading && (
          <View className="bg-gray-800 rounded-lg p-6 text-center">
            <Text className="text-gray-300">
              No calorie data found. Try refreshing or check your Samsung Health app.
            </Text>
          </View>
        )}

        {calorieData.map((record, index) => (
          <View key={record.metadata.id} className="bg-gray-800 rounded-lg p-4 mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white font-semibold">Record #{index + 1}</Text>
              <Text className="text-gray-400 text-sm">
                {new Date(record.startTime).toLocaleDateString()}
              </Text>
            </View>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Calories:</Text>
                <Text className="text-white font-medium">
                  {record.energy.inKilocalories.toLocaleString()} kcal
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Kilojoules:</Text>
                <Text className="text-white">
                  {record.energy.inKilojoules.toFixed(2)} kJ
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Time Range:</Text>
                <Text className="text-white text-sm">
                  {new Date(record.startTime).toLocaleTimeString()} - {new Date(record.endTime).toLocaleTimeString()}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Source:</Text>
                <Text className="text-white text-sm">
                  {record.metadata.dataOrigin}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Header() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: top }} className="bg-gray-900">
      <View className="px-4 h-14 flex items-center flex-row justify-center">
        <Text className="font-bold text-white text-lg">
          Health Data Viewer
        </Text>
      </View>
    </View>
  );
}
