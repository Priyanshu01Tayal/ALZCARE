'use client';

import React, { useState, useEffect } from 'react';
import { usePatientsQuery, useAddPatientMutation } from '@/hooks/useApi';
import { useToastStore } from '@/lib/stores/toast';
import { Users, Search, Plus, Edit2, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
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
      medicalHistory: '',
    });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: any) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name,
      email: p.email,
      password: '',
      age: p.age.toString(),
      gender: p.gender,
      medicalHistory: p.medicalHistory || '',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await addPatientMutation.mutateAsync({
        ...formData,
        age: parseInt(formData.age),
      });
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create patient');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const submitData: any = { 
      ...formData,
      age: parseInt(formData.age),
    };
    if (!submitData.password) {
      delete submitData.password;
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

  const filteredPatients = patients.filter(
    (p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
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
          <p className="text-xs text-slate-400 font-medium">Manage clinical files and records for your patients</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-clinical-600 to-clinical-550 hover:from-clinical-550 hover:to-clinical-450 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-clinical-600/10 transition-all duration-150 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter and Table area */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-white/5 bg-slate-950/40">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs placeholder-slate-500 focus:outline-none focus:border-clinical-500/60 focus:ring-1 focus:ring-clinical-500/40 transition-all"
            />
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
              No patients found. Click 'Register Patient' to add one.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-white/5 text-[10px]">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350 bg-slate-900/20">
                {filteredPatients.map((p: any) => (
                  <tr key={p._id} className="hover:bg-white/5 transition">
                    <td className="p-4 pl-6 font-bold text-white">{p.name}</td>
                    <td className="p-4 text-slate-300">{p.email}</td>
                    <td className="p-4 text-slate-400">{p.age}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
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
                    <td className="p-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-1">
                      <Link
                        href={`/patients/${p._id}`}
                        className="p-2 text-clinical-400 hover:bg-white/5 rounded-lg transition"
                        title="View profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 text-slate-400 hover:bg-white/5 rounded-lg transition"
                        title="Edit details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-2 text-rose-400 hover:bg-white/5 rounded-lg transition"
                        title="Delete patient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
        <DialogContent className="bg-slate-900 border border-white/10 text-white rounded-2xl max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">Register Patient Profile</DialogTitle>
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
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alice Smith"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alice@gmail.com"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Age</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="72"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950/90 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Medical History</label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Mild cognitive impairment, high blood pressure..."
                rows={4}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2.5 px-3 text-xs placeholder-slate-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 text-white rounded-xl shadow-lg transition"
              >
                Register
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white rounded-2xl max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-white">Modify Patient Information</DialogTitle>
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
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Age</label>
                <input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-950/90 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2 px-3 text-xs focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-widest mb-2">Medical History</label>
              <textarea
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="Medical History"
                rows={4}
                className="w-full bg-slate-950/60 border border-white/5 focus:border-clinical-500/60 rounded-xl py-2.5 px-3 text-xs placeholder-slate-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-clinical-600 to-clinical-500 hover:from-clinical-550 hover:to-clinical-450 text-white rounded-xl shadow-lg transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
