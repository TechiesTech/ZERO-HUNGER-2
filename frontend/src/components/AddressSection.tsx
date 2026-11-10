import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import LocationPicker from './LocationPicker';
import {
  reverseGeocode,
  type DeliveryAddress,
  type DeliveryPoint,
} from '../services/orderService';

export interface AddressSelection {
  address: DeliveryAddress;
  location: DeliveryPoint | null;
}

interface AddressSectionProps {
  value: AddressSelection;
  onChange: (value: AddressSelection) => void;
  requestLocationOnMount?: boolean;
}

const EMPTY_ADDRESS: DeliveryAddress = {
  addressLine1: '',
  addressLine2: '',
  area: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
};

const addressFields: Array<[keyof DeliveryAddress, string, boolean]> = [
  ['addressLine1', 'Address line 1 / flat or house', true],
  ['addressLine2', 'Address line 2', false],
  ['area', 'Area', true],
  ['landmark', 'Landmark', false],
  ['city', 'City', true],
  ['state', 'State', true],
  ['pincode', 'PIN code', true],
];

export default function AddressSection({
  value,
  onChange,
  requestLocationOnMount = false,
}: AddressSectionProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const locationRequestId = useRef(0);

  const setAddressField = (field: keyof DeliveryAddress, text: string) => {
    locationRequestId.current += 1;
    setBusy(false);
    const address = { ...value.address, [field]: text };
    const location = field === 'addressLine2' || field === 'landmark'
      ? value.location
      : null;
    onChange({ address, location });
    if (!location) setMessage('Address changed. Confirm its delivery pin again.');
  };

  const applyAddress = (found: Partial<DeliveryAddress>, preserveAddressLine = false) => {
    const address = { ...value.address };
    for (const [field] of addressFields) {
      const text = found[field];
      if (typeof text === 'string' && text.trim()) address[field] = text;
    }
    if (preserveAddressLine && value.address.addressLine1) {
      address.addressLine1 = value.address.addressLine1;
    }
    return address;
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('GPS is not supported. Enter the address and choose the pin on the map.');
      return;
    }

    setBusy(true);
    setMessage('');
    const requestId = ++locationRequestId.current;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (requestId !== locationRequestId.current) return;
        const point = {
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        };
        onChange({ ...value, location: point });
        if (coords.accuracy > 100) {
          setMessage(`GPS accuracy is about ${Math.round(coords.accuracy)} m. Adjust the pin if needed.`);
        }
        try {
          const response = await reverseGeocode(point);
          if (requestId !== locationRequestId.current) return;
          if (response.data.address) {
            onChange({
              address: applyAddress(response.data.address, true),
              location: point,
            });
          }
        } catch (error) {
          if (requestId === locationRequestId.current) {
            setMessage(error instanceof Error
              ? `Pin selected, but address lookup failed: ${error.message}`
              : 'Pin selected, but address lookup failed.');
          }
        } finally {
          if (requestId === locationRequestId.current) setBusy(false);
        }
      },
      (error) => {
        if (requestId !== locationRequestId.current) return;
        setMessage(error.code === error.PERMISSION_DENIED
          ? 'Location permission denied. Enter the address and choose the pin on the map.'
          : 'Could not get your location. Enter the address and choose the pin on the map.');
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (requestLocationOnMount) useCurrentLocation();
  }, [requestLocationOnMount]);

  const movePin = async (location: DeliveryPoint) => {
    const requestId = ++locationRequestId.current;
    setBusy(false);
    onChange({ ...value, location });
    setMessage('');
    try {
      const response = await reverseGeocode(location);
      if (requestId !== locationRequestId.current) return;
      if (response.data.address) {
        onChange({
          address: applyAddress(response.data.address, true),
          location,
        });
      }
    } catch (error) {
      if (requestId === locationRequestId.current) {
        setMessage(error instanceof Error
          ? `Pin saved, but address lookup failed: ${error.message}`
          : 'Pin saved, but address lookup failed.');
      }
    }
  };

  const useAnotherAddress = () => {
    locationRequestId.current += 1;
    setBusy(false);
    onChange({ address: EMPTY_ADDRESS, location: null });
    setMessage('');
  };

  return (
    <section className="space-y-3 rounded-lg border border-[#122023]/15 p-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#122023]/20 bg-white px-3 py-2 text-xs font-bold text-[#122023] disabled:opacity-50"
        >
          <LocateFixed className="h-4 w-4" />
          {busy ? 'Please wait…' : 'Use current location'}
        </button>
        <button
          type="button"
          onClick={useAnotherAddress}
          disabled={busy}
          className="rounded-lg border border-[#122023]/20 bg-white px-3 py-2 text-xs font-bold text-[#122023] disabled:opacity-50"
        >
          Use another address
        </button>
      </div>
      <p className="text-xs text-[#122023]/65">
        Use GPS or select the delivery point on the map. Add your flat or house number below.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {addressFields.map(([field, label, required]) => (
          <label
            key={field}
            htmlFor={`address-${field}`}
            className={`block text-[11px] font-mono-tabular uppercase text-[#122023]/70 ${field === 'addressLine1' ? 'col-span-2' : ''}`}
          >
            {label}{required ? ' *' : ''}
            <input
              id={`address-${field}`}
              type="text"
              inputMode={field === 'pincode' ? 'numeric' : undefined}
              pattern={field === 'pincode' ? '[1-9][0-9]{5}' : undefined}
              maxLength={field === 'pincode' ? 6 : undefined}
              value={value.address[field] || ''}
              onChange={(event) => setAddressField(field, event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#122023]/20 bg-white px-3 py-2 text-xs text-[#122023]"
              required={required}
            />
          </label>
        ))}
      </div>

      <LocationPicker value={value.location} onChange={movePin} />
      {value.location && (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#188D44]">
          <MapPin className="h-3.5 w-3.5" />
          Delivery pin confirmed
        </p>
      )}
      {message && <p role="status" className="text-xs font-semibold text-[#122023]/70">{message}</p>}
    </section>
  );
}
