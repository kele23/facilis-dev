import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiLogin, apiLogout, apiCheck, type LoginUser } from '../utils/apiFetch';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<LoginUser | null>(null);
  const router = useRouter();

  async function login(username: string, password: string): Promise<boolean> {
    const success = await apiLogin({ name: username, password });
    if (success) {
      await checkAuth();
    }
    return success;
  }

  async function logout() {
    await apiLogout();
    user.value = null;
    router.push('/login');
  }

  async function checkAuth() {
    const res = await apiCheck();
    if (res.success && res.user) {
      user.value = res.user;
      return true;
    }
    user.value = null;
    return false;
  }

  const isAuthenticated = () => !!user.value || !!localStorage.getItem('lp_refreshToken');

  return { user, login, logout, checkAuth, isAuthenticated };
});
