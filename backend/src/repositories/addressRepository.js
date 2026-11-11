import mongoose from 'mongoose';
import { Address } from '../models/schemas/addressSchema.js';

// Saved addresses of one customer, without the deleted ones (empty list if none)
const getMyAddresses = async (userId) => {
    const doc = await Address.findOne({ userId }).lean();
    return (doc?.addresses || []).filter((address) => !address.isDeleted);
};

// One saved address, only if it belongs to this customer and is not deleted (also used by the order module)
const getAddress = async (userId, addressId) => {
    const savedId = new mongoose.Types.ObjectId(addressId);

    const doc = await Address.findOne(
        { userId, addresses: { $elemMatch: { _id: savedId, isDeleted: false } } },
        { addresses: { $elemMatch: { _id: savedId, isDeleted: false } } }
    ).lean();

    return doc?.addresses?.[0] || null;
};

// Adds one address to the customer's list (creates the customer's document on the first address)
const createAddress = async (userId, address, makeDefault) => {
    if (makeDefault) {
        await Address.updateOne({ userId }, { $set: { 'addresses.$[].isDefault': false } });
    }

    const doc = await Address.findOneAndUpdate(
        { userId },
        { $push: { addresses: { ...address, isDefault: makeDefault, isDeleted: false } } },
        { new: true, upsert: true, runValidators: true }
    ).lean();

    return doc.addresses[doc.addresses.length - 1];
};

// Changes only the sent fields of the same address, the _id stays the same
const updateAddress = async (userId, addressId, changes) => {
    const savedId = new mongoose.Types.ObjectId(addressId);

    const doc = await Address.findOneAndUpdate(
        { userId, addresses: { $elemMatch: { _id: savedId, isDeleted: false } } },
        {
            $set: Object.fromEntries(
                Object.entries(changes).map(([key, value]) => [`addresses.$[target].${key}`, value])
            ),
        },
        { arrayFilters: [{ 'target._id': savedId }], new: true }
    ).lean();

    return doc?.addresses.find((address) => String(address._id) === String(savedId)) || null;
};

// One update: the chosen address becomes the default and all the others stop being the default
const setDefaultAddress = async (userId, addressId) => {
    const chosenId = new mongoose.Types.ObjectId(addressId);

    const doc = await Address.findOneAndUpdate(
        { userId, addresses: { $elemMatch: { _id: chosenId, isDeleted: false } } },
        [
            {
                $set: {
                    addresses: {
                        $map: {
                            input: '$addresses',
                            as: 'saved',
                            in: { $mergeObjects: ['$$saved', { isDefault: { $eq: ['$$saved._id', chosenId] } }] },
                        },
                    },
                },
            },
        ],
        { new: true }
    ).lean();

    return doc?.addresses.find((address) => String(address._id) === String(chosenId)) || null;
};

// The address is only hidden, never removed, because old orders still point to it
const deleteAddress = async (userId, addressId) => {
    const removedId = new mongoose.Types.ObjectId(addressId);

    const doc = await Address.findOneAndUpdate(
        { userId, addresses: { $elemMatch: { _id: removedId, isDeleted: false } } },
        { $set: { 'addresses.$[target].isDeleted': true, 'addresses.$[target].isDefault': false } },
        { arrayFilters: [{ 'target._id': removedId }] }
    ).lean();

    return doc?.addresses.find((address) => String(address._id) === String(removedId)) || null;
};

export { getMyAddresses, getAddress, createAddress, updateAddress, setDefaultAddress, deleteAddress };