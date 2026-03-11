interface CustomerEntity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerWithPasswordEntity extends CustomerEntity {
  passwordHash: string;
}

interface CustomerAddressEntity {
  id: string;
  customerId: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
}

interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

interface CustomerRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

interface CustomerLoginPayload {
  email: string;
  password: string;
}

interface CreateCustomerAddressInput {
  label?: string | null;
  recipientName: string;
  phone?: string | null;
  country?: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  isDefault?: boolean;
}

interface UpdateCustomerAddressInput {
  label?: string | null;
  recipientName?: string;
  phone?: string | null;
  country?: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  postalCode?: string | null;
  isDefault?: boolean;
}
