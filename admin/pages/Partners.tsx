import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import adminApi from '../api/client';
import type { Partner } from '../types';
import Modal from '../components/ui/Modal';
import { NAV_LINKS } from '../constants';

const Partners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchPartners = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = query
        ? `/admin/search/users?q=${encodeURIComponent(query)}`
        : '/admin/search/users';
      const response = await adminApi.get<Partner[]>(url);
      setPartners(response.data);
    } catch (err) {
      setError('Failed to fetch partners.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [searchParams]);

  const handleOpenBanModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsBanModalOpen(true);
    setBanReason('');
  };

  const handleBanPartner = async () => {
      if (!selectedPartner || !banReason) return;
      setIsBanning(true);
      try {
          await adminApi.post('/admin/ban-partner', {
              userId: selectedPartner._id,
              reason: banReason
          });
          alert(`Partner ${selectedPartner.name} has been banned.`);
          setIsBanModalOpen(false);
          fetchPartners(); // Refresh list
      } catch (err) {
          alert('Failed to ban partner.');
      } finally {
          setIsBanning(false);
      }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all partners to ensure the export is complete and up-to-date
      const response = await adminApi.get<Partner[]>('/admin/search/users');
      const allPartners = response.data;
      
      if (allPartners.length === 0) {
        alert("No partner data to export.");
        return;
      }
      
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined On'];
      const csvRows = [headers.join(',')];
      
      allPartners.forEach(p => {
        const row = [
          `"${p._id}"`,
          `"${p.name}"`,
          `"${p.email}"`,
          `"${p.phone}"`,
          `"${p.role}"`,
          `"${p.status}"`,
          `"${new Date(p.createdAt).toISOString()}"`,
        ];
        csvRows.push(row.join(','));
      });
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `PurWash_partners_export_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      alert("Failed to export partner data.");
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={query ? `Search Results for "${query}"` : "Partner Directory"}
        subtitle={query ? "Displaying partners matching your search term." : "Manage all registered riders and laundry partners."}
      >
        <Button variant="secondary" onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export Partners'}
        </Button>
      </PageHeader>
      <Card className='!p-0'>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-w-text-body">
            <thead className="text-xs text-w-text-main uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Contact</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Joined On</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-6">Loading partners...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="text-center p-6 text-red-500">{error}</td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6">No partners found.</td></tr>
              ) : (
                partners.map((partner, index) => (
                  <tr key={partner._id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 font-medium text-w-text-main">{partner.name}</td>
                    <td className="px-6 py-4">{partner.email}</td>
                    <td className="px-6 py-4 capitalize">{partner.role}</td>
                    <td className="px-6 py-4">{new Date(partner.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><Badge status={partner.status} /></td>
                    <td className="px-6 py-4">
                        {partner.status !== 'banned' && (
                             <Button variant="danger" onClick={() => handleOpenBanModal(partner)}>Ban</Button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isBanModalOpen} onClose={() => setIsBanModalOpen(false)} title={`Ban Partner: ${selectedPartner?.name}`}>
        <div className="space-y-4">
            <p>Are you sure you want to ban this partner? This action is permanent and will be logged.</p>
            <div>
                <label htmlFor="banReason" className="block text-sm font-medium text-w-text-body">Reason for Ban</label>
                <textarea 
                    id="banReason"
                    rows={3}
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-w-primary focus:border-w-primary"
                />
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsBanModalOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleBanPartner} disabled={!banReason || isBanning}>
                    {isBanning ? 'Banning...' : 'Confirm Ban'}
                </Button>
            </div>
        </div>
      </Modal>
    </>
  );
};

export default Partners;