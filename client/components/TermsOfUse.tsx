import React from 'react';

interface TermsOfUseProps {
  onBack: () => void;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen p-6 md:p-10 text-slate-900 animate-fade-in">
      <header className="mb-8">
        <button onClick={onBack} className="text-slate-900 font-semibold mb-4 hover:underline">
          &larr; Back to Home
        </button>
        <h1 className="text-4xl font-extrabold tracking-tight">Terms of Use</h1>
        <p className="text-slate-500 mt-2">Last Updated: July 26, 2024</p>
      </header>

      <main className="prose prose-slate max-w-none">
        <p>
          Please read these Terms of Use ("Terms") carefully before using the PurWash laundry service ("Service") operated by PurWash ("us", "we", or "our"). Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms.
        </p>

        <h2 className="text-2xl font-bold">1. Description of Service</h2>
        <p>
          PurWash provides laundry pickup and delivery services. While we strive for a 48-hour turnaround, this is a target and not a guarantee. Service availability is subject to operational capacity and weather conditions. We reserve the right to refuse service to anyone for any reason at any time.
        </p>

        <h2 className="text-2xl font-bold">2. User Information</h2>
        <p>
          To use our Service, you must provide an accurate phone number, name, and pickup/delivery location. Your phone number acts as your unique identifier. You are responsible for the accuracy of the information provided.
        </p>
        
        <h2 className="text-2xl font-bold">3. Payments and Billing</h2>
        <p>
          All payments for services are due upon placing an order and are processed through our third-party payment processor, Paystack. By placing an order, you agree to pay all charges associated with the service, including the item costs and any applicable delivery fees. All prices are subject to change without notice.
        </p>
        
        <h2 className="text-2xl font-bold">4. User Responsibilities</h2>
        <p>
          It is your responsibility to check your items for any valuables or personal belongings before providing them to us. We are not responsible for any lost items. You must also ensure that items are suitable for standard washing and folding processes.
        </p>

        <h2 className="text-2xl font-bold">5. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, PurWash shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including damages for loss of profits or personal belongings. Our liability for any claim related to damaged or lost items during the laundry process is limited to the cost of the service for the specific order in question. We are not liable for pre-existing damage to garments.
        </p>
        
        <h2 className="text-2xl font-bold">6. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions.
        </p>

        <h2 className="text-2xl font-bold">7. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
        </p>
        
        <h2 className="text-2xl font-bold">Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at +233 55 123 4567.
        </p>
      </main>
    </div>
  );
};

export default TermsOfUse;