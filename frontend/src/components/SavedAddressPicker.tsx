import React from 'react';
import type { SavedAddress } from '../services/addressService';

const MAX_SAVED_ADDRESSES = 3;

interface SavedAddressPickerProps {
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  isAddingNewAddress: boolean;
  editingAddressId: string | null;
  isBusy: boolean;
  onSelect: (address: SavedAddress) => void;
  onEdit: (address: SavedAddress) => void;
  onDelete: (address: SavedAddress) => void;
  onAddNew: () => void;
}

export const SavedAddressPicker: React.FC<SavedAddressPickerProps> = ({
  addresses,
  selectedAddressId,
  isAddingNewAddress,
  editingAddressId,
  isBusy,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}) => (
  <section className="space-y-3 rounded-lg border border-[#122023]/15 p-3">
    <div>
      <h3 className="text-xs font-mono-tabular font-bold uppercase tracking-wider text-[#122023]">
        Delivery address
      </h3>
      <p className="mt-1 text-[11px] text-[#122023]/60">
        Choose one saved address or add a new one. You can save up to {MAX_SAVED_ADDRESSES}.
      </p>
    </div>

    {addresses.length > 0 ? (
      <fieldset className="space-y-2">
        <legend className="sr-only">Choose a delivery address</legend>
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start ${
              selectedAddressId === address._id
                ? 'border-[#188D44] bg-[#B9FF2C]/20'
                : 'border-[#122023]/15 bg-white'
            }`}
          >
            <label className="flex min-w-0 flex-1 cursor-pointer gap-3">
              <input
                type="radio"
                name="saved-delivery-address"
                value={address._id}
                checked={selectedAddressId === address._id}
                onChange={() => onSelect(address)}
                disabled={isBusy}
                className="mt-0.5 accent-[#188D44]"
              />
              <span className="min-w-0 text-xs text-[#122023]">
                <span className="block font-bold capitalize">
                  {address.label || 'home'} · {address.customerName}
                  {address.isDefault ? ' · Default' : ''}
                  {editingAddressId === address._id ? ' · Editing' : ''}
                </span>
                <span className="mt-1 block text-[#122023]/70">
                  {[
                    address.addressLine1,
                    address.addressLine2,
                    address.area,
                    address.landmark,
                    address.city,
                    address.state,
                    address.pincode,
                  ].filter(Boolean).join(', ')}
                </span>
                {address.customerPhone && (
                  <span className="mt-1 block text-[#122023]/60">{address.customerPhone}</span>
                )}
              </span>
            </label>
            <div className="flex shrink-0 gap-3 pl-7 sm:pl-0">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onEdit(address)}
                className="text-xs font-bold text-[#188D44] underline underline-offset-2 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onDelete(address)}
                className="text-xs font-bold text-red-700 underline underline-offset-2 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </fieldset>
    ) : (
      <p className="rounded-lg bg-white p-3 text-xs text-[#122023]/70">
        No saved addresses yet. Add one below and it will be saved to your account.
      </p>
    )}

    {!isAddingNewAddress && !editingAddressId && addresses.length < MAX_SAVED_ADDRESSES ? (
      <button
        type="button"
        onClick={onAddNew}
        disabled={isBusy}
        className="rounded-lg border border-[#122023]/20 bg-white px-3 py-2 text-xs font-bold text-[#122023] hover:border-[#188D44] disabled:opacity-50"
      >
        Add another address ({addresses.length}/{MAX_SAVED_ADDRESSES})
      </button>
    ) : null}
  </section>
);
