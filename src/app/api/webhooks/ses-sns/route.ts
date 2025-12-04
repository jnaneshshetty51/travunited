/**
 * API Route: SES SNS Webhook
 * POST /api/webhooks/ses-sns
 * 
 * Handles Amazon SES bounce and complaint notifications via SNS
 * Configure this endpoint in AWS SNS topic subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types for SNS messages
interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn?: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
  SubscribeURL?: string;
  Token?: string;
}

interface SESBounceNotification {
  notificationType: "Bounce";
  bounce: {
    bounceType: "Undetermined" | "Permanent" | "Transient";
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
  };
  mail: {
    timestamp: string;
    source: string;
    sourceArn: string;
    messageId: string;
    destination: string[];
  };
}

interface SESComplaintNotification {
  notificationType: "Complaint";
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintFeedbackType?: string;
  };
  mail: {
    timestamp: string;
    source: string;
    sourceArn: string;
    messageId: string;
    destination: string[];
  };
}

type SESNotification = SESBounceNotification | SESComplaintNotification;

/**
 * Log email bounce/complaint to database
 */
async function logEmailEvent(
  type: "bounce" | "complaint",
  email: string,
  details: any
): Promise<void> {
  try {
    // Create a log entry in the database
    // You may want to create a separate table for this or use your existing notification system
    await prisma.$executeRaw`
      INSERT INTO email_events (type, email, details, created_at)
      VALUES (${type}, ${email}, ${JSON.stringify(details)}::jsonb, NOW())
      ON CONFLICT (email, type) 
      DO UPDATE SET 
        count = email_events.count + 1,
        last_occurred = NOW(),
        details = ${JSON.stringify(details)}::jsonb
    `;
    
    console.log(`[SES] ${type.toUpperCase()} logged for ${email}`);
  } catch (error) {
    // If table doesn't exist, just log to console
    console.log(`[SES] ${type.toUpperCase()} for ${email}:`, details);
  }
}

/**
 * Handle bounce notification
 */
async function handleBounce(notification: SESBounceNotification): Promise<void> {
  const { bounce } = notification;
  
  console.log(`[SES] Bounce notification received:`, {
    type: bounce.bounceType,
    subType: bounce.bounceSubType,
    recipients: bounce.bouncedRecipients.length,
  });

  for (const recipient of bounce.bouncedRecipients) {
    const email = recipient.emailAddress;
    
    await logEmailEvent("bounce", email, {
      bounceType: bounce.bounceType,
      bounceSubType: bounce.bounceSubType,
      diagnosticCode: recipient.diagnosticCode,
      timestamp: bounce.timestamp,
    });

    // If it's a permanent bounce, you might want to mark the email as invalid
    if (bounce.bounceType === "Permanent") {
      console.log(`[SES] Permanent bounce detected for ${email} - consider blocking future emails`);
      
      // TODO: Add your logic here to:
      // 1. Mark user email as bounced in database
      // 2. Create notification for admin
      // 3. Update user record to prevent future emails
      
      // Example:
      // await prisma.user.updateMany({
      //   where: { email },
      //   data: { emailBounced: true, emailBouncedAt: new Date() }
      // });
    }
  }
}

/**
 * Handle complaint notification
 */
async function handleComplaint(notification: SESComplaintNotification): Promise<void> {
  const { complaint } = notification;
  
  console.log(`[SES] Complaint notification received:`, {
    type: complaint.complaintFeedbackType,
    recipients: complaint.complainedRecipients.length,
  });

  for (const recipient of complaint.complainedRecipients) {
    const email = recipient.emailAddress;
    
    await logEmailEvent("complaint", email, {
      complaintFeedbackType: complaint.complaintFeedbackType,
      timestamp: complaint.timestamp,
    });

    console.log(`[SES] Complaint from ${email} - should unsubscribe immediately`);
    
    // TODO: Add your logic here to:
    // 1. Mark user as complained/unsubscribed
    // 2. Create notification for admin
    // 3. Stop all future emails to this address
    
    // Example:
    // await prisma.user.updateMany({
    //   where: { email },
    //   data: { 
    //     emailComplaint: true, 
    //     emailComplaintAt: new Date(),
    //     unsubscribed: true 
    //   }
    // });
  }
}

/**
 * Main webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const snsMessage: SNSMessage = JSON.parse(body);

    console.log(`[SES SNS] Received ${snsMessage.Type} message`);

    // Handle subscription confirmation
    if (snsMessage.Type === "SubscriptionConfirmation") {
      console.log("[SES SNS] Subscription confirmation received");
      
      if (snsMessage.SubscribeURL) {
        try {
          // Auto-confirm the subscription
          const response = await fetch(snsMessage.SubscribeURL);
          if (response.ok) {
            console.log("[SES SNS] Subscription confirmed successfully");
          } else {
            console.error("[SES SNS] Failed to confirm subscription:", response.status);
          }
        } catch (error) {
          console.error("[SES SNS] Error confirming subscription:", error);
        }
      }
      
      return NextResponse.json({ message: "Subscription confirmation processed" });
    }

    // Handle notification
    if (snsMessage.Type === "Notification") {
      const notification: SESNotification = JSON.parse(snsMessage.Message);
      
      if (notification.notificationType === "Bounce") {
        await handleBounce(notification as SESBounceNotification);
      } else if (notification.notificationType === "Complaint") {
        await handleComplaint(notification as SESComplaintNotification);
      } else {
        console.log("[SES SNS] Unknown notification type:", (notification as any).notificationType);
      }
      
      return NextResponse.json({ message: "Notification processed" });
    }

    // Handle unsubscribe confirmation
    if (snsMessage.Type === "UnsubscribeConfirmation") {
      console.log("[SES SNS] Unsubscribe confirmation received");
      return NextResponse.json({ message: "Unsubscribe confirmation processed" });
    }

    return NextResponse.json({ message: "Unknown message type" });
  } catch (error: any) {
    console.error("[SES SNS] Webhook error:", error);
    
    // Return 200 anyway to prevent SNS from retrying
    // Log the error for investigation
    return NextResponse.json(
      { 
        error: "Webhook processing failed", 
        message: error.message 
      },
      { status: 200 } // Return 200 to prevent retries
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "SES SNS Webhook endpoint",
    usage: "Configure this URL in AWS SNS topic subscription",
    endpoint: "/api/webhooks/ses-sns",
    method: "POST",
  });
}

