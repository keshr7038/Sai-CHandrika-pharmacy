import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Users, Search, User, Mail, Phone, Calendar, Clock, RefreshCw, Filter } from 'lucide-react';

export default function Customers() {
  const { customers, loading, loadAllData } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecentActiveCount = () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return customers.filter(c => c.last_login && new Date(c.last_login).getTime() > oneDayAgo).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            Customer Analytics
          </h1>
          <p className="text-sm text-gray-500">View and track customer registration, logins, and shop activity.</p>
        </div>
        <button
          onClick={loadAllData}
          disabled={loading}
          className="btn-secondary flex items-center justify-center gap-2 text-xs py-2 px-3 border border-gray-200 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Analytics KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div className="card p-5 relative overflow-hidden bg-white border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Registered Customers
            </span>
            <span className="text-3xl font-black text-gray-800">{customers.length}</span>
            <span className="text-xs text-primary-600 font-semibold block mt-1">Total user accounts</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Today */}
        <div className="card p-5 relative overflow-hidden bg-white border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Active Today (24h)
            </span>
            <span className="text-3xl font-black text-gray-800">{getRecentActiveCount()}</span>
            <span className="text-xs text-amber-600 font-semibold block mt-1">Logged in recently</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* New Signups This Month */}
        <div className="card p-5 relative overflow-hidden bg-white border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              New Signups (30d)
            </span>
            <span className="text-3xl font-black text-gray-800">
              {customers.filter(c => new Date(c.created_at).getTime() > (Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
            </span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Growth this month</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 bg-white border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm py-2.5 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider mr-2">
            <Filter className="w-3.5 h-3.5" /> Filter list:
          </span>
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              filterRole === 'all'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            All ({filteredCustomers.length})
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card bg-white border border-gray-100 overflow-hidden shadow-sm">
        {loading && filteredCustomers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold">Loading customers database...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-6">Contact Email</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Registration Date</th>
                  <th className="py-3.5 px-6">Last Login Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6 font-bold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs uppercase">
                          {c.name ? c.name[0] : 'C'}
                        </div>
                        <div>
                          <span className="block">{c.name || 'Anonymous Customer'}</span>
                          <span className="text-[10px] text-gray-400 font-normal">ID: {c.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{c.phone || <em className="text-gray-300 font-normal">Not Provided</em>}</span>
                      </div>
                    </td>

                    {/* Created At */}
                    <td className="py-4 px-6 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(c.created_at)}</span>
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          c.last_login ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {formatDate(c.last_login)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-700 mb-1">No Customers Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              We couldn't find any customers matching "{searchQuery}". Try updating your search query or refresh the database.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
