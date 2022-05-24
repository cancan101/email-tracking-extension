import create from 'zustand';

type UserInfo = {
  accessToken: string;
  expiresAt: number;
  trackingSlug: string;
  userId: string;
};

type Store = {
  isInsideEmail: boolean;
  userEmail: string | null;
  userInfo: UserInfo | null;
};

export function stateIsLoggedIn(state: Store): boolean {
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

const useStore = create<Store>((set) => ({
  isInsideEmail: false,
  userEmail: null,
  userInfo: null,
}));

export default useStore;
