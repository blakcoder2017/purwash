
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import WalletCard from '../components/WalletCard';
import { WalletSummaryIcons } from '../components/icons/NavIcons';
import { riderApi } from '../services/api';

type FilterPeriod = 'today' | 'last7' | 'month';

const WalletScreen: React.FC = () => {
  const { user, updateUser } = useAppContext();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('last7');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletTotals, setWalletTotals] = useState({ totalEarned: 0, pendingBalance: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await riderApi.getWalletData();
        const data = response.data;
        const totalEarned = data?.wallet?.totalEarned ?? 0;
        const pendingBalance = data?.wallet?.pendingBalance ?? 0;
        setWalletTotals({ totalEarned, pendingBalance });
        setTransactions(data?.transactions || []);
        if (user) {
          updateUser({
            ...user,
            wallet: {
              totalEarned,
              pendingBalance
            }
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet.');
      } finally {
        setLoading(false);
      }
    };
    loadWallet();
  }, []);

  const totalEarned = walletTotals.totalEarned || user?.wallet?.totalEarned || 0;
  const pending = walletTotals.pendingBalance || user?.wallet?.pendingBalance || 0;
  const paid = totalEarned - pending;

  const history = transactions.map((item, index) => ({
    id: item.orderId?.friendlyId || item.orderId?._id || item._id || `${index}`,
    date: item.createdAt || item.date,
    amount: item.amount || 0
  }));

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return history.filter(item => {
      const itemDate = new Date(item.date);
      
      switch (filterPeriod) {
        case 'today':
          return itemDate >= today && itemDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        case 'last7':
          const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
          return itemDate >= sevenDaysAgo;
        case 'month':
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [history, filterPeriod]);

  const FilterButton: React.FC<{period: FilterPeriod, label: string}> = ({ period, label }) => {
    const baseClasses = "px-4 py-2 rounded-full font-semibold text-sm transition-colors focus:outline-none";
    const activeClasses = "bg-primary text-white";
    const inactiveClasses = "bg-gray-200 text-primary hover:bg-gray-300";
    
    return (
        <button onClick={() => setFilterPeriod(period)} className={`${baseClasses} ${filterPeriod === period ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    );
  };


  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-primary">My Wallet</h1>

      <div className="p-3 bg-accent/20 border-l-4 border-accent text-yellow-800 rounded-r-lg">
        <p className="font-semibold">Payments are settled T+1 after successful delivery.</p>
      </div>

      <div className="flex space-x-3">
        <WalletCard title="Total Earned" amount={totalEarned} icon={<WalletSummaryIcons.Total />} />
        <WalletCard title="Pending (T+1)" amount={pending} icon={<WalletSummaryIcons.Pending />} />
        <WalletCard title="Paid Out" amount={paid} icon={<WalletSummaryIcons.Paid />} />
      </div>

      <div>
        <div className="flex justify-between items-center mt-6 mb-2">
            <h2 className="text-2xl font-bold text-primary">History</h2>
            <div className="flex space-x-2">
                <FilterButton period="today" label="Today" />
                <FilterButton period="last7" label="Last 7 Days" />
                <FilterButton period="month" label="This Month" />
            </div>
        </div>
        <div className="bg-white rounded-lg shadow">
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading transactions...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredHistory.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {filteredHistory.map((item) => (
                    <li key={item.id} className="p-4 flex justify-between items-center">
                        <div>
                        <p className="font-bold text-primary">Order #{item.id}</p>
                        <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-green-600 text-lg">+ ₵{item.amount.toFixed(2)}</p>
                    </li>
                    ))}
                </ul>
            ) : (
                <div className="p-8 text-center text-gray-500">
                    <p>No transactions for this period.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WalletScreen;
