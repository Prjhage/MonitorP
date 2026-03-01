'use client';

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Activity, Clock, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      fetchIncidents();
    }
  }, [user?.token]);

  const fetchIncidents = async () => {
    try {
      const { data } = await api.get('/apis/incidents/all');
      setIncidents(data);
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-10">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Incident History</h2>
          <p className="text-gray-500">Tracking reliability across your service network</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
          <Filter className="w-4 h-4" /> Filter Results
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white/5 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Started</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Outage Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No incidents have been recorded yet.</td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident._id} className="text-sm hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{incident.apiId?.name || 'Deleted API'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                      {incident.status === 'RESOLVED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{format(new Date(incident.startTime), 'MMM d, h:mm aa')}</td>
                  <td className="px-6 py-4 text-gray-400">{incident.duration ? `${incident.duration} min` : 'Ongoing'}</td>
                  <td className="px-6 py-4 text-gray-500">{incident.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
