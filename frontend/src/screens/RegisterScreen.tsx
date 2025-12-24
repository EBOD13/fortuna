import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";
import { styles } from "./RegisterScreen.styles";

const API_URL = "http://localhost:8000/api/v1";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Format date as YYYY-MM-DD for display and API
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (date: Date) => {
    setDateOfBirth(date);
  };

  const handleRegister = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          date_of_birth: formatDate(dateOfBirth),
          phone_number: phoneNumber.trim() || null,
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Error response:", data);
        throw new Error(data.detail || JSON.stringify(data));
      }

      await AsyncStorage.setItem("token", data.access_token);
      Alert.alert("Success", "Account created successfully!");
      
      // Clear form
      setFirstName("");
      setLastName("");
      setDateOfBirth(new Date());
      setPhoneNumber("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.log("Full error:", err);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 24 },
        ]}
      >
        {/* Logo */}
        <Text style={styles.logo}>Fortuna</Text>

        {/* Title */}
        <Text style={styles.title}>Create an account</Text>

        {/* Name Row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              editable={!loading}
            />
          </View>
        </View>

        {/* Date of Birth with Date Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Date of birth</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text>{formatDate(dateOfBirth)}</Text>
          </TouchableOpacity>
        </View>

        <DatePicker
          modal
          open={showDatePicker}
          date={dateOfBirth}
          onConfirm={(date) => {
            handleDateChange(date);
            setShowDatePicker(false);
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
          mode="date"
          title="Select your date of birth"
          maximumDate={new Date()}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            keyboardType="phone-pad"
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        {/* Primary Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            loading && styles.primaryButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creating account..." : "Create account"}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.link}>Sign in</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}