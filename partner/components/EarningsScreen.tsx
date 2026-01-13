import React from 'react';

const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-accent">
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v1.25A9.786 9.786 0 003 8.25c0 2.879.992 5.545 2.671 7.622.33.356.72.684 1.143.984a.75.75 0 00.916-.046l.012-.009a18.332 18.332 0 0111.488 0l.012.009a.75.75 0 00.916.046c.423-.3.813-.628 1.143-.984C20.008 13.795 21 11.129 21 8.25a9.786 9.786 0 00-.75-3.432V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v-.025a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v.025z" />
        <path fillRule="evenodd" d="M12 21a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm8.24-.748a.75.75 0 00.528-.944l-.286-1.07a.75.75 0 00-1.42.378l.286 1.07a.75.75 0 00.892.572zM18 21a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm1.5 0a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21zm-12.75-.75a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V21a.75.75 0 01.75-.75h.01zM4.53 18.272a.75.75 0 00.892-.573l.286-1.07a.75.75 0 00-1.42-.378l-.286 1.07a.75.75 0 00.528.944z" clipRule="evenodd" />
    </svg>
);


const RevenueBox = ({ title, amount, description, isPrimary = false }: { title: string; amount: string; description: string; isPrimary?: boolean }) => (
    <div className={`rounded-2xl p-6 ${isPrimary ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
        <div className="flex justify-between items-center">
            <h3 className={`text-sm font-bold uppercase ${isPrimary ? 'text-slate-300' : 'text-slate-500'}`}>{title}</h3>
            {isPrimary && <WalletIcon />}
        </div>
        <p className={`text-4xl font-black mt-2 ${isPrimary ? 'text-white' : 'text-primary'}`}>{amount}</p>
        <p className={`text-xs mt-1 ${isPrimary ? 'text-slate-300' : 'text-slate-400'}`}>{description}</p>
    </div>
);

const EarningsScreen: React.FC = () => {
    return (
        <div>
            <div className="bg-accent text-primary text-center py-2 text-sm font-bold sticky top-0 z-10">
                Earnings are settled T+1 after order completion.
            </div>

            <div className="p-4 space-y-6">
                <header className="mb-4">
                    <h1 className="text-3xl font-black text-primary">Earnings</h1>
                    <p className="text-slate-500">Your read-only wallet mirror.</p>
                </header>

                <div className="space-y-4">
                    <RevenueBox
                        isPrimary
                        title="Available for Payout"
                        amount="GH₵ 1,250.75"
                        description="Next settlement: Tomorrow at 8:00 AM"
                    />
                    <RevenueBox
                        title="Total Revenue (This Month)"
                        amount="GH₵ 4,830.00"
                        description="Based on completed orders"
                    />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-primary mb-2">Recent Transactions</h2>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
                        {/* Transaction Item */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-primary">Payout for Order #123456</p>
                                <p className="text-sm text-slate-500">Jan 12, 2024</p>
                            </div>
                            <p className="font-bold text-green-600 text-lg">+ GH₵ 55.00</p>
                        </div>
                        <div className="border-t border-slate-100"></div>
                        {/* Transaction Item */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-primary">Payout for Order #654321</p>
                                <p className="text-sm text-slate-500">Jan 11, 2024</p>
                            </div>
                            <p className="font-bold text-green-600 text-lg">+ GH₵ 45.00</p>
                        </div>
                         <div className="border-t border-slate-100"></div>
                         {/* Transaction Item */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-primary">Payout for Order #789012</p>
                                <p className="text-sm text-slate-500">Jan 10, 2024</p>
                            </div>
                            <p className="font-bold text-green-600 text-lg">+ GH₵ 25.00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsScreen;
