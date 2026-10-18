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
    <div className="space-y-8 bg-slate-950 text-slate-100 pb-12">
      {/* Header bar */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-clinical-450" />
            <span>Assigned Patient Directory</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Manage clinical files, mobile accounts, and cognitive regimens</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-clinical-600 to-clinical-550 hover:from-clinical-550 hover:to-clinical-450 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-clinical-600/10 transition-all duration-150 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter and Table area */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-white/5 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by ID (e.g. PAT-0001), name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs placeholder-slate-500 focus:outline-none focus:border-clinical-500/60 focus:ring-1 focus:ring-clinical-500/40 transition-all text-white"
            />
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Total Enrolled: <span className="text-white font-bold">{patients.length}</span> patients
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center bg-slate-950">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No patients found matching your query. Click &apos;Register Patient&apos; to add one.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <th className="p-4 pl-6">Patient ID</th>
                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Age / Sex</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350 bg-slate-900/20">
                {filteredPatients.map((p: any) => (
                  <tr key={p._id} className="hover:bg-white/5 transition">
                    <td className="p-4 pl-6 font-mono text-[11px] font-bold text-clinical-400">
                      {p.patientId || 'PAT-0000'}
                    </td>
                    <td className="p-4 font-bold text-white">
                      <div>{p.name}</div>
                      {p.phone && <div className="text-[10px] text-slate-500 font-normal">{p.phone}</div>}
                    </td>
                    <td className="p-4 text-slate-300 font-mono text-[11px]">{p.email}</td>
                    <td className="p-4 text-slate-400">
                      <span>{p.age} yrs</span>
                      <span className="mx-1.5 text-slate-600">/</span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          p.gender === 'Male'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : p.gender === 'Female'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-slate-800 border-white/5 text-slate-300'
                        }`}
                      >
                        {p.gender}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'Active' || !p.status
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : p.status === 'Pending'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          p.status === 'Active' || !p.status ? 'bg-emerald-400' : p.status === 'Pending' ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        <span>{p.status || 'Active'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Link
                          href={`/patients/${p._id}`}
                          className="p-2 text-clinical-400 hover:bg-white/5 rounded-lg transition"
                          title="View clinical file & analytics"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-slate-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
                          title="Edit details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2 text-rose-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
                          title="Delete patient"
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
        <DialogContent className="bg-slate-900 border border-white/10 text-white rounded-2xl max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-clinical-400" />
              <span>Register Patient &amp; Create Mobile Account</span>
            </DialogTitle>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-350 text-[11px] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alice Smith"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. alice@gmail.com"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
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
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950/90 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs focus:outline-none text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950/90 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs focus:outline-none text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Password generation block */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Initial Account Password
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to auto-generate temporary secure password"
                className="w-full bg-slate-900 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white font-mono text-[11px]"
              />
              <p className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-clinical-400 shrink-0" />
                <span>
                  Leaving blank auto-generates a temporary password (e.g. <span className="font-mono text-clinical-300">AlzCare#XXXXXX</span>) and enforces password reset on first login.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Spouse / Caregiver phone"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Clinical &amp; Medical History
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Mild cognitive symptoms, hypertension, memory lapse notes..."
                rows={3}
                className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2.5 px-3 text-xs placeholder-slate-500 focus:outline-none resize-none text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addPatientMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 text-white rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {addPatientMutation.isPending && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>Register &amp; Provision Account</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white rounded-2xl max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">
              Modify Patient Information
            </DialogTitle>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-350 text-[11px] flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Reset Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950/90 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs focus:outline-none text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Emergency contact"
                  className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Medical History
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Medical History"
                rows={3}
                className="w-full bg-slate-950/60 border border-white/10 focus:border-clinical-500/60 rounded-xl py-2.5 px-3 text-xs placeholder-slate-500 focus:outline-none resize-none text-white"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 text-white rounded-xl shadow-lg transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Initial Credentials Modal */}
      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="bg-slate-900 border border-clinical-500/30 text-white rounded-2xl max-w-md p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center space-x-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Patient Account Created
                </DialogTitle>
                <p className="text-[11px] text-slate-400">
                  Initial credentials generated for mobile application access
                </p>
              </div>
            </div>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-clinical-950/30 border border-clinical-800/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-bold text-white">{createdCredentials.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-400">Assigned Patient ID:</span>
                  <span className="font-mono font-bold text-clinical-400">{createdCredentials.patientId}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-400">Login Email:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-white text-[11px]">{createdCredentials.email}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                      className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Temporary Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[12px]">
                      {createdCredentials.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdCredentials.temporaryPassword, 'pwd')}
                      className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy password"
                    >
                      {copiedField === 'pwd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Security &amp; First Login Policy</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  Provide these credentials to the patient or authorized caregiver. Upon first sign-in on the AlzCare Mobile App, the patient will be prompted to establish their own private password.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={copyAllCredentials}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-2 border border-white/10 transition cursor-pointer"
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
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-clinical-600 to-clinical-500 text-white font-bold text-xs shadow-lg hover:from-clinical-550 hover:to-clinical-450 transition cursor-pointer"
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
