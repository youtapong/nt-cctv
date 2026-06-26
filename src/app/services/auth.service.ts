import { Injectable } from '@angular/core';

const SESSION_KEY = 'web-cctv-session';

export interface MockUser {
  username: string;
  role: 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(username: string, password: string): boolean {
    if (username.trim() === 'admin' && password === 'admin') {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username: 'admin', role: 'admin' }));
      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  getCurrentUser(): MockUser | null {
    const stored = localStorage.getItem(SESSION_KEY);

    if (!stored) {
      return null;
    }

    try {
      const parsed = JSON.parse(stored) as MockUser;
      return parsed.username === 'admin' && parsed.role === 'admin' ? parsed : null;
    } catch {
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}
