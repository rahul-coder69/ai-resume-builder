import React from "react";
import { Lock, Mail, User2Icon } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../configs/api";
import { useDispatch } from "react-redux";
import { login } from "../app/features/authSlice";
import toast from "react-hot-toast";

const Login = () => {
  const GOOGLE_AUTH_TIMEOUT_MS = 60000;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = searchParams.get("state");
  const normalizedState = (urlState || "").toLowerCase();
  const isSignup =
    normalizedState === "signup" || normalizedState === "register";
  const [view, setView] = React.useState(isSignup ? "signup" : "login");
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);
  const [googleTimeoutError, setGoogleTimeoutError] = React.useState(false);
  const [googleWidgetKey, setGoogleWidgetKey] = React.useState(0);
  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  React.useEffect(() => {
    if (!["login", "signup", "register"].includes(normalizedState)) {
      setSearchParams({ state: "login" }, { replace: true });
    }
  }, [normalizedState, setSearchParams]);

  React.useEffect(() => {
    setView(isSignup ? "signup" : "login");
  }, [isSignup]);

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (view === "signup") {
        if (!formData.name || !formData.email || !formData.password) {
          toast.error("Please fill in all fields");
          return;
        }

        await api.post("/api/users/register", formData);
        toast.success("OTP sent to your email");
        navigate(
          `/verify-otp?email=${encodeURIComponent(formData.email)}&purpose=signup`,
        );
        return;
      }

      const { data } = await api.post("/api/users/login", formData);
      dispatch(login(data));
      toast.success(data.message);
      navigate("/app");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) return;

    try {
      setGoogleSubmitting(true);
      setGoogleTimeoutError(false);
      const { data } = await api.post(
        "/api/users/google",
        {
          credential: credentialResponse.credential,
        },
        {
          timeout: GOOGLE_AUTH_TIMEOUT_MS,
        },
      );
      toast.success(data.message);
      if (data?.token) {
        dispatch(login(data));
        navigate("/app");
        return;
      }

      navigate(
        `/verify-email-pending?email=${encodeURIComponent(data?.user?.email || "")}&syncKey=${encodeURIComponent(data?.verificationSyncKey || "")}&timeoutSeconds=${encodeURIComponent(data?.verificationTimeoutSeconds || 300)}`,
      );
    } catch (error) {
      if (error?.code === "ECONNABORTED") {
        setGoogleTimeoutError(true);
        toast.error(
          "Google authentication is taking longer than expected. Please try again.",
        );
      } else {
        setGoogleTimeoutError(false);
        toast.error(error.response?.data?.message || error.message);
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleTimeoutError(false);
    console.error("Google auth failed");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthModeToggle = () => {
    setGoogleTimeoutError(false);
    setView(view === "login" ? "signup" : "login");
    setSearchParams(
      { state: view === "login" ? "signup" : "login" },
      { replace: true },
    );
  };

  const handleGoogleRetry = () => {
    setGoogleTimeoutError(false);
    // Re-mounting resets Google button internals after a failed attempt.
    setGoogleWidgetKey((prev) => prev + 1);
  };

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white"
      >
        <h1 className="text-gray-900 text-3xl mt-10 font-medium select-none">
          {view === "login" ? "Login" : "Sign up"}
        </h1>
        <p className="text-gray-500 text-sm mt-2 select-none">
          Please {view} to continue
        </p>
        {view === "signup" && (
          <div className="flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <User2Icon size={16} color="#6b7280" />
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="border-none outline-none ring-0 w-full"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-5 pr-4 gap-2 transition-all duration-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
          <Mail size={15} color="#6b7280" />
          <input
            type="email"
            name="email"
            placeholder="Email id"
            className="w-full bg-transparent border-none outline-none ring-0 text-sm text-gray-700 placeholder:text-gray-400"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-5 pr-4 gap-2 transition-all duration-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
          <Lock size={15} color="#6b7280" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full bg-transparent border-none outline-none ring-0 text-sm text-gray-700 placeholder:text-gray-400"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {view === "login" && (
          <div className="mt-4 text-right">
            <button
              className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline transition-colors duration-200"
              type="button"
              onClick={handleForgotPasswordClick}
            >
              Forget password?
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 font-medium"
        >
          {submitting
            ? view === "login"
              ? "Logging in..."
              : "Sending..."
            : view === "login"
              ? "Login"
              : "Send OTP"}
        </button>
        {
          <>
            <div className="mt-4 mb-2 flex items-center gap-3 text-gray-400 text-xs">
              <span className="h-px bg-gray-200 flex-1 select-none" />
              <span className="select-none">OR</span>
              <span className="h-px bg-gray-200 flex-1 select-none" />
            </div>
            <div className="mt-2 flex justify-center">
              {hasGoogleClientId ? (
                <GoogleLogin
                  key={googleWidgetKey}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text={view === "login" ? "signin_with" : "signup_with"}
                  shape="pill"
                  width="286"
                />
              ) : (
                <div className="w-full rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-700">
                  Google auth is disabled until VITE_GOOGLE_CLIENT_ID is set.
                </div>
              )}
            </div>
            {googleSubmitting && (
              <p className="mt-3 text-xs text-gray-500">
                {view === "login"
                  ? "Signing in with Google..."
                  : "Creating your account with Google..."}
              </p>
            )}
            {googleTimeoutError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left text-xs text-amber-700">
                <p className="font-medium">
                  Google request timed out. Please click try again.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleRetry}
                  className="mt-2 rounded-full border border-amber-400 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                >
                  Try Google again
                </button>
              </div>
            )}
          </>
        }
        <div className="text-gray-500 text-sm mt-5 mb-11">
          <span className="select-none">
            {view === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={handleAuthModeToggle}
            className="text-green-600 font-medium hover:underline"
          >
            {view === "login" ? "Sign up" : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
