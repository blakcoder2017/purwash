import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen p-6 md:p-10 text-slate-900 animate-fade-in">
      <header className="mb-8">
        <button onClick={onBack} className="text-slate-900 font-semibold mb-4 hover:underline">
          &larr; Back to Home
        </button>
        <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="text-slate-500 mt-2">Last Updated: July 26, 2024</p>
      </header>

      <main className="prose prose-slate max-w-none">
        <p>
          PurWash ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our laundry services (the "Services").
        </p>

        <h2 className="text-2xl font-bold">Information We Collect</h2>
        <p>
          We may collect the following types of information:
        </p>
        <ul>
          <li><strong>Personal Information:</strong> Your name and phone number, which you provide when placing an order.</li>
          <li><strong>Location Information:</strong> Your physical address or real-time geographic location data, which is necessary for our pickup and delivery service.</li>
          <li><strong>Payment Information:</strong> We utilize a secure third-party payment processor (Paystack) to handle transactions. PurWash does not store your full credit or debit card details.</li>
        </ul>

        <h2 className="text-2xl font-bold">How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Provide, operate, and maintain our Services.</li>
          <li>Process your payments and fulfill your orders.</li>
          <li>Communicate with you regarding your order status and for customer support.</li>
          <li>Improve the efficiency and quality of our Services.</li>
        </ul>

        <h2 className="text-2xl font-bold">Information Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to others. We may share your information with trusted third parties who assist us in operating our service, such as delivery partners, for the sole purpose of fulfilling your order. These parties are obligated to keep your information confidential.
        </p>

        <h2 className="text-2xl font-bold">Data Security</h2>
        <p>
          We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
        </p>

        <h2 className="text-2xl font-bold">Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this page periodically for any changes.
        </p>

        <h2 className="text-2xl font-bold">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at +233 55 123 4567.
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;