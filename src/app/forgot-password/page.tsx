"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { shouldShowErrors } from "@/lib/client-config";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Suppress harmless browser extension errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || "";
      // Suppress runtime.lastError from browser extensions
      if (message.includes("runtime.lastError") || 
          message.includes("message port closed") ||
          message.includes("Extension context invalidated")) {
        return; // Suppress these harmless errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      // Log the response for debugging
      console.log("[Forgot Password] API Response", {
        status: response.status,
        ok: response.ok,
        hasResetId: !!data.resetId,
        hasEmailSent: typeof data.emailSent !== "undefined",
        emailSent: data.emailSent,
        message: data.message,
        error: data.error,
        fullResponse: JSON.stringify(data, null, 2),
        keys: Object.keys(data),
      });

      if (response.ok) {
        if (data.emailSent === false && shouldShowErrors()) {
          setError(
            "We encountered an issue sending the email. Please check your spam folder, or try again. " +
            (data.error ? `Error: ${data.error}` : "")
          );
        } else {
          setError("");
        }
        setStep("sent");
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Failed to send reset link. Please try again.");
      }
    } catch (err) {
      console.error("Error sending reset link request:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.emailSent === false) {
          setError(
            "We encountered an issue sending the email. Please check your spam folder, or try again. " +
            (data.error ? `Error: ${data.error}` : "")
          );
        } else {
          setError("");
        }
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || "Failed to resend link. Please try again.");
      }
    } catch (err) {
      console.error("Error resending reset link:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-large p-8">
          {step === "email" ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Mail size={32} className="text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-neutral-600">
                  Enter your email address and we&rsquo;ll send you a secure reset link.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700 mb-6">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSendLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Check your email
              </h1>
              <p className="text-neutral-600">
                We sent a magic reset link to <strong>{email}</strong>. Click the link to reset your password.
              </p>
              <p className="text-sm text-neutral-500 mt-3">
                Didn’t get it? Check your spam folder or resend below.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700 my-4">
                  <AlertCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleResendLink}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <>
                      <span>Resend link</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setResendCooldown(0);
                  }}
                  className="w-full text-sm text-neutral-600 hover:text-neutral-900"
                >
                  ← Change email
                </button>
                <Link
                  href="/login"
                  className="block text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
