'use client';

import React, { useState } from 'react';
import { usePatientsQuery, useAddPatientMutation } from '@/hooks/useApi';
import { useToastStore } from '@/lib/stores/toast';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Phone,
  UserCheck,
  Activity,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientsDirectory() {
  const { data: patients = [], isLoading, refetch } = usePatientsQuery();
  const addPatientMutation = useAddPatientMutation();
  const addToast = useToastStore((state) => state.addToast);

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Initial credentials modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    status: 'Active',
    phone: '',
    emergencyContact: '',
    medicalHistory: '',
  });
  const [error, setError] = useState('');

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      age: '',
      gender: 'Male',
      status: 'Active',
      phone: '',
      emergencyContact: '',
      medicalHistory: '',
    });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name || '',
      email: p.email || '',
      password: '',
      age: p.age ? p.age.toString() : '',
      gender: p.gender || 'Male',
      status: p.status || 'Active',
      phone: p.phone || '',
      emergencyContact: p.emergencyContact || '',
      medicalHistory: p.medicalHistory || '',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const submitData: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        status: formData.status,
        phone: formData.phone.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        medicalHistory: formData.medicalHistory.trim(),
      };
      if (formData.password && formData.password.trim().length > 0) {
        submitData.password = formData.password;
      }

      const result = await addPatientMutation.mutateAsync(submitData);
      setShowAddModal(false);

      if (result?.initialCredentials) {
        setCreatedCredentials({
          name: result.patient?.name || formData.name,
          patientId: result.patient?.patientId || 'Assigned',
          email: result.initialCredentials.email,
          temporaryPassword: result.initialCredentials.temporaryPassword,
          mustChangePassword: result.initialCredentials.mustChangePassword,
          status: result.patient?.status || formData.status,
        });
        setShowCredentialsModal(true);
      }

      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create patient record');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const submitData: any = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      status: formData.status,
      phone: formData.phone.trim(),
      emergencyContact: formData.emergencyContact.trim(),
      medicalHistory: formData.medicalHistory.trim(),
    };
    if (formData.password && formData.password.trim().length > 0) {
      submitData.password = formData.password;
    }

    try {
      await apiClient.put(`/api/patients/${selectedPatient._id}`, submitData);
      setShowEditModal(false);
      addToast('Patient Modified', 'Successfully updated patient details.', 'success');
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update patient');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this patient profile? This will purge all associated MRIs, timelines, prescriptions, and game scores.')) {
      try {
        await apiClient.delete(`/api/patients/${id}`);
        addToast('Patient Purged', 'Patient record successfully removed.', 'info');
        refetch();
      } catch (err) {
        console.error('Failed to delete patient:', err);
      }
    }
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const copyAllCredentials = () => {
    if (!createdCredentials) return;
    const credText = `ALZCARE PATIENT ACCESS CREDENTIALS\n` +
      `-----------------------------------------\n` +
      `Patient ID : ${createdCredentials.patientId}\n` +
      `Name       : ${createdCredentials.name}\n` +
      `Email      : ${createdCredentials.email}\n` +
      `Temporary Password : ${createdCredentials.temporaryPassword}\n` +
      `Account Status     : ${createdCredentials.status}\n` +
      `Password Policy    : Must change password upon first mobile login.\n` +
      `-----------------------------------------\n` +
      `Please download the AlzCare Mobile Patient App and sign in with these credentials.`;

    copyToClipboard(credText, 'all');
  };

  const filteredPatients = patients.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-100 pb-16">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-slate-900/70 backdrop-blur-md border border-slate-800/80 p-6 lg:p-8 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Assigned Patient Directory
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            Manage clinical electronic health records, mobile patient accounts, and cognitive regimens
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2.5 h-11 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-500/20 transition-all duration-200 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Filter and Table area */}
      <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Search & Meta bar */}
        <div className="p-5 lg:p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-lg w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by ID (e.g. PAT-0001), name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all text-white"
            />
          </div>
          <div className="text-sm text-slate-400 font-medium flex items-center space-x-2">
            <span>Total Enrolled:</span>
            <span className="text-white font-bold bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/60 font-mono">
              {patients.length}
            </span>
            <span>patients</span>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-72 items-center justify-center bg-slate-950/30">
              <div className="flex flex-col items-center space-y-3">
                <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
                <span className="text-sm text-slate-400 font-medium">Loading clinical directory...</span>
              </div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-slate-300">No matching patient records found</p>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No patients matched your search query. Try searching for a different name, email, or click Register New Patient.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800/80 text-xs">
                  <th className="py-4 px-6">Patient ID</th>
                  <th className="py-4 px-6">Patient Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Age / Sex</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6">Enrolled Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                {filteredPatients.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md">
                        {p.patientId || 'PAT-0000'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-base font-semibold text-white">{p.name}</div>
                      {p.phone && (
                        <div className="text-xs text-slate-400 font-medium flex items-center space-x-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-mono text-slate-300">{p.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 text-sm text-slate-300">
                        <span className="font-medium">{p.age} yrs</span>
                        <span className="text-slate-600">/</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
                            p.gender === 'Male'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : p.gender === 'Female'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {p.gender}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          p.status === 'Active' || !p.status
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : p.status === 'Pending'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${
                          p.status === 'Active' || !p.status ? 'bg-emerald-400 animate-pulse' : p.status === 'Pending' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        <span>{p.status || 'Active'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 font-medium">
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/patients/${p._id}`}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-teal-400 hover:text-teal-300 hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700"
                          title="View patient file & cognitive records"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition border border-transparent hover:border-slate-700 cursor-pointer"
                          title="Edit patient records"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20 cursor-pointer"
                          title="Delete patient record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Patient Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Register New Patient
                </DialogTitle>
                <p className="text-sm text-slate-400">
                  Create clinical file and provision mobile patient account credentials
                </p>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center space-x-3 my-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alice Smith"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. alice@example.com"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="72"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Password generation block */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Initial Account Password
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to auto-generate temporary secure password"
                className="w-full h-11 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white font-mono transition"
              />
              <p className="text-xs text-slate-400 flex items-center space-x-2 leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                <span>
                  Leaving this field blank auto-generates a temporary credential (e.g. <span className="font-mono text-teal-300 font-semibold">AlzCare#XXXXXX</span>) and enforces password reset on first mobile login.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Caregiver name &amp; phone"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Clinical &amp; Medical History
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Baseline cognitive status, neurodegenerative symptoms, relevant medications..."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl p-3.5 text-sm placeholder-slate-500 focus:outline-none resize-none text-white transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="h-11 px-5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addPatientMutation.isPending}
                className="h-11 px-6 text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {addPatientMutation.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>Register &amp; Provision Account</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Edit2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Modify Patient Profile
                </DialogTitle>
                <p className="text-sm text-slate-400">
                  Update personal details, clinical contacts, and account status
                </p>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center space-x-3 my-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Reset Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Age
                </label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm text-white focus:outline-none transition cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Emergency contact"
                  className="w-full h-11 bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 text-sm placeholder-slate-500 focus:outline-none text-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Medical History
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Medical history notes..."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 rounded-xl p-3.5 text-sm placeholder-slate-500 focus:outline-none resize-none text-white transition"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="h-11 px-5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 px-6 text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Initial Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="bg-slate-900 border border-teal-500/30 text-white rounded-2xl max-w-lg p-6 lg:p-8 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-1">
              <div className="h-11 w-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white tracking-tight">
                  Patient Account Created
                </DialogTitle>
                <p className="text-sm text-slate-400">
                  Initial credentials generated for mobile application access
                </p>
              </div>
            </div>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-5 pt-3">
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-800">
                  <span className="text-slate-400">Patient Name:</span>
                  <span className="font-semibold text-white">{createdCredentials.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-800">
                  <span className="text-slate-400">Assigned Patient ID:</span>
                  <span className="font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                    {createdCredentials.patientId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pb-2.5 border-b border-slate-800">
                  <span className="text-slate-400">Login Email:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-white text-sm">{createdCredentials.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                      className="p-1.5 text-slate-400 hover:text-white transition rounded-md hover:bg-slate-800 cursor-pointer"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Temporary Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-sm">
                      {createdCredentials.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.temporaryPassword, 'pwd')}
                      className="p-1.5 text-slate-400 hover:text-white transition rounded-md hover:bg-slate-800 cursor-pointer"
                      title="Copy password"
                    >
                      {copiedField === 'pwd' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm space-y-1.5">
                <div className="font-bold flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>Security &amp; First Mobile Sign-in Protocol</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Provide these credentials to the patient or authorized caregiver. Upon first sign-in on the AlzCare Mobile App, the patient will be prompted to establish their own private password.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={copyAllCredentials}
                  className="flex-1 h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 border border-slate-700 transition cursor-pointer"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Credentials Dossier</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCredentialsModal(false)}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:from-teal-400 hover:to-cyan-400 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
