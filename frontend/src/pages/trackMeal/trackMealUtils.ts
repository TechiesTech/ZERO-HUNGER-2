import type { CharityToken } from "../../data/mealProgram";
import type { DeliveryAddress, Order } from "../../services/orderService";
import type { TrackingData } from "../../services/trackingService";

export const EMPTY_ADDRESS: DeliveryAddress = {
  addressLine1: "",
  addressLine2: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

export type OrderTrackingStatus =
  | "confirmed"
  | "preparing"
  | "readyforpickup"
  | "outfordelivery"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_CONTENT: Record<
  OrderTrackingStatus,
  { title: string; description: string }
> = {
  confirmed: {
    title: "Your order is confirmed",
    description:
      "Your order has been received. The kitchen will begin preparing your meal soon.",
  },
  preparing: {
    title: "Your meal is being prepared",
    description:
      "The kitchen is preparing your meal. We’ll update your tracking as it moves to pickup.",
  },
  readyforpickup: {
    title: "Your meal is ready for pickup",
    description: "Your meal is packed and waiting for the delivery handoff.",
  },
  outfordelivery: {
    title: "Your meal is out for delivery",
    description:
      "The delivery team is on the way to the delivery address on your order.",
  },
  delivered: {
    title: "Your meal was delivered",
    description: "Delivery is confirmed. Thank you for supporting a sponsored meal.",
  },
  cancelled: {
    title: "This order was cancelled",
    description: "No further preparation or delivery updates are expected for this order.",
  },
};

export const ORDER_STATUS_STEPS: Array<{
  status: OrderTrackingStatus;
  label: string;
  description: string;
  timestampKey:
    | "createdAt"
    | "preparingAt"
    | "readyAt"
    | "outForDeliveryAt"
    | "deliveredAt"
    | "cancelledAt";
  bgClass: string;
}> = [
  {
    status: "confirmed",
    label: "ORDER CONFIRMED",
    description: "Your order and checkout details were received.",
    timestampKey: "createdAt",
    bgClass: "bg-[#49E619] text-[#122023]",
  },
  {
    status: "preparing",
    label: "PREPARING",
    description: "The kitchen is preparing your meal.",
    timestampKey: "preparingAt",
    bgClass: "bg-[#4EDBE2] text-[#122023]",
  },
  {
    status: "readyforpickup",
    label: "READY FOR PICKUP",
    description: "Your meal is packed and ready for the delivery handoff.",
    timestampKey: "readyAt",
    bgClass: "bg-[#B9FF2C] text-[#122023]",
  },
  {
    status: "outfordelivery",
    label: "OUT FOR DELIVERY",
    description: "Your meal is on its way to your delivery address.",
    timestampKey: "outForDeliveryAt",
    bgClass: "bg-[#4EDBE2] text-[#122023]",
  },
  {
    status: "delivered",
    label: "DELIVERED",
    description: "Your order has been delivered.",
    timestampKey: "deliveredAt",
    bgClass: "bg-[#49E619] text-[#122023]",
  },
  {
    status: "cancelled",
    label: "CANCELLED",
    description: "This order was cancelled.",
    timestampKey: "cancelledAt",
    bgClass: "bg-red-300 text-[#122023]",
  },
];

export function formatTrackingDate(date?: string | null) {
  if (!date) return undefined;
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate
        .toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase();
}

export function formatTrackingTimestamp(date?: string | null) {
  if (!date) return undefined;
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate
        .toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .toUpperCase();
}

export function getOrderTrackingStatus(
  status?: string,
): OrderTrackingStatus | undefined {
  const normalized = status?.toLowerCase();
  return normalized && Object.keys(ORDER_STATUS_CONTENT).includes(normalized)
    ? (normalized as OrderTrackingStatus)
    : undefined;
}

export function createTrackingToken(order: Order): CharityToken {
  const status = getOrderTrackingStatus(order.customerMealStatus) || "confirmed";
  const delivered = status === "delivered";
  const outForDelivery = status === "outfordelivery";
  const ready = status === "readyforpickup";
  const item = order.items[0];

  return {
    id: order._id,
    tokenNumber: order.orderNumber,
    orderId: order.orderNumber,
    productId: item?.mealId || order._id,
    productName:
      order.items
        .map(({ productName, quantity }) => `${productName || "Meal"} ×${quantity}`)
        .join(", ") || "Meal order",
    customerName: order.customerName,
    amountPaidInr: order.totalAmountInr,
    customerMealStatus: delivered
      ? "DELIVERED_TO_CUSTOMER"
      : outForDelivery
        ? "OUT_FOR_DELIVERY"
        : "PREPARING_IN_KITCHEN",
    beneficiaryId: "PENDING ASSIGNMENT",
    deliveryLocation: order.deliveryAddress?.city || "LOCATION NOT PROVIDED",
    status: delivered
      ? "DELIVERED"
      : outForDelivery
        ? "OUT_FOR_DELIVERY"
        : ready
          ? "ASSIGNED"
          : "PREPARING",
    purchasedAt: formatTrackingDate(order.createdAt) || "ORDER CONFIRMED",
    preparedAt: formatTrackingDate(order.statusTimestamps?.preparingAt),
    assignedAt: formatTrackingDate(order.statusTimestamps?.readyAt),
    deliveredAt: formatTrackingDate(order.statusTimestamps?.deliveredAt),
    photoUploaded: false,
    notificationSent: false,
  };
}

export function createOrderFromLiveTracking(
  tracking: TrackingData,
  customerEmail: string,
): Order {
  const timestampFor = (status: OrderTrackingStatus) =>
    tracking.timeline.find((step) => step.status === status)?.at || null;

  return {
    _id: tracking.orderNumber,
    orderNumber: tracking.orderNumber,
    customerName: tracking.customerName,
    customerEmail,
    items: tracking.items.map((item) => ({
      mealId: item.productName,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceInr: item.unitPriceInr,
      totalPriceInr: item.totalPriceInr,
    })),
    totalAmountInr: tracking.totalAmountInr,
    paymentStatus: tracking.paymentStatus,
    paymentMethod: "",
    customerMealStatus: tracking.customerMealStatus,
    sponsoredMealsCount: tracking.sponsoredMealsCount,
    statusTimestamps: {
      preparingAt: timestampFor("preparing"),
      readyAt: timestampFor("readyforpickup"),
      outForDeliveryAt: timestampFor("outfordelivery"),
      deliveredAt: timestampFor("delivered"),
      cancelledAt: timestampFor("cancelled"),
    },
    createdAt: tracking.placedAt,
    updatedAt: tracking.placedAt,
  };
}
