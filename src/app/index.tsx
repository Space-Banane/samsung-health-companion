import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import {
  Text,
  View,
  Pressable,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import IndexView from "./views/Index";

export type TabName =
  | "Home";

// User Context
interface UserContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>("Home");

  return (
    <UserContext.Provider
      value={{
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export interface PageRef {
  switchTab: (tabName: TabName) => void;
}

const PageComponent = forwardRef<PageRef>((props, ref) => {
  const [processedToken, setProcessedToken] = useState<string | null>(null);
  const { activeTab, setActiveTab } = useUser();

  const allTabs = {
    Home: {
      name: "Home",
      icon: "home",
      iconSet: "AntDesign",
      component: IndexView,
    },
  };

  // Only show Home and Settings in the tab bar
  const visibleTabs = [allTabs.Home];

  const switchTab = (tabName: TabName) => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    const backAction = () => {
      if (activeTab !== "Home") {
        switchTab("Home");
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab, switchTab]);

  useImperativeHandle(ref, () => ({
    switchTab,
  }));


  const ActiveComponent = allTabs[activeTab].component;

  return (
    <View className="flex flex-1 mt-6 mr-1 ml-1">
      <ActiveComponent switchTab={switchTab} />
      <TabBar
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabPress={(name) => setActiveTab(name as TabName)}
      />
    </View>
  );
});

const Page = forwardRef<PageRef>((props, ref) => {
  return (
    <UserProvider>
      <PageComponent ref={ref} />
    </UserProvider>
  );
});

function TabBar({
  tabs,
  activeTab,
  onTabPress,
}: {
  tabs: Array<{ name: string; icon: string; iconSet: string; component: any }>;
  activeTab: TabName;
  onTabPress: (name: string) => void;
}) {
  const { bottom } = useSafeAreaInsets();

  const renderIcon = (iconSet: string, iconName: string, isActive: boolean) => {
    const color = isActive ? "#60a5fa" : "#9ca3af";
    const size = 24;

    switch (iconSet) {
      case "AntDesign":
        return <AntDesign name={iconName as any} size={size} color={color} />;
      case "Feather":
        return <Feather name={iconName as any} size={size} color={color} />;
      case "Ionicons":
        return <Ionicons name={iconName as any} size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <View
      className="bg-background-tabbar shadow-lg rounded-tr-2xl rounded-tl-2xl"
      style={{ paddingBottom: bottom }}
    >
      <View className="flex-row">
      {tabs.map((tab) => (
        <Pressable
        key={tab.name}
        className="flex-1 py-3 px-2 items-center justify-center"
        onPress={() => onTabPress(tab.name)}
        >
        <View className="items-center gap-1">
          {renderIcon(tab.iconSet, tab.icon, activeTab === tab.name)}
          <Text
          className={`text-xs font-medium ${
            activeTab === tab.name ? "text-blue-400" : "text-gray-400"
          }`}
          >
          {tab.name}
          </Text>
        </View>
        </Pressable>
      ))}
      </View>
    </View>
  );
}

export default Page;
