import React, { createContext, useContext, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'ORGANISATION' | 'CONSUMER';

export interface AuthUser {
  email: string;
  role: UserRole;
  displayName: string;
  /** Only set for CONSUMER — links to a customer account in the stream */
  accountId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  /**
   * Returns null on success, or an error message string if credentials are wrong.
   */
  login: (email: string, password: string) => string | null;
  logout: () => void;
}

// ── Predefined credential accounts ───────────────────────────────────────────
// These are the only valid credentials. No domain-guessing logic.
interface AccountDef {
  password: string;
  role: UserRole;
  displayName: string;
  accountId: string | null;
}

const ACCOUNTS: Record<string, AccountDef> = {
  // ── Organisation / Bank Ops
  'admin@fraudguard-bank.com': {
    password: 'Bank@2025',
    role: 'ORGANISATION',
    displayName: 'Admin — FraudGuard Bank',
    accountId: null,
  },
  'risk.ops@fraudguard-bank.com': {
    password: 'Risk@2025',
    role: 'ORGANISATION',
    displayName: 'Risk Operations',
    accountId: null,
  },

  // ── Consumer accounts (each maps to a live stream customer profile)
  'alex.johnson@gmail.com': {
    password: 'Alex@123',
    role: 'CONSUMER',
    displayName: 'Alex M. Johnson',
    accountId: 'C10293847',
  },
  'priya.sharma@gmail.com': {
    password: 'Priya@123',
    role: 'CONSUMER',
    displayName: 'Priya Sharma',
    accountId: 'C89234120',
  },
  'michael.torres@yahoo.com': {
    password: 'Mike@123',
    role: 'CONSUMER',
    displayName: 'Michael Torres',
    accountId: 'C49201948',
  },
  'sandra.wu@outlook.com': {
    password: 'Sandra@123',
    role: 'CONSUMER',
    displayName: 'Sandra Wu',
    accountId: 'C99283716',
  },
  'james.okafor@gmail.com': {
    password: 'James@123',
    role: 'CONSUMER',
    displayName: 'James Okafor',
    accountId: 'C55192837',
  },
  'laura.bianchi@icloud.com': {
    password: 'Laura@123',
    role: 'CONSUMER',
    displayName: 'Laura Bianchi',
    accountId: 'C12093847',
  },
  'raj.patel@gmail.com': {
    password: 'Raj@123',
    role: 'CONSUMER',
    displayName: 'Raj Patel',
    accountId: 'C77283940',
  },
  'emily.nakamura@proton.me': {
    password: 'Emily@123',
    role: 'CONSUMER',
    displayName: 'Emily Nakamura',
    accountId: 'C33849102',
  },
};

// Export so WelcomeScreen can show the credentials table without duplicating data
export { ACCOUNTS };
export type { AccountDef };

const STORAGE_KEY = 'fraudguard_user';

function loadFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ── Context & Provider ────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadFromStorage);

  const login = (rawEmail: string, password: string): string | null => {
    const email = rawEmail.trim().toLowerCase();
    const account = ACCOUNTS[email];

    if (!account || account.password !== password) {
      return 'Invalid email or password.';
    }

    const newUser: AuthUser = {
      email,
      role: account.role,
      displayName: account.displayName,
      accountId: account.accountId,
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return null; // null = success
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
