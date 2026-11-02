import { UserSession } from '../types';

const AUTH_USER_KEY = 'papirotech.auth.user';
const AUTH_PASS_KEY = 'papirotech.auth.password';

const DEFAULT_EMAIL = 'papirotech26@gmail.com';
const DEFAULT_PASS = 'Papirotech123@';

export const authService = {
  getStoredPassword(): string {
    return localStorage.getItem(AUTH_PASS_KEY) || DEFAULT_PASS;
  },

  getCurrentUser(): UserSession | null {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error reading auth session:', e);
    }
    return null;
  },

  login(email: string, pass: string): { success: boolean; error?: string; user?: UserSession } {
    const cleanEmail = (email || '').trim().toLowerCase();
    const activePass = this.getStoredPassword();

    if (cleanEmail === DEFAULT_EMAIL && pass === activePass) {
      const user: UserSession = {
        email: cleanEmail,
        token: 'pt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        name: 'Administrateur Papirotech'
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Identifiants incorrects. Veuillez vérifier votre adresse email et votre mot de passe.'
    };
  },

  changePassword(oldPass: string, newPass: string): { success: boolean; error?: string } {
    const activePass = this.getStoredPassword();

    if (oldPass !== activePass) {
      return { success: false, error: "L'ancien mot de passe est incorrect." };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
    }

    localStorage.setItem(AUTH_PASS_KEY, newPass);
    return { success: true };
  },

  logout(): void {
    localStorage.removeItem(AUTH_USER_KEY);
  }
};
