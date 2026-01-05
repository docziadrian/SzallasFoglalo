export type Role = {
  role: 'user' | 'admin';
};

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  // optional flags: backend may return either 'active' or 'is_active' as number(0/1) or boolean
  active?: number | boolean;
  is_active?: number | boolean;
}
