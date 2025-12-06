"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Save, Mail, User, Plane, FileText, Briefcase, RotateCcw, Eye, Code, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TextareaInput } from "@/components/admin/MemoizedInputs";
import { getDefaultEmailTemplate } from "@/lib/email-templates";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface EmailTemplates {
  // General emails
  emailWelcome: string;
  emailPasswordReset: string;
  emailPasswordResetOTP: string;
  emailVerification: string;
  
  // Visa emails
  emailVisaPaymentSuccess: string;
  emailVisaPaymentFailed: string;
  emailVisaStatusUpdate: string;
  emailVisaDocumentRejected: string;
  emailVisaApproved: string;
  emailVisaRejected: string;
  
  // Tour emails
  emailTourPaymentSuccess: string;
  emailTourPaymentFailed: string;
  emailTourConfirmed: string;
  emailTourPaymentReminder: string;
  emailTourStatusUpdate: string;
  emailTourVouchersReady: string;
  
  // Admin & Corporate emails
  emailAdminWelcome: string;
  emailCorporateLeadAdmin: string;
  emailCorporateLeadConfirmation: string;
}

const TEMPLATE_METADATA: Record<keyof EmailTemplates, { label: string; description: string; variables: string[]; category: "general" | "visa" | "tours" | "admin" }> = {
  emailWelcome: {
    label: "Welcome Email",
    description: "Sent when a new user registers",
    variables: ["name", "companyName", "dashboardUrl"],
    category: "general",
  },
  emailPasswordReset: {
    label: "Password Reset Email (Link-based)",
    description: "Sent when user requests password reset via link (legacy)",
    variables: ["resetLink", "companyName"],
    category: "general",
  },
  emailPasswordResetOTP: {
    label: "Password Reset OTP Email",
    description: "Sent when user requests password reset via OTP",
    variables: ["otp", "companyName"],
    category: "general",
  },
  emailVerification: {
    label: "Email Verification",
    description: "Sent to verify user's email address",
    variables: ["name", "verificationLink", "companyName"],
    category: "general",
  },
  emailVisaPaymentSuccess: {
    label: "Visa Payment Success",
    description: "Sent when visa payment is successful",
    variables: ["country", "visaType", "amount", "applicationId", "applicationIdShort", "applicationUrl"],
    category: "visa",
  },
  emailVisaPaymentFailed: {
    label: "Visa Payment Failed",
    description: "Sent when visa payment fails",
    variables: ["country", "visaType", "amount", "reason", "applicationUrl"],
    category: "visa",
  },
  emailVisaStatusUpdate: {
    label: "Visa Status Update",
    description: "Sent when visa application status changes",
    variables: ["country", "visaType", "status", "applicationUrl"],
    category: "visa",
  },
  emailVisaDocumentRejected: {
    label: "Visa Document Rejected",
    description: "Sent when visa documents are rejected",
    variables: ["country", "visaType", "rejectedDocsList", "applicationUrl"],
    category: "visa",
  },
  emailVisaApproved: {
    label: "Visa Approved",
    description: "Sent when visa is approved",
    variables: ["country", "visaType", "applicationUrl"],
    category: "visa",
  },
  emailVisaRejected: {
    label: "Visa Rejected",
    description: "Sent when visa is rejected",
    variables: ["country", "visaType", "reason", "applicationUrl"],
    category: "visa",
  },
  emailTourPaymentSuccess: {
    label: "Tour Payment Success",
    description: "Sent when tour payment is successful",
    variables: ["tourName", "amount", "pendingBalance", "bookingId", "bookingIdShort", "bookingUrl"],
    category: "tours",
  },
  emailTourPaymentFailed: {
    label: "Tour Payment Failed",
    description: "Sent when tour payment fails",
    variables: ["tourName", "amount", "reason", "bookingUrl"],
    category: "tours",
  },
  emailTourConfirmed: {
    label: "Tour Confirmed",
    description: "Sent when tour booking is confirmed",
    variables: ["tourName", "bookingUrl"],
    category: "tours",
  },
  emailTourPaymentReminder: {
    label: "Tour Payment Reminder",
    description: "Sent as reminder for pending tour payment",
    variables: ["tourName", "pendingBalance", "dueDate", "bookingUrl"],
    category: "tours",
  },
  emailTourStatusUpdate: {
    label: "Tour Status Update",
    description: "Sent when tour booking status changes",
    variables: ["tourName", "status", "bookingUrl"],
    category: "tours",
  },
  emailTourVouchersReady: {
    label: "Tour Vouchers Ready",
    description: "Sent when tour vouchers are ready for download",
    variables: ["tourName", "bookingUrl"],
    category: "tours",
  },
  emailAdminWelcome: {
    label: "Admin Welcome Email",
    description: "Sent when a new admin account is created",
    variables: ["name", "email", "role", "tempPassword", "loginUrl", "companyName"],
    category: "admin",
  },
  emailCorporateLeadAdmin: {
    label: "Corporate Lead (Admin Notification)",
    description: "Sent to admins when a corporate lead is submitted",
    variables: ["companyNameLead", "contactName", "email", "createdAt", "message", "dashboardUrl", "companyName"],
    category: "admin",
  },
  emailCorporateLeadConfirmation: {
    label: "Corporate Lead Confirmation",
    description: "Sent to corporate lead submitter as confirmation",
    variables: ["contactName", "companyNameLead", "supportEmail", "supportPhone", "companyName"],
    category: "admin",
  },
};

