import React from "react";
import { MailCheck, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../configs/api";
import { useDispatch } from "react-redux";
import { login } from "../app/features/authSlice";

const VerifyEmailPending = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const initialSyncKey = searchParams.get("syncKey") || "";
  const [syncKey, setSyncKey] = React.useState(initialSyncKey);
  const initialTimeoutSeconds = Number(
    searchParams.get("timeoutSeconds") || 300,
  );
  const [checking, setChecking] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [timedOut, setTimedOut] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [statusApiAvailable, setStatusApiAvailable] = React.useState(true);
  const [remainingSeconds, setRemainingSeconds] = React.useState(
    initialTimeoutSeconds,
  );
  const [countdown, setCountdown] = React.useState(4);
  const [resending, setResending] = React.useState(false);

  const checkVerificationStatus = React.useCallback(async () => {
    if (!syncKey || verified || timedOut || !statusApiAvailable) return;

    try {
      setChecking(true);

      const { data } = await api.post("/api/users/verify-email/status", {
        syncKey,
        email: email === "your email" ? "" : email,
      });

      setStatusApiAvailable(true);

      if (data?.sessionMissing) {
        setTimedOut(true);
        setStatusMessage(
          "Verification session expired. Please resend the verification email.",
        );
        setRemainingSeconds(0);
        return;
      }

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
      const isNotFound = error?.response?.status === 404;
      const message = error.response?.data?.message || error.message;

      if (isNotFound) {
        setStatusApiAvailable(false);
        setStatusMessage(
          "Email sent. Auto verification check is unavailable on this deployment. After clicking the link in your email, continue to Login and sign in with Google.",
        );
        return;
      }

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
  }, [dispatch, statusApiAvailable, syncKey, timedOut, verified]);

  React.useEffect(() => {
    if (!syncKey) {
      setStatusApiAvailable(false);
      setStatusMessage(
        "Verification email was sent, but this session cannot be auto-tracked. After clicking the link in your email, continue to Login and sign in with Google.",
      );
      setRemainingSeconds(0);
      return;
    }

    checkVerificationStatus();
  }, [checkVerificationStatus, syncKey]);

  React.useEffect(() => {
    if (verified || timedOut || !statusApiAvailable) return;
    const pollInterval = setInterval(() => {
      checkVerificationStatus();
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [verified, timedOut, statusApiAvailable, checkVerificationStatus]);

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
    if (verified || timedOut || !statusApiAvailable) return;

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
  }, [timedOut, verified, statusApiAvailable]);

  const handleResendVerificationEmail = async () => {
    if (resending || verified) return;

    try {
      setResending(true);
      setStatusMessage("");

      const { data } = await api.post("/api/users/verify-email/resend", {
        syncKey,
        email: email === "your email" ? "" : email,
      });

      setStatusApiAvailable(true);

      if (data?.alreadyVerified) {
        setStatusMessage(
          "Email already verified. Continue with Google sign-in.",
        );
        setTimedOut(false);
        return;
      }

      const refreshedSyncKey = data?.verificationSyncKey || "";
      const refreshedTimeout = Number(data?.verificationTimeoutSeconds || 300);

      setSyncKey(refreshedSyncKey);
      setRemainingSeconds(refreshedTimeout);
      setTimedOut(false);
      setStatusMessage("Verification email resent. Please check your inbox.");

      setSearchParams(
        {
          email,
          syncKey: refreshedSyncKey,
          timeoutSeconds: String(refreshedTimeout),
        },
        { replace: true },
      );
    } catch (error) {
      const isNotFound = error?.response?.status === 404;
      if (isNotFound) {
        setStatusMessage(
          "Resend is unavailable on this deployment. Please go back to Login and continue with Google once.",
        );
        setStatusApiAvailable(false);
        setRemainingSeconds(0);
        return;
      }

      setStatusMessage(
        error.response?.data?.message ||
          "Could not resend verification email right now. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

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
              Please click the link in your inbox. After verification, you'll be
              redirected to the dashboard.
            </p>
            <p className="mt-2 text-xs text-amber-700 font-medium select-none">
              Note: This verification link expires in{" "}
              {statusApiAvailable
                ? formatCountdown(remainingSeconds)
                : "about 5 minutes"}
            </p>
            {!statusApiAvailable && statusMessage && (
              <p className="mt-2 text-xs text-amber-700 font-medium select-none">
                {statusMessage}
              </p>
            )}
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

        {!verified && statusApiAvailable && (
          <button
            type="button"
            onClick={handleResendVerificationEmail}
            disabled={resending}
            className="mt-4 w-full h-11 rounded-full text-amber-800 border border-amber-400 hover:bg-amber-50 transition-colors font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending
              ? "Resending verification email..."
              : "Resend verification email"}
          </button>
        )}

        {!verified && !statusApiAvailable && (
          <button
            type="button"
            onClick={() => navigate("/login?state=login")}
            className="mt-4 w-full h-11 rounded-full text-amber-800 border border-amber-400 hover:bg-amber-50 transition-colors font-medium"
          >
            I Verified, Continue to Login
          </button>
        )}

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
