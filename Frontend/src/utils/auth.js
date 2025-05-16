import { getAuth } from "firebase/auth";

export const getToken = async () => {
  const auth = getAuth();
  if (auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }
  throw new Error("No authenticated user");
};
