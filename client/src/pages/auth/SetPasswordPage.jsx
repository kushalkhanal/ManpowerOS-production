import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { showToast } from "../../components/ToastProvider";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

const PASSWORD_RULES =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = searchParams.get("token");

  const [state, setState] = useState("verifying"); // verifying | ready | done | error
  const [inviteeInfo, setInviteeInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    if (!token || token.length !== 64) {
      setState("error");
      return;
    }
    api
      .get(`/auth/verify-invite/${token}`)
      .then(({ data }) => {
        setInviteeInfo(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError("");

    if (!PASSWORD_RULES.test(password)) {
      setFieldError(
        "Password must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&)",
      );
      return;
    }
    if (password !== confirm) {
      setFieldError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/complete-invite", {
        token,
        newPassword: password,
      });
      setSession({ token: data.token, user: data.user, agency: data.agency });
      setState("done");
      showToast.success("Password set — welcome to ManpowerOS!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setFieldError(
        err.response?.data?.message ||
          "Failed to set password. The link may have expired.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Verifying invite link…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            This invite link has expired or is no longer valid. Please ask your
            administrator to send a new invite.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="btn-primary w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">
            Password set successfully!
          </p>
          <p className="text-gray-400 text-sm">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Set Your Password
          </h1>
          {inviteeInfo && (
            <p className="text-gray-500 text-sm mt-1">
              Welcome,{" "}
              <span className="font-medium text-gray-700">
                {inviteeInfo.name}
              </span>
              ! Setting password for{" "}
              <span className="font-medium text-gray-700">
                {inviteeInfo.email}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 pr-10 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
                placeholder="Min 8 chars, mixed case + number + symbol"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
              placeholder="Repeat your password"
            />
          </div>

          {fieldError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {fieldError}
            </p>
          )}

          <ul className="text-xs text-gray-400 space-y-0.5 pl-1">
            <li className={password.length >= 8 ? "text-green-600" : ""}>
              • At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
              • One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
              • One lowercase letter
            </li>
            <li className={/\d/.test(password) ? "text-green-600" : ""}>
              • One number
            </li>
            <li className={/[@$!%*?&]/.test(password) ? "text-green-600" : ""}>
              • One special character (@$!%*?&)
            </li>
          </ul>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {submitting ? "Setting Password…" : "Set Password & Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;
