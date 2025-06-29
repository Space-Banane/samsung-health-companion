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

export interface IndexViewProps {
    switchTab: (tabName: "Home") => void;
}

const IndexView: React.FC<IndexViewProps> = ({ switchTab }) => {
    const [calorieData, setCalorieData] = useState<CalorieRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        initializeHealthConnect();
    }, []);

    const initializeHealthConnect = async () => {
        try {
            setIsLoading(true);
            setInitError(null);

            // Initialize the client
            const initialized = await initialize("SHealthConnect");
            setIsInitialized(initialized);

            if (!initialized) {
                setInitError('Failed to initialize Health Connect. Make sure Samsung Health is installed.');
                return;
            }

            // Check if we already have permissions
            await checkPermissions();
        } catch (error) {
            setInitError(`Initialization error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const checkPermissions = async () => {
        try {
            // Request permissions to check current status
            const grantedPermissions = await requestPermission([
                { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
            ]);

            // Check if the specific permission was granted
            const hasCaloriePermission = grantedPermissions.some(
                permission => permission.recordType === 'ActiveCaloriesBurned' && 
                permission.accessType === 'read'
            );

            setHasPermissions(hasCaloriePermission);
        } catch (error) {
            setInitError(`Permission check error: ${error}`);
        }
    };

    const requestPermissions = async () => {
        try {
            setIsLoading(true);
            setInitError(null);

            const grantedPermissions = await requestPermission([
                { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
            ]);

            const hasCaloriePermission = grantedPermissions.some(
                permission => permission.recordType === 'ActiveCaloriesBurned' && 
                permission.accessType === 'read'
            );

            setHasPermissions(hasCaloriePermission);

            if (!hasCaloriePermission) {
                Alert.alert(
                    'Permissions Required',
                    'Please grant access to Active Calories Burned data in Samsung Health to use this feature.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Try Again', onPress: requestPermissions }
                    ]
                );
            }
        } catch (error) {
            setInitError(`Permission request error: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const readSampleData = async () => {
        if (!isInitialized || !hasPermissions) {
            Alert.alert('Error', 'Please ensure Health Connect is initialized and permissions are granted.');
            return;
        }

        try {
            setIsLoading(true);

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

    // Show setup screen if not properly initialized
    if (!isInitialized || !hasPermissions) {
        return (
            <View className="flex flex-1 bg-gray-900 justify-center px-4">
                <View className="py-8">
                    <Text className="text-3xl font-bold text-white text-center mb-4">
                        Samsung Health Setup
                    </Text>
                    
                    {initError && (
                        <View className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
                            <Text className="text-red-200 text-center">
                                {initError}
                            </Text>
                        </View>
                    )}

                    <View className="space-y-4 mb-8">
                        <View className="flex-row items-center">
                            <Text className={`text-2xl mr-3 ${isInitialized ? 'text-green-400' : 'text-gray-400'}`}>
                                {isInitialized ? '✓' : '○'}
                            </Text>
                            <Text className="text-white text-lg">
                                Health Connect Initialized
                            </Text>
                        </View>
                        
                        <View className="flex-row items-center">
                            <Text className={`text-2xl mr-3 ${hasPermissions ? 'text-green-400' : 'text-gray-400'}`}>
                                {hasPermissions ? '✓' : '○'}
                            </Text>
                            <Text className="text-white text-lg">
                                Permissions Granted
                            </Text>
                        </View>
                    </View>

                    {!isInitialized ? (
                        <TouchableOpacity
                            onPress={initializeHealthConnect}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg mb-4"
                        >
                            <Text className="text-white font-medium text-center text-lg">
                                {isLoading ? 'Initializing...' : 'Initialize Health Connect'}
                            </Text>
                        </TouchableOpacity>
                    ) : !hasPermissions ? (
                        <TouchableOpacity
                            onPress={requestPermissions}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg mb-4"
                        >
                            <Text className="text-white font-medium text-center text-lg">
                                {isLoading ? 'Requesting...' : 'Grant Permissions'}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                    <Text className="text-gray-400 text-center text-sm">
                        Please ensure Samsung Health is installed and up to date on your device.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex flex-1 bg-gray-900">
            <ScrollView className="flex-1 px-4">
                <View className="py-8">
                    <Text className="text-3xl font-bold text-white text-center mb-2">
                        Samsung Health Data
                    </Text>
                    <Text className="text-gray-400 text-center mb-8">
                        Active Calories Burned (Last 7 Days)
                    </Text>

                    <TouchableOpacity
                        onPress={readSampleData}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mb-6"
                    >
                        <Text className="text-white font-medium text-center">
                            {isLoading ? 'Loading...' : 'Refresh Data'}
                        </Text>
                    </TouchableOpacity>

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
        </View>
    );
};

export default IndexView;