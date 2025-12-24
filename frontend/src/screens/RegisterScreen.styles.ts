import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20, // iOS standard
  },

  logo: {
    fontSize: 44,
    fontFamily: "Sail", // assumes Sail is loaded
    fontStyle: "italic",
    textAlign: "center",
    color: "#5A1E2B",
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    color: "#111",
    marginBottom: 32,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  field: {
    marginBottom: 20,
  },

  halfField: {
    width: "48%",
  },

  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B6B6B",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 16,
    color: "#111",
  },

  primaryButton: {
    backgroundColor: "#2F6F4E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },

  primaryButtonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  footerText: {
    marginTop: 28,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },

  link: {
    color: "#111",
    fontWeight: "600",
  },
});
