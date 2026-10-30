/**
 * FacebookCommunityCard
 *
 * Link card to the FivePrayer Facebook community group.
 *
 * @module welcome/FacebookCommunityCard
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

const FacebookCommunityCard: React.FC = () => {
  return (
    <a
      href="https://www.facebook.com/groups/fiveprayer"
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-800 group-hover:text-blue-900">{__('Join the FivePrayer Community', 'fiveprayer')}</p>
          <p className="text-xs text-blue-600">{__('Get support, share feedback, and connect with users', 'fiveprayer')}</p>
        </div>
        <svg className="w-4 h-4 text-blue-300 shrink-0 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>
    </a>
  );
};

export default FacebookCommunityCard;
