import { User } from 'sdkwork-ide-types';
import { IAuthService } from '../interfaces/IAuthService';

export class MockAuthService implements IAuthService {
  private currentUser: User | null = null;

  constructor() {
    const storedUser = localStorage.getItem('sdkwork_mock_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }

  async login(email: string, password?: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = {
          id: 'u1',
          name: email.split('@')[0] || 'Test User',
          email: email,
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        };
        localStorage.setItem('sdkwork_mock_user', JSON.stringify(this.currentUser));
        resolve(this.currentUser);
      }, 500);
    });
  }

  async register(email: string, password?: string, name?: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = {
          id: `u${Date.now()}`,
          name: name || email.split('@')[0] || 'New User',
          email: email,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
        };
        localStorage.setItem('sdkwork_mock_user', JSON.stringify(this.currentUser));
        resolve(this.currentUser);
      }, 500);
    });
  }

  async logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('sdkwork_mock_user');
        resolve();
      }, 200);
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.currentUser);
      }, 100);
    });
  }
}
