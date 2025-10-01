"use client";

import React, { useState, useEffect } from 'react';
import { validateDiscountCode, DiscountCodeValidation } from '@/hooks/discount';
import { BeatLoader } from 'react-spinners';

interface DiscountCodeStatusProps {
  code: string;
  userEmail?: string;
  token?: string;
  className?: string;
  showDetails?: boolean;
}

const DiscountCodeStatus: React.FC<DiscountCodeStatusProps> = ({
  code,
  userEmail,
  token,
  className = "",
  showDetails = true
}) => {
  const [status, setStatus] = useState<DiscountCodeValidation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (code && userEmail) {
      setLoading(true);
      validateDiscountCode(code, userEmail, token)
        .then(setStatus)
        .catch(() => {
          setStatus({
            valid: false,
            message: "Failed to validate code"
          });
        })
        .finally(() => setLoading(false));
    } else {
      setStatus(null);
    }
  }, [code, userEmail, token]);

  if (!code) return null;

  return (
    <div className={`p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">Discount Code: {code}</h4>
        {loading && <BeatLoader size={8} color="#3B82F6" />}
      </div>

      {status && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 ${
            status.valid ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="text-lg">
              {status.valid ? '✅' : '❌'}
            </span>
            <span className="font-medium">
              {status.valid ? 'Valid' : 'Invalid'}
            </span>
          </div>

          {status.valid && showDetails && (
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Discount:</span> {status.percentage}%
              </div>
              <div>
                <span className="font-medium">Type:</span> {status.offset === 1 ? 'Single-use' : 'Multi-use'}
              </div>
              <div>
                <span className="font-medium">Remaining:</span> {status.remainingUses}
              </div>
              {status.usageCount && status.usageCount > 0 && (
                <div>
                  <span className="font-medium">Used:</span> {status.usageCount} times
                </div>
              )}
            </div>
          )}

          {!status.valid && status.message && (
            <p className="text-sm text-red-600">{status.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountCodeStatus;
