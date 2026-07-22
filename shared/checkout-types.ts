export interface CartItem {
  product: string;
  boxSize: number;
  quantity: number;
  unitPriceIncVat: number;
  vatRate: number;
  fulfilmentMethod: 'delivery';
  preferredDate: string;
  preferredTime: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface DeliveryDetails {
  street: string;
  houseNumber: string;
  apartment: string;
  city: string;
  postcode: string;
  deliveryDate: string;
  preferredTime: string;
}

export interface CheckoutRequest {
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  cartItems: CartItem[];
}