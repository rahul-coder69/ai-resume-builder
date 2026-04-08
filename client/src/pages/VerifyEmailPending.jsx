import React from "react";
import { MailCheck, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../configs/api";
import { useDispatch } from "react-redux";
import { login } from "../app/features/authSlice";

const VerifyEmailPending = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const syncKey = searchParams.get("syncKey") || "";
  const initialTimeoutSeconds = Number(
    searchParams.get("timeoutSeconds") || 300,
  );
  const [checking, setChecking] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [timedOut, setTimedOut] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [remainingSeconds, setRemainingSeconds] = React.useState(
    initialTimeoutSeconds,
  );
  const [countdown, setCountdown] = React.useState(4);

  const checkVerificationStatus = React.useCallback(async () => {
    if (!syncKey || verified || timedOut) return;

    try {
      setChecking(true);

      const { data } = await api.post("/api/users/verify-email/status", {
        syncKey,
      });

      if (!data?.verified) return;

      if (typeof data?.remainingSeconds === "number") {
        setRemainingSeconds(data.remainingSeconds);
      }

      if (data?.token) {
        dispatch(login(data));
      }

      setVerified(true);
      setStatusMessage("Email verified. Redirecting to dashboard...");
      setRemainingSeconds(0);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      if (message === "Verification timeout please try again") {
        setTimedOut(true);
        setStatusMessage("Verification timeout please try again");
        setRemainingSeconds(0);
        return;
      }

      if (message !== "Verification session not found") {
        setStatusMessage(message);
      }
    } finally {
      setChecking(false);
    }
  }, [dispatch, syncKey, timedOut, verified]);

  React.useEffect(() => {
    if (!syncKey) {
      setTimedOut(true);
      setStatusMessage("Verification timeout please try again");
      setRemainingSeconds(0);
      return;
    }

    checkVerificationStatus();
  }, [checkVerificationStatus, syncKey]);

  React.useEffect(() => {
    if (verified || timedOut) return;
    const pollInterval = setInterval(() => {
      checkVerificationStatus();
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [verified, timedOut, checkVerificationStatus]);

  React.useEffect(() => {
    if (!verified) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/app");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verified, navigate]);

  React.useEffect(() => {
    if (verified || timedOut) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimedOut(true);
          setStatusMessage("Verification timeout please try again");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timedOut, verified]);

  const formatCountdown = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
    const secs = String(safeSeconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="sm:w-[420px] w-full border border-gray-300/60 rounded-2xl px-8 py-10 bg-white text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <MailCheck size={28} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 select-none">
          Verify Your Email
        </h1>
        {!verified && !timedOut ? (
          <>
            <p className="mt-3 text-sm text-gray-600 select-none">
              We sent a verification link to{" "}
              <span className="font-medium text-gray-800">{email}</span>.
            </p>
            <p className="mt-2 text-sm text-gray-600 select-none">
              Please click the link in your inbox. After verification, you'll be redirected to the dashboard.
            </p>
            <p className="mt-2 text-xs text-amber-700 font-medium select-none">
              Note: This verification link expires in{" "}
              {formatCountdown(remainingSeconds)}
            </p>
          </>
        ) : verified ? (
          <>
            <p className="mt-3 text-sm text-green-700 font-medium select-none">
              {statusMessage || "Email verification completed successfully."}
            </p>
            <p className="mt-2 text-sm text-gray-600 select-none">
              Redirecting to dashboard in {countdown}s...
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-red-700 font-medium select-none">
              {statusMessage || "Verification timeout please try again"}
            </p>
            <p className="mt-2 text-sm text-gray-600 select-none">
              Please go back to Login and try Google authentication again.
            </p>
          </>
        )}

        <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700 select-none">
          If you do not see the email, check your Spam or Promotions folder.
        </div>

        {verified && (
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="mt-5 w-full h-11 rounded-full text-white bg-green-600 hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
          >
            Go to Dashboard <ArrowRight size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("/login?state=signup")}
          className="mt-4 w-full h-11 rounded-full text-green-700 border border-green-500 hover:bg-green-50 transition-colors font-medium"
        >
          Back to Login Page
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailPending;
