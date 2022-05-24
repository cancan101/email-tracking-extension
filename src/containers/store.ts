import create from 'zustand';

type Store = {
  isLoggedIn: boolean;
  isInsideEmail: boolean;
};

const useStore = create<Store>((set) => ({
  isLoggedIn: false,
  isInsideEmail: false,
}));

export default useStore;
