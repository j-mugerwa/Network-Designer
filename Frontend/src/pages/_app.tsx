import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { useDispatch } from "react-redux";
import { checkLoginStatus } from "@/store/slices/authSlice";
import { Box } from "@mui/material";
import Navbar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";
//import Dashboard from "@/pages/Dashboard";
import type { AppDispatch } from "@/store/store";

function AppContent({ Component, pageProps, router }: AppProps) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(checkLoginStatus());
  }, [dispatch]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        <Component {...pageProps} router={router} />
      </Box>
      <Footer />
    </Box>
  );
}

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent
          Component={Component}
          pageProps={pageProps}
          router={router}
        />
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
