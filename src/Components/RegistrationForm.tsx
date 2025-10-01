"use client";

import React, { useState } from 'react';
import { DiscountCodeInput, DiscountCodeStatus } from '@/Components';
import { validateDiscountCode, markDiscountCodeUsage, DiscountCodeValidation } from '@/hooks/discount';

interface RegistrationFormProps {
  onSubmit: (formData: any, discountCode?: string) => Promise<{ success: boolean; participantId?: number }>;
  className?: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  className = ""
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: ''
  });
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState<DiscountCodeValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDiscountCodeChange = (code: string, validation: DiscountCodeValidation | null) => {
    setDiscountCode(code);
    setDiscountValidation(validation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Validate discount code if provided
      if (discountCode && discountValidation?.valid) {
        // Code is already validated by the input component
        console.log('Using discount code:', discountCode, 'with validation:', discountValidation);
      } else if (discountCode && !discountValidation?.valid) {
        setMessage('Please enter a valid discount code or remove it.');
        setLoading(false);
        return;
      }

      // Step 2: Submit registration
      const result = await onSubmit(formData, discountCode);

      if (result.success) {
        // Step 3: Mark discount code usage if code was used
        if (discountCode && discountValidation?.valid && result.participantId) {
          const usageResult = await markDiscountCodeUsage(
            discountCode,
            formData.email,
            result.participantId
          );

          if (usageResult.success) {
            setMessage('Registration successful! Discount code has been applied.');
          } else {
            setMessage('Registration successful, but there was an issue with the discount code.');
          }
        } else {
          setMessage('Registration successful!');
        }

        // Reset form
        setFormData({ name: '', email: '', phone: '', course: '' });
        setDiscountCode('');
        setDiscountValidation(null);
      } else {
        setMessage('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-center">Course Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            name="course"
            value={formData.course}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a course</option>
            <option value="web3-fundamentals">Web3 Fundamentals</option>
            <option value="blockchain-development">Blockchain Development</option>
            <option value="defi-mastery">DeFi Mastery</option>
            <option value="nft-creation">NFT Creation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Code (Optional)
          </label>
          <DiscountCodeInput
            onCodeChange={handleDiscountCodeChange}
            userEmail={formData.email}
            placeholder="Enter discount code"
            disabled={loading}
          />
        </div>

        {discountCode && (
          <DiscountCodeStatus
            code={discountCode}
            userEmail={formData.email}
            showDetails={true}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Registering...' : 'Register Now'}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-center ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default RegistrationForm;
