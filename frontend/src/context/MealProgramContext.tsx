import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AppNotification,
  CharityToken,
  CharityTokenStatus,
  INITIAL_CHARITY_TOKENS,
  MealProduct,
  Order,
  Payment,
} from '../data/mealProgram';
import { createOrder, type DeliveryAddress } from '../services/orderService';

export interface CartItem {
  product: MealProduct;
  quantity: number;
}

interface PlaceOrderInput {
  addressId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING';
}

interface PlaceOrderResult {
  order: Order;
  payment: Payment;
  tokens: CharityToken[];
}

interface MealProgramContextValue {
  cart: CartItem[];
  cartCount: number;
  cartTotalInr: number;
  sponsoredMealsCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: MealProduct) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  tokens: CharityToken[];
  orders: Order[];
  notifications: AppNotification[];
  unreadCount: number;
  activeToast: AppNotification | null;
  dismissToast: () => void;
  markNotificationsRead: () => void;
  placeOrder: (input: PlaceOrderInput) => Promise<PlaceOrderResult>;
  findToken: (tokenNumber: string) => CharityToken | undefined;
  markTokenDelivered: (tokenNumber: string, beneficiaryId?: string, location?: string) => void;
  uploadDeliveryPhoto: (tokenNumber: string, photoUrl: string) => void;
  sendCustomerNotification: (tokenNumber: string) => void;
  updateTokenStatus: (tokenNumber: string, status: CharityTokenStatus) => void;
}

const MealProgramContext = createContext<MealProgramContextValue | undefined>(
  undefined
);

const STORAGE_KEY_TOKENS = 'zh_charity_tokens_v1';
const STORAGE_KEY_NOTIFICATIONS = 'zh_notifications_v1';

