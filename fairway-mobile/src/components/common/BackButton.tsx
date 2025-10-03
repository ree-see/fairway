import React from "react";
import { TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { colors } from "../../theme/colors";

const { height: screenHeight } = Dimensions.get("window");

export const BackButton: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={24} color="#000" />
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    backButton: {
      position: "absolute",
      right: 0,
      top: screenHeight * 0.65, // Positioned higher to avoid tab bar
      width: 24,
      height: 60,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      backgroundColor: "#FFD700", // Caution yellow
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: -2,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      zIndex: 1000,
    },
  });
