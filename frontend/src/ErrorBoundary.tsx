import React from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from "react-native";

/**
 * App-wide crash guard. Catches any render/runtime error in the React tree and
 * shows a friendly recovery screen instead of a white screen or red box.
 *
 * Intentionally self-contained (no theme/context dependencies and inline styles)
 * so it still renders correctly even if a provider above it failed.
 */
type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Log a trimmed, non-sensitive summary only. Never surface stack traces to the user.
    try {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn("[ErrorBoundary] caught:", msg?.slice(0, 200));
    } catch {
      /* noop */
    }
  }

  reset = () => {
    this.setState({ hasError: false });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.location.reload();
      } catch {
        /* noop */
      }
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected problem. Your data is safe — please try again.
          </Text>
          <Pressable
            testID="error-boundary-retry"
            onPress={this.reset}
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,94,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconText: { color: "#FF5E00", fontSize: 40, fontWeight: "800" },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 320,
  },
  button: {
    marginTop: 28,
    backgroundColor: "#FF5E00",
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    maxWidth: 320,
  },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
