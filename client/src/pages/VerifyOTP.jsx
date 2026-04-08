import React from "react";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../configs/api";
import { useDispatch } from "react-redux";
import { login } from "../app/features/authSlice";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const purpose = searchParams.get("purpose") || "signup";

  const [otp, setOtp] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);

  React.useEffect(() => {
    if (!email) {
      toast.error("Invalid access. Please start over.");
      navigate("/login");
    }
  }, [email, navigate]);

  React.useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      setSubmitting(true);

      if (purpose === "reset") {
        toast.error("Invalid purpose for this page. Go to forgot password.");
        navigate("/forgot-password");
        return;
      }

      const { data } = await api.post("/api/users/register/verify-otp", {
        email,
        otp,
      });

      dispatch(login(data));
      toast.success(data.message);
      navigate("/app");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    try {
      setResending(true);

      await api.post("/api/users/register", {
        email,
        name: "",
        password: "",
      });

      toast.success("OTP resent to your email");
      setOtp("");
      setResendTimer(60);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setResending(false);
    }
  };

  const handleBackToSignup = () => {
    navigate("/login?state=signup");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleVerifyOtp}
        className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white"
      >
        <h1 className="text-gray-900 text-3xl mt-10 font-medium select-none">
          Verify Email
        </h1>
        <p className="text-gray-500 text-sm mt-2 select-none">
          Enter the OTP sent to your email
        </p>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Mail size={16} />
            <span>{email}</span>
          </div>
        </div>

        <div className="flex items-center w-full mt-6 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-5 pr-4 gap-2 transition-all duration-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
          <Lock size={15} color="#6b7280" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            className="w-full bg-transparent border-none outline-none ring-0 text-sm text-gray-700 placeholder:text-gray-400 text-center tracking-widest"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting || otp.length !== 6}
          className="mt-6 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-60 font-medium"
        >
          {submitting ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || resendTimer > 0}
            className="text-sm font-medium text-green-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : resending
                ? "Sending..."
                : "Resend OTP"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleBackToSignup}
          className="mt-6 flex items-center justify-center gap-2 w-full text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Sign up
        </button>
      </form>
    </div>
  );
};

export default VerifyOTP;
