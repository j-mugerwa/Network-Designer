// pages/payment-callback.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch } from "@/store/store";
import { verifyPayment } from "@/store/slices/subscriptionSlice";
import { setUser } from "@/store/slices/authSlice";
import { CircularProgress } from "@mui/material";
import { trackEvent } from "@/lib/analytics";

interface PaymentError extends Error {
  message: string;
  response?: {
    data?: {
      message?: string;
      code?: string;
      error?: string;
    };
  };
}

const PaymentCallback = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { reference, trxref } = router.query;
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const verifyPaymentProcess = async () => {
      setVerifying(true);
      const paymentRef = reference || trxref;

      trackEvent(
        "payment_verification_started",
        {
          reference: paymentRef,
          verificationType: "redirect",
        },
        dispatch
      );

      timeout = setTimeout(() => {
        trackEvent(
          "payment_verification_timeout",
          {
            reference: paymentRef,
            timeoutDuration: 40000,
          },
          dispatch
        );

        router.push({
          pathname: "/dashboard",
          query: {
            payment: "failed",
            error: encodeURIComponent("Verification timed out"),
          },
        });
      }, 40000);

      try {
        if (!paymentRef) {
          trackEvent("payment_verification_missing_reference", {}, dispatch);
          router.push("/dashboard?payment=missing_reference");
          return;
        }

        const result = await dispatch(
          verifyPayment(paymentRef as string)
        ).unwrap();

        if (result.user) {
          dispatch(setUser(result.user));
          trackEvent(
            "user_authenticated",
            {
              userId: result.user._id,
              email: result.user.email,
            },
            dispatch
          );
        }

        trackEvent(
          "payment_verification_success",
          {
            reference: paymentRef,
            userId: result.user?._id,
            planId: result.subscription?.planId,
            amount: result.subscription?.amount,
          },
          dispatch
        );

        router.push("/dashboard?payment=success");
      } catch (err) {
        const error = err as PaymentError;
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Payment verification failed";

        trackEvent(
          "payment_verification_failed",
          {
            reference: paymentRef,
            error: errorMessage,
            errorCode:
              error.response?.data?.code ||
              error.response?.data?.error ||
              "UNKNOWN_ERROR",
          },
          dispatch
        );

        router.push({
          pathname: "/dashboard",
          query: {
            payment: "failed",
            error: encodeURIComponent(errorMessage),
          },
        });
      } finally {
        clearTimeout(timeout);
        setVerifying(false);
      }
    };

    verifyPaymentProcess();

    return () => {
      clearTimeout(timeout);
    };
  }, [reference, trxref, dispatch, router]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Payment...</h1>
        {verifying ? (
          <CircularProgress />
        ) : (
          <p>Please wait while we verify your payment.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
