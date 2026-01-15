import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { partnerApi } from '../services/api';
import LocationPicker from './LocationPicker';

type RegistrationStep = 1 | 2 | 3;

interface StepOneData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'partner';
}

interface StepTwoData {
  businessName: string;
  address: string;
  lat?: number;
  lng?: number;
  bio?: string;
  operatingHours?: {
    open: string;
    close: string;
  };
}

interface StepThreeData {
  momoNumber: string;
  momoNetwork: 'mtn' | 'vod' | 'atl';
  profilePicture?: string;
}

const PartnerRegistrationScreen: React.FC = () => {
  const { login } = useAppContext();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Step 1 state
  const [stepOneData, setStepOneData] = useState<StepOneData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'partner'
  });

  // Step 2 state
  const [stepTwoData, setStepTwoData] = useState<StepTwoData>({
    businessName: '',
    address: '',
    bio: '',
    operatingHours: {
      open: '08:00',
      close: '18:00'
    }
  });

  // Step 3 state
  const [stepThreeData, setStepThreeData] = useState<StepThreeData>({
    momoNumber: '',
    momoNetwork: 'mtn',
    profilePicture: ''
  });

  const inputClasses = "w-full p-4 text-lg border-2 border-gray-300 rounded-md focus:outline-none focus:border-primary";
  const buttonClasses = "w-full p-4 bg-primary text-white font-bold text-lg rounded-md active:scale-95 transition-transform disabled:bg-gray-400";

  const handleStepOne = async () => {
    setLoading(true);
    setError('');

    console.log('Sending stepOneData:', stepOneData);

    try {
      const response = await partnerApi.stepOne(stepOneData);
      if (response.success) {
        setTempToken(response.data.tempToken);
        setCurrentStep(2);
      } else {
        setError(response.message || 'Step 1 failed');
      }
    } catch (err) {
      console.error('Step 1 error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStepTwo = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await partnerApi.stepTwo(stepTwoData, tempToken);
      if (response.success) {
        setTempToken(response.data.tempToken);
        setCurrentStep(3);
      } else {
        setError(response.message || 'Step 2 failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStepThree = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await partnerApi.stepThree(stepThreeData, tempToken);
      if (response.success) {
        login(response.data.user, response.data.token);
        
        // Show success message
        alert('Registration completed successfully! You can complete business verification in your dashboard.');
        
        window.location.href = '/dashboard';
      } else {
        setError(response.message || 'Step 3 failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
          1
        </div>
        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
          2
        </div>
        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
          3
        </div>
      </div>
    );
  };

  const renderStepOne = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary mb-6">Basic Information</h2>
      
      <input
        type="email"
        placeholder="Email"
        value={stepOneData.email}
        onChange={(e) => setStepOneData({ ...stepOneData, email: e.target.value })}
        className={inputClasses}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={stepOneData.password}
        onChange={(e) => setStepOneData({ ...stepOneData, password: e.target.value })}
        className={inputClasses}
        required
      />
      
      <input
        type="text"
        placeholder="First Name"
        value={stepOneData.firstName}
        onChange={(e) => setStepOneData({ ...stepOneData, firstName: e.target.value })}
        className={inputClasses}
        required
      />
      
      <input
        type="text"
        placeholder="Last Name"
        value={stepOneData.lastName}
        onChange={(e) => setStepOneData({ ...stepOneData, lastName: e.target.value })}
        className={inputClasses}
        required
      />
      
      <input
        type="tel"
        placeholder="Phone Number"
        value={stepOneData.phone}
        onChange={(e) => setStepOneData({ ...stepOneData, phone: e.target.value })}
        className={inputClasses}
        required
      />
      
      <button onClick={handleStepOne} disabled={loading} className={buttonClasses}>
        {loading ? 'Processing...' : 'Next Step'}
      </button>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary mb-6">Business Information</h2>
      
      <input
        type="text"
        placeholder="Business Name"
        value={stepTwoData.businessName}
        onChange={(e) => setStepTwoData({ ...stepTwoData, businessName: e.target.value })}
        className={inputClasses}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Location</label>
        <LocationPicker
          onLocationSelect={(location) => {
            setStepTwoData({ 
              ...stepTwoData, 
              address: location.address,
              lat: location.lat,
              lng: location.lng
            });
          }}
          initialLocation={stepTwoData.lat && stepTwoData.lng ? 
            { lat: stepTwoData.lat, lng: stepTwoData.lng } : undefined
          }
        />
      </div>
      
      <textarea
        placeholder="Tell us about your business (optional)"
        value={stepTwoData.bio}
        onChange={(e) => setStepTwoData({ ...stepTwoData, bio: e.target.value })}
        className={`${inputClasses} h-32 resize-none`}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Operating Hours</label>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Open (e.g., 08:00)"
            value={stepTwoData.operatingHours?.open}
            onChange={(e) => setStepTwoData({ 
              ...stepTwoData, 
              operatingHours: { ...stepTwoData.operatingHours, open: e.target.value } 
            })}
            className={`${inputClasses} flex-1`}
          />
          <input
            type="text"
            placeholder="Close (e.g., 18:00)"
            value={stepTwoData.operatingHours?.close}
            onChange={(e) => setStepTwoData({ 
              ...stepTwoData, 
              operatingHours: { ...stepTwoData.operatingHours, close: e.target.value } 
            })}
            className={`${inputClasses} flex-1`}
          />
        </div>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setCurrentStep(1)} 
          className="flex-1 p-4 bg-gray-500 text-white font-bold text-lg rounded-md"
        >
          Back
        </button>
        <button onClick={handleStepTwo} disabled={loading} className={`${buttonClasses} flex-1`}>
          {loading ? 'Processing...' : 'Next Step'}
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary mb-6">Payment Setup</h2>
      
      <input
        type="tel"
        placeholder="Mobile Money Number"
        value={stepThreeData.momoNumber}
        onChange={(e) => setStepThreeData({ ...stepThreeData, momoNumber: e.target.value })}
        className={inputClasses}
        required
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Money Network</label>
        <div className="flex gap-4">
          {(['mtn', 'vod', 'atl'] as const).map((network) => (
            <button
              key={network}
              type="button"
              onClick={() => setStepThreeData({ ...stepThreeData, momoNetwork: network })}
              className={`flex-1 p-4 rounded-md font-bold transition-colors ${
                stepThreeData.momoNetwork === network 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {network.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <input
        type="url"
        placeholder="Profile Picture URL (optional)"
        value={stepThreeData.profilePicture}
        onChange={(e) => setStepThreeData({ ...stepThreeData, profilePicture: e.target.value })}
        className={inputClasses}
      />
      
      <div className="flex gap-4">
        <button 
          onClick={() => setCurrentStep(2)} 
          className="flex-1 p-4 bg-gray-500 text-white font-bold text-lg rounded-md"
        >
          Back
        </button>
        <button onClick={handleStepThree} disabled={loading} className={`${buttonClasses} flex-1`}>
          {loading ? 'Completing Registration...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">PurWash</h1>
          <p className="text-lg text-gray-300">Partner Registration</p>
          <p className="text-sm text-gray-400 mt-2">Join our network and start earning</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-2xl">
          {renderStepIndicator()}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {currentStep === 1 && renderStepOne()}
          {currentStep === 2 && renderStepTwo()}
          {currentStep === 3 && renderStepThree()}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegistrationScreen;
