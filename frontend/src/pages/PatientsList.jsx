import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    medicalHistory: '',
  });
  const [error, setError] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data } = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const handleOpenEdit = (p) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name,
      email: p.email,
      password: '',
      age: p.age,
      gender: p.gender,
      medicalHistory: p.medicalHistory || '',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.addPatient(formData);
      setShowAddModal(false);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create patient');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Don't submit password if blank
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }

    try {
      await api.updatePatient(selectedPatient._id, submitData);
      setShowEditModal(false);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update patient');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient? This will delete all prescriptions, MRI reports, game assignments, and appointment logs associated with this patient!')) {
      try {
        await api.deletePatient(id);
        fetchPatients();
      } catch (err) {
        console.error('Failed to delete patient:', err);
      }
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="h-5 w-5 text-clinical-600" />
            <span>Assigned Patient Directory</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Manage clinical files and records for your patients</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 bg-clinical-600 hover:bg-clinical-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-clinical-600/10 transition-all duration-150 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Register Patient</span>
        </button>
      </div>

      {/* Filter and Table area */}
      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500 transition-all duration-150"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinical-600 border-t-transparent"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No patients found. Click 'Register Patient' to add one.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Patient Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {filteredPatients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="p-4 pl-6 font-semibold text-slate-800">{p.name}</td>
                    <td className="p-4">{p.email}</td>
                    <td className="p-4">{p.age}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.gender === 'Male'
                            ? 'bg-blue-50 text-blue-700'
                            : p.gender === 'Female'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.gender}
                      </span>
                    </td>
                    <td className="p-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 pr-6 text-right flex justify-end space-x-1">
                      <Link
                        to={`/patient/${p._id}`}
                        className="p-2 text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors"
                        title="View profile"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        title="Edit details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Register Patient Profile</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Alice Smith"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alice@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="72"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Medical History
                </label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Mild cognitive impairment, high blood pressure..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-clinical-600 hover:bg-clinical-500 text-white rounded-xl shadow-md shadow-clinical-600/10 transition-all"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Modify Patient Information</h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Name"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Age"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Medical History
                </label>
                <textarea
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Medical History"
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm placeholder-slate-400 focus:outline-none focus:border-clinical-500 focus:ring-1 focus:ring-clinical-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-clinical-600 hover:bg-clinical-500 text-white rounded-xl shadow-md shadow-clinical-600/10 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
