import { AppDispatch } from "@/store/store";
import { trackPaymentEvent } from "@/store/slices/subscriptionSlice";

export const trackEvent = (
  eventName: string,
  payload: Record<string, unknown>,
  dispatch: AppDispatch
) => {
  // Track with Redux (sends to backend)
  dispatch(
    trackPaymentEvent({
      event: eventName,
      payload: {
        ...payload,
        // Add common metadata
        location: typeof window !== "undefined" ? window.location.href : null,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        timestamp: new Date().toISOString(),
      },
    })
  ).catch(() => {
    // Fallback to localStorage if Redux fails
    if (typeof window !== "undefined") {
      const pendingEventsStr =
        localStorage.getItem("pendingAnalyticsEvents") || "[]";
      const pendingEvents = JSON.parse(pendingEventsStr);

      pendingEvents.push({
        event: eventName,
        payload,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem(
        "pendingAnalyticsEvents",
        JSON.stringify(pendingEvents)
      );
    }
  });

  // Log to console for development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, payload);
  }
};

// Helper to retry failed events
export const retryFailedEvents = async (dispatch: AppDispatch) => {
  if (typeof window !== "undefined") {
    const pendingEventsStr =
      localStorage.getItem("pendingAnalyticsEvents") || "[]";
    const pendingEvents = JSON.parse(pendingEventsStr);

    if (pendingEvents.length > 0) {
      try {
        await Promise.all(
          pendingEvents.map((event: any) => dispatch(trackPaymentEvent(event)))
        );
        localStorage.removeItem("pendingAnalyticsEvents");
      } catch (error) {
        console.error("Failed to retry analytics events:", error);
      }
    }
  }
};
