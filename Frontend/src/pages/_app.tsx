import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { useAppDispatch } from "@/store/store";
import { checkLoginStatus } from "@/store/slices/authSlice";
import { Box, CircularProgress } from "@mui/material";
import Navbar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";

function LoadingSpinner() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );
}

function AppContent({ Component, pageProps, router }: AppProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(checkLoginStatus());

    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
    };
  }, [dispatch, router]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ flex: 1 }}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Component {...pageProps} router={router} />
        )}
      </Box>
      <Footer />
    </Box>
  );
}

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
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
