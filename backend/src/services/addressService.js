import AppError from '../utils/appError.js';
import * as addressRepository from '../repositories/addressRepository.js';

const MAX_ADDRESSES = 10;

const getMyAddresses = async (user) => addressRepository.getMyAddresses(user._id);

const createAddress = async (user, body) => {
    const saved = await addressRepository.getMyAddresses(user._id);
    if (saved.length >= MAX_ADDRESSES) {
        throw new AppError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
    }

    // Name and phone default to the account, and the customer can change them to send to another person
    const { isDefault, ...fields } = body;
    const address = {
        ...fields,
        customerName: body.customerName || user.name,
        customerPhone: String(body.customerPhone ?? user.phone ?? '').replace(/\D/g, '').slice(-10),
    };

    // The first address is always the default
    return addressRepository.createAddress(user._id, address, saved.length === 0 || isDefault);
};

// The old address is hidden (old orders still use it) and a new address with the changes takes its place
const updateAddress = async (user, addressId, body) => {
    const current = await addressRepository.getAddress(user._id, addressId);
    if (!current) throw new AppError('Address not found', 404);

    const { _id, ...fields } = current;
    const changes = { ...body };
    if (changes.customerPhone) changes.customerPhone = changes.customerPhone.replace(/\D/g, '').slice(-10);

    const address = await addressRepository.updateAddress(user._id, addressId, { ...fields, ...changes });
    if (!address) throw new AppError('Address not found', 404);
    return address;
};

const setDefaultAddress = async (user, addressId) => {
    const address = await addressRepository.setDefaultAddress(user._id, addressId);
    if (!address) throw new AppError('Address not found', 404);
    return address;
};

const deleteAddress = async (user, addressId) => {
    const removed = await addressRepository.deleteAddress(user._id, addressId);
    if (!removed) throw new AppError('Address not found', 404);

    // If the default one was removed, the first remaining address becomes the default
    if (removed.isDefault) {
        const [first] = await addressRepository.getMyAddresses(user._id);
        if (first) await addressRepository.setDefaultAddress(user._id, String(first._id));
    }
    return { _id: removed._id };
};

export { getMyAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress };