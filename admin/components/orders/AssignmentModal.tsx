import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import adminApi from '../../api/client';
import type { Order, Partner } from '../../types';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onAssignSuccess: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, order, onAssignSuccess }) => {
  const [riders, setRiders] = useState<Partner[]>([]);
  const [laundries, setLaundries] = useState<Partner[]>([]);
  const [selectedRider, setSelectedRider] = useState('');
  const [selectedLaundry, setSelectedLaundry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPartners = async () => {
        setIsLoading(true);
        try {
          const [ridersRes, laundriesRes] = await Promise.all([
            adminApi.get<Partner[]>('/admin/search/users?role=rider&status=active'),
            adminApi.get<Partner[]>('/admin/search/users?role=laundry&status=active'),
          ]);
          setRiders(ridersRes.data);
          setLaundries(laundriesRes.data);
        } catch (err) {
          setError('Failed to fetch available partners.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPartners();
    } else {
        // Reset state on close
        setSelectedRider('');
        setSelectedLaundry('');
        setError('');
    }
  }, [isOpen]);

  const handleAssign = async () => {
      if (!order || !selectedRider || !selectedLaundry) {
          setError('Please select both a rider and a laundry.');
          return;
      }
      setIsAssigning(true);
      setError('');
      try {
          await adminApi.post('/admin/assign', {
              orderId: order._id,
              riderId: selectedRider,
              laundryId: selectedLaundry
          });
          onAssignSuccess();
          onClose();
      } catch (err) {
          setError('Failed to assign order. Please try again.');
      } finally {
          setIsAssigning(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Order ${order?.friendlyId || ''}`}>
      {isLoading ? (
        <p>Loading available partners...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="rider" className="block text-sm font-medium text-w-text-body">
              Select Rider
            </label>
            <select
              id="rider"
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-w-primary focus:border-w-primary sm:text-sm rounded-md"
            >
              <option value="">-- Choose a Rider --</option>
              {riders.map((rider) => (
                <option key={rider._id} value={rider._id}>{rider.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="laundry" className="block text-sm font-medium text-w-text-body">
              Select Laundry
            </label>
            <select
              id="laundry"
              value={selectedLaundry}
              onChange={(e) => setSelectedLaundry(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-w-primary focus:border-w-primary sm:text-sm rounded-md"
            >
              <option value="">-- Choose a Laundry --</option>
              {laundries.map((laundry) => (
                <option key={laundry._id} value={laundry._id}>{laundry.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button variant="secondary" onClick={onClose} disabled={isAssigning}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedRider || !selectedLaundry || isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign Order'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AssignmentModal;
