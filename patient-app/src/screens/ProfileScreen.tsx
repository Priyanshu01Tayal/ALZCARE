import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { getPatientProfileApi, updatePatientProfileApi } from '../services/api';
import { Patient, Doctor } from '../types';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { logout, user } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactRelation, setEditContactRelation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await getPatientProfileApi();
      setPatient(data.patient);
      setDoctor(data.doctor);

      // Pre-fill editable state
      setEditPhone(data.patient?.phone || '');
      setEditAddress(data.patient?.address || '');
      setEditContactName(data.patient?.emergencyContact?.name || '');
      setEditContactPhone(data.patient?.emergencyContact?.phone || '');
      setEditContactRelation(data.patient?.emergencyContact?.relation || '');
    } catch (err: any) {
      setError(err.message || 'Unable to load profile data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await updatePatientProfileApi({
        phone: editPhone.trim(),
        address: editAddress.trim(),
        emergencyContact: {
          name: editContactName.trim(),
          phone: editContactPhone.trim(),
          relation: editContactRelation.trim(),
        },
      });
      setPatient(updated);
      Alert.alert('Profile Updated', 'Your contact and emergency information have been updated.');
      setEditModalVisible(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update profile information.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of AlzCare on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Patient Profile"
        subtitle="Medical identification & clinical records"
        rightAction={
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => setEditModalVisible(true)}
            accessibilityLabel="Edit profile contacts"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="account-edit-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchProfile} />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Identity Card */}
        <Card style={styles.identityCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
            </View>
            <Text style={styles.patientName}>{patient?.name || user?.name || 'Patient'}</Text>
            <Text style={styles.patientIdBadge}>ID: {patient?.patientId || 'PAT-0001'}</Text>

            <View style={styles.tagsRow}>
              {patient?.stage && <Badge label={patient.stage} variant="info" size="medium" />}
              <Badge label="AlzCare Active" variant="success" size="medium" />
            </View>
          </View>
        </Card>

        {/* Clinical & Demographic Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Demographics & Account</Text>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{patient?.email || user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{patient?.phone || 'Not recorded'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cake-variant-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Age / Gender</Text>
              <Text style={styles.infoValue}>
                {patient?.age ? `${patient.age} yrs` : 'N/A'} • {patient?.gender || 'N/A'}
              </Text>
            </View>
          </View>

          {patient?.address && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={theme.colors.primary} />
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Home Address</Text>
                <Text style={styles.infoValue}>{patient.address}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Assigned Doctor Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Assigned Physician</Text>
          <TouchableOpacity
            style={styles.doctorTouchRow}
            onPress={() => navigation.navigate('DoctorInfo')}
            accessibilityRole="button"
          >
            <View style={styles.doctorAvatar}>
              <MaterialCommunityIcons name="doctor" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.doctorTexts}>
              <Text style={styles.doctorName}>Dr. {doctor?.name || 'Assigned Physician'}</Text>
              <Text style={styles.doctorSpecialty}>
                {doctor?.specialization || 'Cognitive Neurology Specialist'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Emergency Contact */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Caregiver / Emergency Contact</Text>
          {patient?.emergencyContact?.name ? (
            <View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="account-heart" size={20} color={theme.colors.accent} />
                <View style={styles.infoTexts}>
                  <Text style={styles.infoLabel}>Contact Name</Text>
                  <Text style={styles.infoValue}>
                    {patient.emergencyContact.name}{' '}
                    {patient.emergencyContact.relation ? `(${patient.emergencyContact.relation})` : ''}
                  </Text>
                </View>
              </View>
              {patient.emergencyContact.phone && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={20} color={theme.colors.accent} />
                  <View style={styles.infoTexts}>
                    <Text style={styles.infoLabel}>Emergency Phone</Text>
                    <Text style={styles.infoValue}>{patient.emergencyContact.phone}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noContactText}>
              No emergency caregiver registered. Tap the edit button above to set contact details.
            </Text>
          )}
        </Card>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out of AlzCare"
            icon="logout"
            variant="danger"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Contact Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={26} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. +1 555-019-2834"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="e.g. 124 Park Ave, Suite 3B"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.subHeading}>Caregiver / Emergency Contact</Text>

              <Text style={styles.inputLabel}>Caregiver Name</Text>
              <TextInput
                style={styles.textInput}
                value={editContactName}
                onChangeText={setEditContactName}
                placeholder="e.g. Sarah Miller"
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.inputLabel}>Caregiver Phone</Text>
              <TextInput
                style={styles.textInput}
                value={editContactPhone}
                onChangeText={setEditContactPhone}
                placeholder="e.g. +1 555-492-9102"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.textInput}
                value={editContactRelation}
                onChangeText={setEditContactRelation}
                placeholder="e.g. Daughter / Spouse"
                placeholderTextColor={theme.colors.textMuted}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setEditModalVisible(false)}
              />
              <Button
                title="Save Changes"
                variant="primary"
                loading={saving}
                style={{ flex: 1.5 }}
                onPress={handleSaveProfile}
              />
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
    backgroundColor: theme.colors.background,
  },
  editHeaderBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  identityCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  patientName: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  patientIdBadge: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  cardSectionTitle: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoTexts: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  doctorTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  doctorTexts: {
    flex: 1,
  },
  doctorName: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  doctorSpecialty: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noContactText: {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  logoutSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  modalScroll: {
    marginBottom: theme.spacing.md,
  },
  subHeading: {
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.body,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