export default function EmailTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "visa" | "tours" | "admin">("general");
  const [selectedTemplate, setSelectedTemplate] = useState<keyof EmailTemplates | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [templates, setTemplates] = useState<EmailTemplates>({
    emailWelcome: "",
    emailPasswordReset: "",
    emailPasswordResetOTP: "",
    emailVerification: "",
    emailVisaPaymentSuccess: "",
    emailVisaPaymentFailed: "",
    emailVisaStatusUpdate: "",
    emailVisaDocumentRejected: "",
    emailVisaApproved: "",
    emailVisaRejected: "",
    emailTourPaymentSuccess: "",
    emailTourPaymentFailed: "",
    emailTourConfirmed: "",
    emailTourPaymentReminder: "",
    emailTourStatusUpdate: "",
    emailTourVouchersReady: "",
    emailAdminWelcome: "",
    emailCorporateLeadAdmin: "",
    emailCorporateLeadConfirmation: "",
  });

  // Helper function to map database key to template key
  const getTemplateKey = useCallback((dbKey: keyof EmailTemplates): string => {
    const keyMap: Record<string, string> = {
      emailWelcome: "welcomeEmail",
      emailPasswordReset: "passwordResetEmail",
      emailPasswordResetOTP: "passwordResetOTPEmail",
      emailVerification: "emailVerificationEmail",
      emailVisaPaymentSuccess: "visaPaymentSuccessEmail",
      emailVisaPaymentFailed: "visaPaymentFailedEmail",
      emailVisaStatusUpdate: "visaStatusUpdateEmail",
      emailVisaDocumentRejected: "visaDocumentRejectedEmail",
      emailVisaApproved: "visaApprovedEmail",
      emailVisaRejected: "visaRejectedEmail",
      emailTourPaymentSuccess: "tourPaymentSuccessEmail",
      emailTourPaymentFailed: "tourPaymentFailedEmail",
      emailTourConfirmed: "tourConfirmedEmail",
      emailTourPaymentReminder: "tourPaymentReminderEmail",
      emailTourStatusUpdate: "tourStatusUpdateEmail",
      emailTourVouchersReady: "tourVouchersReadyEmail",
      emailAdminWelcome: "adminWelcomeEmail",
      emailCorporateLeadAdmin: "corporateLeadAdminEmail",
      emailCorporateLeadConfirmation: "corporateLeadConfirmationEmail",
    };
    return keyMap[dbKey] || dbKey;
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/general");
      if (!response.ok) throw new Error("Failed to fetch templates");
      const data = await response.json();
      
      // Helper to get template value or default
      const getTemplateValue = (dbKey: keyof EmailTemplates, dbValue: string): string => {
        if (dbValue && dbValue.trim()) {
          return dbValue; // Use custom template if exists
        }
        // Return default template for editing
        const templateKey = getTemplateKey(dbKey);
        return getDefaultEmailTemplate(templateKey);
      };
      
      setTemplates({
        emailWelcome: getTemplateValue("emailWelcome", data.emailWelcome || ""),
        emailPasswordReset: getTemplateValue("emailPasswordReset", data.emailPasswordReset || ""),
        emailPasswordResetOTP: getTemplateValue("emailPasswordResetOTP", data.emailPasswordResetOTP || ""),
        emailVerification: getTemplateValue("emailVerification", data.emailVerification || ""),
        emailVisaPaymentSuccess: getTemplateValue("emailVisaPaymentSuccess", data.emailVisaPaymentSuccess || ""),
        emailVisaPaymentFailed: getTemplateValue("emailVisaPaymentFailed", data.emailVisaPaymentFailed || ""),
        emailVisaStatusUpdate: getTemplateValue("emailVisaStatusUpdate", data.emailVisaStatusUpdate || ""),
        emailVisaDocumentRejected: getTemplateValue("emailVisaDocumentRejected", data.emailVisaDocumentRejected || ""),
        emailVisaApproved: getTemplateValue("emailVisaApproved", data.emailVisaApproved || ""),
        emailVisaRejected: getTemplateValue("emailVisaRejected", data.emailVisaRejected || ""),
        emailTourPaymentSuccess: getTemplateValue("emailTourPaymentSuccess", data.emailTourPaymentSuccess || ""),
        emailTourPaymentFailed: getTemplateValue("emailTourPaymentFailed", data.emailTourPaymentFailed || ""),
        emailTourConfirmed: getTemplateValue("emailTourConfirmed", data.emailTourConfirmed || ""),
        emailTourPaymentReminder: getTemplateValue("emailTourPaymentReminder", data.emailTourPaymentReminder || ""),
        emailTourStatusUpdate: getTemplateValue("emailTourStatusUpdate", data.emailTourStatusUpdate || ""),
        emailTourVouchersReady: getTemplateValue("emailTourVouchersReady", data.emailTourVouchersReady || ""),
        emailAdminWelcome: getTemplateValue("emailAdminWelcome", data.emailAdminWelcome || ""),
        emailCorporateLeadAdmin: getTemplateValue("emailCorporateLeadAdmin", data.emailCorporateLeadAdmin || ""),
        emailCorporateLeadConfirmation: getTemplateValue("emailCorporateLeadConfirmation", data.emailCorporateLeadConfirmation || ""),
      });
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [getTemplateKey]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "STAFF_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      router.push("/admin");
      return;
    }
    fetchTemplates();
  }, [status, session, router, fetchTemplates]);

  const updateTemplate = useCallback((key: keyof EmailTemplates, value: string) => {
    setTemplates((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefault = useCallback((key: keyof EmailTemplates) => {
    const templateKey = getTemplateKey(key);
    const defaultTemplate = getDefaultEmailTemplate(templateKey);
    updateTemplate(key, defaultTemplate);
  }, [updateTemplate, getTemplateKey]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch("/api/admin/settings/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save templates");
      }

      setSaveMessage({ type: "success", text: "Email templates saved successfully!" });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message || "Failed to save templates" });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  }, [templates]);

  const getTemplatesForCategory = (category: "general" | "visa" | "tours" | "admin") => {
    return Object.entries(TEMPLATE_METADATA).filter(
      ([, meta]) => meta.category === category
    ) as [keyof EmailTemplates, typeof TEMPLATE_METADATA[keyof EmailTemplates]][];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
            <p className="text-neutral-600">Loading email templates...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Email Templates</h1>
              <p className="text-neutral-600 mt-2">
                Customize all email templates sent to users. Use variables like {"{"}name{"}"}, {"{"}email{"}"}, etc.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save All Templates</span>
                </>
              )}
            </button>
          </div>

          {saveMessage && (
            <div
              className={`mb-6 rounded-lg p-4 flex items-center space-x-2 ${
                saveMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {saveMessage.type === "success" ? (
                <CheckCircle size={20} className="flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-neutral-200">
            {[
              { id: "general" as const, label: "General", icon: User },
              { id: "visa" as const, label: "Visa", icon: Plane },
              { id: "tours" as const, label: "Tours", icon: FileText },
              { id: "admin" as const, label: "Admin & Corporate", icon: Briefcase },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  setSelectedTemplate(null);
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Template List and Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-medium border border-neutral-200 p-4">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Templates</h3>
                <div className="space-y-1">
                  {getTemplatesForCategory(activeTab).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedTemplate === key
                          ? "bg-primary-50 text-primary-700 border border-primary-200"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <div className="font-medium">{meta.label}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{meta.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <div className="bg-white rounded-lg shadow-medium border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {TEMPLATE_METADATA[selectedTemplate].label}
                      </h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        {TEMPLATE_METADATA[selectedTemplate].description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => resetToDefault(selectedTemplate)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm text-neutral-700 bg-neutral-100 rounded hover:bg-neutral-200 transition-colors"
                      >
                        <RotateCcw size={14} />
                        <span>Reset to Default</span>
                      </button>
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm text-neutral-700 bg-neutral-100 rounded hover:bg-neutral-200 transition-colors"
                      >
                        {previewMode ? <Code size={14} /> : <Eye size={14} />}
                        <span>{previewMode ? "Edit" : "Preview"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-neutral-500 mb-2">
                      <strong>Available Variables:</strong>{" "}
                      {TEMPLATE_METADATA[selectedTemplate].variables.map((v) => `{${v}}`).join(", ")}
                    </div>
                  </div>

                  {previewMode ? (
                    <div className="border border-neutral-300 rounded-lg p-4 bg-neutral-50">
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: templates[selectedTemplate] || getDefaultEmailTemplate(getTemplateKey(selectedTemplate)),
                        }}
                      />
                    </div>
                  ) : (
                    <TextareaInput
                      value={templates[selectedTemplate] || getDefaultEmailTemplate(getTemplateKey(selectedTemplate))}
                      onChange={(value) => updateTemplate(selectedTemplate, value)}
                      rows={20}
                      placeholder={`Edit the template HTML...\n\nAvailable variables: ${TEMPLATE_METADATA[selectedTemplate].variables.map((v) => `{${v}}`).join(", ")}`}
                      className="w-full px-4 py-2 font-mono text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  )}

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <strong>Note:</strong> This is the default template. You can edit it above and save to customize it. The template will use your custom version once saved.
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-medium border border-neutral-200 p-12 text-center">
                  <Mail size={48} className="text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">Select a template from the list to edit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

