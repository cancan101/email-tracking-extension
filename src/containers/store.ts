import { create } from 'zustand';

type UserInfo = {
  accessToken: string;
  expiresAt: number;
  trackingSlug: string;
  userId: string;
};

type Store = {
  isInsideEmail: boolean;
  isPopout: boolean;
  userEmail: string | null;
  userInfo: UserInfo | null;
  isLoggedIn: () => boolean;
  getValidAccessToken: () => string | null;
};

function stateIsLoggedIn(state: Store): boolean {
  const { userInfo } = state;
  if (userInfo === null) {
    return false;
  }

  const { expiresAt } = userInfo;
  if (expiresAt <= new Date().getTime() / 1000) {
    return false;
  }
  return true;
}

const useStore = create<Store>((set, get) => ({
  isInsideEmail: false,
  isPopout: false,
  userEmail: null,
  userInfo: null,
  isLoggedIn: () => stateIsLoggedIn(get()),
  getValidAccessToken: () => {
    const userInfo = get().userInfo;
    if (!get().isLoggedIn() || userInfo === null) {
      return null;
    }
    return userInfo.accessToken;
  },
}));

export default useStore;
