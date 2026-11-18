import React from 'react';
import { useParams } from 'react-router-dom';
import { LiveTracking } from './LiveTracking';

export function ZeptoTracking(): React.ReactElement {
  const { orderId } = useParams<{ orderId: string }>();
  return <LiveTracking orderNumber={orderId || ''} />;
}
