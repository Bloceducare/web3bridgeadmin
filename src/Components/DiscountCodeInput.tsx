"use client";

import React, { useState, useEffect } from 'react';
import { validateDiscountCode, DiscountCodeValidation } from '@/hooks/discount';
import { DISCOUNT_CONFIG } from '@/lib/config';
import { BeatLoader } from 'react-spinners';

interface DiscountCodeInputProps {
  onCodeChange: (code: string, validation: DiscountCodeValidation | null) => void;
  userEmail?: string;
  token?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  onCodeChange,
  userEmail,
  token,
  placeholder = "Enter discount code",
  className = "",
  disabled = false
}) => {
  const [code, setCode] = useState('');
  const [validation, setValidation] = useState<DiscountCodeValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleValidate = async (codeValue: string) => {
    if (!codeValue.trim()) {
      setValidation(null);
      onCodeChange(codeValue, null);
      return;
    }

    if (!userEmail) {
      setValidation({
        valid: false,
        message: "User email is required for validation"
      });
      onCodeChange(codeValue, validation);
      return;
    }

    setLoading(true);
    try {
      const result = await validateDiscountCode(codeValue, userEmail, token);
      setValidation(result);
      onCodeChange(codeValue, result);
    } catch (error) {
      setValidation({
        valid: false,
        message: "Validation failed"
      });
      onCodeChange(codeValue, validation);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced validation
    const newTimer = setTimeout(() => {
      handleValidate(value);
    }, 500);

    setDebounceTimer(newTimer);
  };

  const handleBlur = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    handleValidate(code);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={code}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validation?.valid 
              ? 'border-green-500 bg-green-50' 
              : validation?.valid === false 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          maxLength={DISCOUNT_CONFIG.MAX_CODE_LENGTH}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <BeatLoader size={8} color="#3B82F6" />
          </div>
        )}
      </div>

      {validation && (
        <div className={`p-3 rounded-lg text-sm ${
          validation.valid 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {validation.valid ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="font-medium">Code is valid!</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Discount:</strong> {validation.percentage}%</p>
                <p><strong>Type:</strong> {validation.offset === 1 ? 'Single-use' : `Multi-use (${validation.offset} uses)`}</p>
                <p><strong>Remaining uses:</strong> {validation.remainingUses}</p>
                {validation.usageCount && validation.usageCount > 0 && (
                  <p><strong>Used:</strong> {validation.usageCount} times</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-red-600">❌</span>
              <span>{validation.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;
