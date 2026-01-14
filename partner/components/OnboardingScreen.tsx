import React, { useState } from 'react';
import { verifyMomo } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface OnboardingScreenProps {
    onOnboardingComplete: () => void;
}

const LocationPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3 text-primary">
        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.169-4.4c1.52-2.324 2.223-4.887 2.223-7.482 0-5.142-4.129-9.31-9.282-9.31S2.258 5.28 2.258 10.423c0 2.595.703 5.158 2.223 7.482a16.975 16.975 0 005.169 4.4l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041zM12 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
);

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onOnboardingComplete }) => {
    const { user, login } = useAppContext();
    const [step, setStep] = useState(1);
    const [momoNumber, setMomoNumber] = useState('');
    const [momoNetwork, setMomoNetwork] = useState('mtn');
    const [businessName, setBusinessName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resolvedName, setResolvedName] = useState('');

    // Pre-fill business name if user already has it
    React.useEffect(() => {
        if (user?.businessName) {
            setBusinessName(user.businessName);
        }
    }, [user]);

    const handleMomoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await verifyMomo({
                momoNumber,
                momoNetwork,
                businessName
            });
            if(response.success && response.user) {
                setResolvedName((response.user as any).resolvedName);
                
                // Update user context with new data
                const token = localStorage.getItem('PurWashPartnerToken');
                if (token) {
                    login(response.user, token);
                }
                
                setTimeout(() => setStep(2), 1000); // Give user time to see resolved name
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify MoMo details.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-primary">PurWash Partner</h1>
                    <p className="text-slate-500 mt-1">Business Setup</p>
                </div>

                {/* Step Indicator */}
                <div className="flex justify-center items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className={`h-1 flex-grow ${step > 1 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                </div>

                {step === 1 && (
                    <form onSubmit={handleMomoSubmit} className="space-y-4">
                        <h2 className="text-xl font-bold text-primary text-center">Payment Setup</h2>
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-bold text-slate-700">Business Name</label>
                            <input id="businessName" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g., Clean Laundry Services" required />
                        </div>
                        <div>
                            <label htmlFor="momoNetwork" className="block text-sm font-bold text-slate-700">MoMo Network</label>
                            <select id="momoNetwork" value={momoNetwork} onChange={(e) => setMomoNetwork(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="mtn">MTN Mobile Money</option>
                                <option value="telecel">Telecel Cash</option>
                                <option value="at">AT Money</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="momoNumber" className="block text-sm font-bold text-slate-700">MoMo Number</label>
                            <input id="momoNumber" type="tel" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0541234567" required />
                        </div>
                        {resolvedName && <div className="p-3 bg-green-100 text-green-800 rounded-lg text-center font-bold">{resolvedName}</div>}
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-opacity-90 disabled:bg-slate-400 transition-all">
                            {isLoading ? 'Verifying...' : 'Verify & Continue'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="space-y-6 text-center">
                        <h2 className="text-xl font-bold text-primary">Location Setup</h2>
                        <p className="text-slate-600">Pin your business location on the map so riders can easily find you.</p>
                        <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                             <div className="aspect-video bg-cover rounded-lg" style={{backgroundImage: "url('https://picsum.photos/seed/map/600/400')"}}>
                                 <div className="flex items-center justify-center h-full w-full bg-black bg-opacity-20">
                                     <LocationPinIcon />
                                 </div>
                             </div>
                             <button className="mt-4 w-full bg-white border border-primary text-primary py-3 rounded-xl font-bold">
                                 Drop Pin on Map
                             </button>
                        </div>
                        <button onClick={onOnboardingComplete} className="w-full bg-accent text-primary py-4 rounded-xl font-bold shadow-lg shadow-yellow-100 hover:bg-opacity-90 transition-all">
                            Complete Setup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingScreen;
