<<<<<<< Updated upstream
import React from 'react';
import { useParams } from 'react-router-dom';
import { LiveTracking } from './LiveTracking';
=======
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Clock, MapPin, Navigation, Phone, Star, Truck, X, Loader2, CheckCircle2 } from 'lucide-react';
import { trackLiveOrder } from '../services/trackingService';
>>>>>>> Stashed changes

export function ZeptoTracking(): React.ReactElement {
  const { orderId } = useParams<{ orderId: string }>();
  return <LiveTracking orderNumber={orderId || ''} />;
}
