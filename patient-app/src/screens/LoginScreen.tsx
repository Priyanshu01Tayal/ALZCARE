import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, TouchTarget } from '../constants/theme';
import { Button } from '../components/Button';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  getStoredServerUrl,
  setCustomServerUrl,
  resetCustomServerUrl,
  checkBackendHealth,
  HealthCheckResult,
} from '../services/api';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Server Settings & Connection state
  const [isServerModalVisible, setIsServerModalVisible] = useState(false);
  const [currentServerUrl, setCurrentServerUrl] = useState('http://192.168.1.5:5000/api');
  const [serverInputText, setServerInputText] = useState('http://192.168.1.5:5000/api');
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const testConnection = async (targetUrl?: string) => {
    setIsCheckingHealth(true);
    try {
      const result = await checkBackendHealth(targetUrl || currentServerUrl);
      setHealthStatus(result);
      return result;
    } finally {
      setIsCheckingHealth(false);
    }
  };

  React.useEffect(() => {
    getStoredServerUrl().then((url) => {
      setCurrentServerUrl(url);
      setServerInputText(url);
      testConnection(url);
    });
  }, []);

  const handleSaveServerUrl = async () => {
    if (!serverInputText.trim()) return;
    const updated = await setCustomServerUrl(serverInputText.trim());
    setCurrentServerUrl(updated);
    setServerInputText(updated);
    setIsServerModalVisible(false);
    setErrorMessage('');
    testConnection(updated);
  };

  const handleResetServerUrl = async () => {
    const def = await resetCustomServerUrl();
    setCurrentServerUrl(def);
    setServerInputText(def);
    setIsServerModalVisible(false);
    setErrorMessage('');
    testConnection(def);
  };

  const handleLogin = async () => {
    const cleanInput = email.trim();
    if (!cleanInput) {
      setErrorMessage('Please enter your Patient ID or email address');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput);
    const isPatientId = cleanInput.length >= 3;

    if (!isEmail && !isPatientId) {
      setErrorMessage('Please enter a valid Patient ID (e.g. PAT-0001) or email format');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your account password');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(cleanInput, password);
      // React Navigation's conditional Stack navigator in AppNavigator automatically transitions
      // to Main as soon as isAuthenticated becomes true in AuthContext.
    } catch (error: any) {
      console.error('[LoginScreen] Login error:', error);
      setErrorMessage(error.message || 'Login failed. Please verify your credentials or server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for existing test patient in database
  const fillSamplePatient = () => {
    setEmail('lucky123@gmail.com');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🧠</Text>
            </View>
            <Text style={styles.brandTitle}>AlzCare</Text>
            <Text style={styles.brandSubtitle}>Patient Healthcare & Brain Care Portal</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In to Your Account</Text>
            <Text style={styles.cardSubtitle}>
              Access your prescribed exercises, upcoming appointments, and recovery progress.
            </Text>

            {/* Development Connection Status Widget */}
            <View style={styles.connWidget}>
              <View style={styles.connHeaderRow}>
                <View style={styles.connStatusPill}>
                  <View
                    style={[
                      styles.connDot,
                      healthStatus?.ok
                        ? styles.connDotGreen
                        : isCheckingHealth
                        ? styles.connDotYellow
                        : styles.connDotRed,
                    ]}
                  />
                  <Text
                    style={[
                      styles.connStatusLabel,
                      healthStatus?.ok
                        ? styles.connStatusLabelGreen
                        : isCheckingHealth
                        ? styles.connStatusLabelYellow
                        : styles.connStatusLabelRed,
                    ]}
                  >
                    {isCheckingHealth
                      ? 'Testing Connection...'
                      : healthStatus?.ok
                      ? `Connected (${healthStatus.latencyMs}ms)`
                      : 'Server Unreachable'}
                  </Text>
                </View>

                <View style={styles.connActionsRow}>
                  <TouchableOpacity
                    style={styles.connActionBtn}
                    onPress={() => testConnection()}
                    disabled={isCheckingHealth}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={13}
                      color={Colors.primaryLight}
                    />
                    <Text style={styles.connActionBtnText}>Test</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.connActionBtn}
                    onPress={() => setIsServerModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="options-outline"
                      size={13}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.connActionBtnTextSecondary}>Configure</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Target Server URL */}
              <Text style={styles.connTargetText} numberOfLines={1} ellipsizeMode="middle">
                Target: {currentServerUrl}
              </Text>

              {/* Readable diagnostics if unreachable */}
              {!isCheckingHealth && healthStatus && !healthStatus.ok ? (
                <View style={styles.connDiagnosticBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color={Colors.danger}
                    style={{ marginRight: 4, marginTop: 1 }}
                  />
                  <Text style={styles.connDiagnosticText}>
                    {healthStatus.message}{'\n'}
                    Tip: Tap 'Configure' to change the server IP or paste a tunnel URL.
                  </Text>
                </View>
              ) : null}
            </View>

            {errorMessage ? (
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage('')} />
            ) : null}

            {/* Email / Patient ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PATIENT ID OR EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-circle-outline" size={22} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="PAT-0001 or name@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={22} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityLabel="Toggle password visibility"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              title="Log In to Portal"
              onPress={handleLogin}
              size="large"
              isLoading={isLoading}
              style={styles.loginBtn}
            />

            {/* Demo Patient Fast-Fill Button */}
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={fillSamplePatient}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={16} color={Colors.amberLight} />
              <Text style={styles.demoFillText}>Quick Demo: Autofill Patient Credentials</Text>
            </TouchableOpacity>

            {/* Server Settings Button */}
            <TouchableOpacity
              style={styles.serverSettingsBtn}
              onPress={() => setIsServerModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.serverSettingsText}>
                Server: {currentServerUrl.replace('/api', '')}
              </Text>
              <Text style={styles.serverSettingsAction}>Change</Text>
            </TouchableOpacity>

            <View style={styles.noticeBox}>
              <Ionicons name="medical" size={18} color={Colors.primaryLight} style={{ marginRight: 8 }} />
              <Text style={styles.noticeText}>
                Are you a healthcare practitioner? Please sign into the AlzCare Doctor Web Dashboard.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Server Settings Configuration Modal */}
      <Modal
        visible={isServerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="server-outline" size={22} color={Colors.primaryLight} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Backend Server Settings</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your computer's local Wi-Fi IP address or production backend URL.
            </Text>

            <Text style={styles.modalLabel}>SERVER API URL</Text>
            <TextInput
              style={styles.modalInput}
              value={serverInputText}
              onChangeText={setServerInputText}
              placeholder="http://192.168.1.5:5000/api"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsServerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetServerUrl}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalSaveText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardSecondary,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: Typography.titleLarge + 2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: Typography.bodyRegular,
    color: Colors.primaryLight,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: {
    fontSize: Typography.titleMedium,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: TouchTarget.borderRadius,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.minHeight,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.bodyLarge,
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  loginBtn: {
    marginTop: Spacing.md,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.md,
    gap: 6,
  },
  demoFillText: {
    color: Colors.amberLight,
    fontSize: Typography.caption + 1,
    fontWeight: Typography.bold,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: 14,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontSize: Typography.caption + 1,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  serverSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    gap: 6,
  },
  serverSettingsText: {
    color: Colors.textMuted,
    fontSize: Typography.caption,
  },
  serverSettingsAction: {
    color: Colors.primaryLight,
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    textDecorationLine: 'underline',
  },
  connWidget: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  connHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  connStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connDotGreen: {
    backgroundColor: Colors.emerald,
  },
  connDotYellow: {
    backgroundColor: Colors.amber,
  },
  connDotRed: {
    backgroundColor: Colors.danger,
  },
  connStatusLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
  },
  connStatusLabelGreen: {
    color: Colors.emeraldLight,
  },
  connStatusLabelYellow: {
    color: Colors.amberLight,
  },
  connStatusLabelRed: {
    color: Colors.danger,
  },
  connActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    gap: 3,
  },
  connActionBtnText: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: Typography.bold,
  },
  connActionBtnTextSecondary: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  connTargetText: {
    fontSize: Typography.caption - 1,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  connDiagnosticBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
  },
  connDiagnosticText: {
    flex: 1,
    fontSize: 11,
    color: '#FCA5A5',
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: Typography.titleMedium,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  modalLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    backgroundColor: Colors.cardSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    color: Colors.textPrimary,
    fontSize: Typography.bodyRegular,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalCancelBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalCancelText: {
    color: Colors.textMuted,
    fontSize: Typography.bodyRegular,
  },
  modalResetBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  modalResetText: {
    color: Colors.amberLight,
    fontSize: Typography.bodyRegular,
    fontWeight: Typography.medium,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: Typography.bodyRegular,
    fontWeight: Typography.bold,
  },
});