export const MealProgramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [tokens, setTokens] = useState<CharityToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOKENS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial seeded tokens
    }
    return INITIAL_CHARITY_TOKENS;
  });

  const [orders, setOrders] = useState<Order[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'notif-seed-1',
        tokenNumber: 'ZH-2026-A8F42K',
        recipientName: 'Philip',
        channels: ['WEBSITE', 'EMAIL', 'WHATSAPP'],
        title: 'Your sponsored meal has been delivered.',
        message:
          'A nutritious meal has reached a child (Beneficiary ID: ZH-10482) through our Hyderabad Community Centre distribution program.',
        createdAt: '01 OCT 2026',
        read: false,
      },
    ];
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    } catch {
      // ignore storage errors
    }
  }, [tokens]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_NOTIFICATIONS,
        JSON.stringify(notifications)
      );
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  const addToCart = (product: MealProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Customer ONLY pays ₹150 per meal box — the sponsored child meal is funded by this purchase at ₹0 extra charge
  const cartTotalInr = cart.reduce(
    (sum, item) => sum + item.product.priceInr * item.quantity,
    0
  );
  const sponsoredMealsCount = cartCount;

  const placeOrder = async (input: PlaceOrderInput): Promise<PlaceOrderResult> => {
    if (cart.length === 0) throw new Error('Add at least one meal before placing your order.');
    if (cart.some((item) => !/^[0-9a-f]{24}$/i.test(item.product.id))) {
      throw new Error('A selected meal is missing a valid database ID. Refresh the menu and try again.');
    }

    const response = await createOrder({
      addressId: input.addressId,
      paymentMethod: input.paymentMethod.toLowerCase() as 'upi' | 'card' | 'netbanking',
      items: cart.map((item) => ({ mealId: item.product.id, quantity: item.quantity })),
    });
    const backendOrder = response.data;
    const address = input.deliveryAddress;
    const formattedAddress = [
      address.addressLine1,
      address.addressLine2,
      address.area,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean).join(', ');
    const createdAt = new Date(backendOrder.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
    const newOrder: Order = {
      id: backendOrder._id,
      orderNumber: backendOrder.orderNumber,
      userId: `USR-${Date.now()}`,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      deliveryAddress: formattedAddress,
      totalAmountInr: backendOrder.totalAmountInr,
      sponsoredMealsCount: backendOrder.sponsoredMealsCount,
      customerMealStatus: backendOrder.customerMealStatus.toUpperCase() as Order['customerMealStatus'],
      paymentStatus: backendOrder.paymentStatus.toUpperCase() as Payment['status'],
      createdAt,
    };
    const newPayment: Payment = {
      id: `PAY-${backendOrder._id}`,
      orderId: backendOrder._id,
      amountInr: backendOrder.totalAmountInr,
      method: backendOrder.paymentMethod.toUpperCase() as Payment['method'],
      status: backendOrder.paymentStatus.toUpperCase() as Payment['status'],
      transactionReference: 'PENDING',
      paidAt: createdAt,
    };

    setOrders((previous) => [newOrder, ...previous]);
    clearCart();
    return { order: newOrder, payment: newPayment, tokens: [] };
  };

  const findToken = (tokenNumber: string): CharityToken | undefined => {
    const clean = tokenNumber.trim().toUpperCase();
    return tokens.find((t) => t.tokenNumber.toUpperCase() === clean);
  };

  const updateTokenStatus = (
    tokenNumber: string,
    status: CharityTokenStatus
  ) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNumber.toUpperCase() !== tokenNumber.toUpperCase()) return t;
        return {
          ...t,
          status,
          preparedAt: t.preparedAt || '30 SEP 2026',
          assignedAt: t.assignedAt || '30 SEP 2026',
          deliveredAt: status === 'DELIVERED' ? '01 OCT 2026' : t.deliveredAt,
        };
      })
    );
  };

  const markTokenDelivered = (
    tokenNumber: string,
    beneficiaryId?: string,
    location?: string
  ) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNumber.toUpperCase() !== tokenNumber.toUpperCase()) return t;
        return {
          ...t,
          status: 'DELIVERED',
          beneficiaryId: beneficiaryId || t.beneficiaryId || 'ZH-10482',
          deliveryLocation:
            location || t.deliveryLocation || 'Hyderabad Community Centre',
          preparedAt: t.preparedAt || '30 SEP 2026',
          assignedAt: t.assignedAt || '30 SEP 2026',
          deliveredAt: '01 OCT 2026',
          customerMealStatus: 'DELIVERED_TO_CUSTOMER',
        };
      })
    );
  };

  const uploadDeliveryPhoto = (tokenNumber: string, photoUrl: string) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNumber.toUpperCase() !== tokenNumber.toUpperCase()) return t;
        return {
          ...t,
          deliveryPhoto: photoUrl,
          photoUploaded: true,
        };
      })
    );
  };

  const sendCustomerNotification = (tokenNumber: string) => {
    const target = findToken(tokenNumber);
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNumber.toUpperCase() !== tokenNumber.toUpperCase()) return t;
        return {
          ...t,
          status: 'DELIVERED',
          deliveredAt: t.deliveredAt || '01 OCT 2026',
          photoUploaded: true,
          notificationSent: true,
        };
      })
    );

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      tokenNumber: target ? target.tokenNumber : tokenNumber.toUpperCase(),
      recipientName: target ? target.customerName : 'Supporter',
      channels: ['WEBSITE', 'EMAIL', 'WHATSAPP'],
      title: 'Your sponsored meal has been delivered.',
      message: `A nutritious meal has reached a child (Beneficiary ID: ${
        target?.beneficiaryId || 'ZH-10482'
      }) through our community distribution program. Thank you for being part of the mission. ❤️`,
      createdAt: '01 OCT 2026',
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
  };

  const dismissToast = () => setActiveToast(null);

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MealProgramContext.Provider
      value={{
        cart,
        cartCount,
        cartTotalInr,
        sponsoredMealsCount,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        tokens,
        orders,
        notifications,
        unreadCount,
        activeToast,
        dismissToast,
        markNotificationsRead,
        placeOrder,
        findToken,
        markTokenDelivered,
        uploadDeliveryPhoto,
        sendCustomerNotification,
        updateTokenStatus,
      }}
    >
      {children}
    </MealProgramContext.Provider>
  );
};

export const useMealProgram = (): MealProgramContextValue => {
  const ctx = useContext(MealProgramContext);
  if (!ctx) {
    throw new Error('useMealProgram must be used within a MealProgramProvider');
  }
  return ctx;
};
