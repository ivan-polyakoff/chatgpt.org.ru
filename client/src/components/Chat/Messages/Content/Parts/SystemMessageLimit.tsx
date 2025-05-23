import React from 'react';
import SystemMessageLimitReached from '~/components/Chat/Messages/SystemMessageLimitReached';

interface SystemMessageLimitProps {
  systemMessageLimit: {
    message: string;
    limit: number;
    used: number;
    resetIn: number;
    planKey: string;
  };
}

export default function SystemMessageLimit({ systemMessageLimit }: SystemMessageLimitProps) {
  return (
    <SystemMessageLimitReached
      message={systemMessageLimit.message}
      limit={systemMessageLimit.limit}
      used={systemMessageLimit.used}
      resetIn={systemMessageLimit.resetIn}
      planKey={systemMessageLimit.planKey}
    />
  );
} 