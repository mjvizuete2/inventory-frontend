export interface Customer {
  id: number;
  name: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: 'active' | 'inactive';
  updatedAt: string;
}

export type CustomerPayload = Omit<Customer, 'id' | 'updatedAt'>;
