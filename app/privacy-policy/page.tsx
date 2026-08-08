import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { FACEBOOK_OAUTH_SCOPES } from "@/lib/connections/constants";
import { getSiteBaseUrl } from "@/lib/common/get-site-base-url";
import {
  FACEBOOK_APP_NAME,
  LEGAL_ENTITY_NAME,
  PRIVACY_CONTACT_EMAIL,
  PRODUCT_NAME,
} from "@/lib/legal/constants";

const LAST_UPDATED = "August 7, 2026";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${PRODUCT_NAME} privacy policy — how we collect, use, store, and delete data, including Facebook Page and Messenger integration through ${FACEBOOK_APP_NAME}.`,
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  const siteUrl = getSiteBaseUrl();
  const facebookScopes = FACEBOOK_OAUTH_SCOPES.join(", ");

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how {LEGAL_ENTITY_NAME} (&quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, and shares
        information when you use {PRODUCT_NAME} (the &quot;Service&quot;). This
        policy covers our use of Facebook Platform data for Messenger Page
        connections and is intended to meet Meta Platform requirements.
      </p>

      <p>
        By using the Service, you agree to this Privacy Policy. If you do not
        agree, please do not use the Service.
      </p>

      <h2>Who we are</h2>
      <p>
        {PRODUCT_NAME} is an AI chat agent platform developed by{" "}
        {LEGAL_ENTITY_NAME}. The Service helps you create and configure chat
        agents for your workspaces and connect them to customer messaging
        channels such as Facebook Page Messenger.
      </p>

      <h3>Our Meta app</h3>
      <p>
        When you connect a Facebook Page, you authorize{" "}
        <strong>{FACEBOOK_APP_NAME}</strong> through Facebook&apos;s OAuth
        dialog. This Meta app is used only for Page and Messenger integration.
        It is separate from signing in to {PRODUCT_NAME}; account sign-in uses
        email and password or Google through Firebase Authentication.
      </p>

      <h2>Information we collect</h2>

      <h3>Account information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address</li>
        <li>Display name (optional)</li>
        <li>Profile picture URL (optional)</li>
        <li>Authentication identifiers from our identity provider</li>
      </ul>
      <p>
        Sign-in is provided through Firebase Authentication. You may register
        with email and password or sign in with Google.
      </p>

      <h3>Workspace and agent data</h3>
      <p>
        We store information you create or configure in the Service, such as:
      </p>
      <ul>
        <li>Workspace names and membership</li>
        <li>Agent names, descriptions, system prompts, and greeting messages</li>
        <li>Connection settings linking agents to messaging channels</li>
      </ul>

      <h3>Facebook Page and Messenger data ({FACEBOOK_APP_NAME})</h3>
      <p>
        When you choose to connect one or more Facebook Pages you manage, we
        access Facebook data only after you authorize {FACEBOOK_APP_NAME}{" "}
        through Facebook&apos;s OAuth dialog. We request the following
        permissions: <strong>{facebookScopes}</strong>.
      </p>
      <p>Through this authorization, we may receive and store:</p>
      <ul>
        <li>Facebook Page IDs, names, and public page URLs</li>
        <li>Facebook Page profile picture URLs</li>
        <li>
          Page access tokens and long-lived user access tokens needed to
          maintain the connection, receive webhooks, and send Messenger replies
          on your behalf
        </li>
        <li>
          Basic public profile information shown during the Facebook
          authorization flow
        </li>
      </ul>
      <p>
        When customers message your connected Facebook Page, we may also
        process Messenger webhook events, including:
      </p>
      <ul>
        <li>
          Facebook Page-Scoped IDs (PSIDs) for participants in a conversation
        </li>
        <li>Message text, Get Started postbacks, and Facebook message IDs</li>
        <li>
          Delivery and read receipt events sent by Facebook for those messages
        </li>
        <li>
          Image attachments sent by customers, which we may download and store
          in our object storage to support AI vision replies
        </li>
      </ul>
      <p>
        We do not access your personal Facebook timeline, friends list, private
        messages outside connected Pages, or Pages you do not explicitly connect
        inside {PRODUCT_NAME}.
      </p>

      <h3>Conversation and AI processing data</h3>
      <p>
        To provide automated Messenger replies, we store conversation metadata
        and message history needed to run your assigned agents, including:
      </p>
      <ul>
        <li>Conversation titles and timestamps</li>
        <li>
          LangGraph session state and recent message history used to generate
          replies
        </li>
        <li>Processed inbound message IDs used to prevent duplicate replies</li>
      </ul>
      <p>
        Message content may be sent to third-party AI providers (such as OpenAI
        or Anthropic) to generate agent responses according to your agent
        configuration.
      </p>

      <h3>Technical and usage information</h3>
      <p>We may automatically collect limited technical data, such as:</p>
      <ul>
        <li>Browser type, device type, and general usage logs</li>
        <li>IP address and request timestamps for security and operations</li>
        <li>Session and authentication cookies required to keep you signed in</li>
        <li>
          Optional developer tracing metadata when tracing is enabled in our
          deployment environment
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, operate, and secure the Service</li>
        <li>Authenticate you and manage your account</li>
        <li>
          List Facebook Pages you manage so you can choose which Pages to
          connect through {FACEBOOK_APP_NAME}
        </li>
        <li>
          Receive Messenger webhook events for connected Pages and route them to
          the agent you assign
        </li>
        <li>
          Send automated Messenger replies, greeting messages, and sender
          actions (such as mark seen and typing indicators) when configured
        </li>
        <li>
          Store conversation history so agents can maintain context across
          messages from the same customer
        </li>
        <li>Refresh Facebook access tokens so connected Pages remain usable</li>
        <li>Respond to support and privacy requests</li>
        <li>Comply with legal obligations and enforce our terms</li>
      </ul>
      <p>
        We use Facebook Platform Data only to provide the features you request.
        We do not sell Facebook Platform Data.
      </p>

      <h2>How we share information</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Meta / Facebook</strong> — when you connect Pages through{" "}
          {FACEBOOK_APP_NAME}, receive Messenger webhooks, or send replies
          through the Facebook Graph API and Send API
        </li>
        <li>
          <strong>AI providers</strong> — such as OpenAI or Anthropic, to
          generate agent replies from message content and configured prompts
        </li>
        <li>
          <strong>Service providers</strong> — such as hosting, database,
          storage, authentication (including Firebase), background job
          processing, and optional tracing providers that help us run the
          Service
        </li>
        <li>
          <strong>Other workspace members</strong> — when you collaborate inside
          a shared workspace
        </li>
        <li>
          <strong>Legal authorities</strong> — when required by law or to
          protect rights, safety, and security
        </li>
      </ul>
      <p>
        We do not share encrypted Facebook Page tokens with other users or
        expose them in our user interface.
      </p>

      <h2>Data storage and security</h2>
      <p>
        Facebook Page access tokens and related connection credentials are
        encrypted before storage. We use access controls, encrypted transport
        (HTTPS), and industry-standard cloud infrastructure to protect your
        data.
      </p>
      <p>
        No method of transmission or storage is completely secure. If you believe
        your account or connected Facebook Page has been compromised, contact us
        immediately.
      </p>

      <h2>Data retention</h2>
      <ul>
        <li>
          Account and workspace data is kept while your account is active and as
          needed to provide the Service.
        </li>
        <li>
          Facebook Page connection data, including encrypted tokens, is kept
          until you disconnect the Page inside {PRODUCT_NAME} or revoke{" "}
          {FACEBOOK_APP_NAME} in Facebook settings.
        </li>
        <li>
          Messenger conversation records and AI session history are kept until
          you delete the connection, reset the conversation by reassigning the
          agent, or request deletion.
        </li>
        <li>
          Inbound images stored for vision processing may be retained according
          to our storage policies for connected conversations.
        </li>
        <li>
          We may retain limited logs and backups for security, fraud prevention,
          and legal compliance for a reasonable period.
        </li>
      </ul>

      <h2>Your choices and data deletion</h2>
      <p>You can control your data in the following ways:</p>

      <h3>Disconnect a Facebook Page</h3>
      <ol>
        <li>Sign in to {PRODUCT_NAME}</li>
        <li>Open your workspace</li>
        <li>
          Go to <strong>Connections</strong>
        </li>
        <li>Remove the Facebook Page connection you no longer want</li>
      </ol>
      <p>
        When you disconnect a Page, we delete the stored encrypted tokens and
        scheduled refresh jobs for that connection. Messenger conversations
        associated with that connection may also be removed. Messages already
        sent through Facebook remain in Messenger under your control.
      </p>

      <h3>Revoke Page access in Facebook</h3>
      <p>
        You can also remove {FACEBOOK_APP_NAME} from your Facebook account at
        any time:
      </p>
      <ol>
        <li>
          Go to Facebook <strong>Settings &amp; privacy</strong> →{" "}
          <strong>Settings</strong>
        </li>
        <li>
          Open <strong>Business integrations</strong> or{" "}
          <strong>Apps and websites</strong>
        </li>
        <li>
          Find <strong>{FACEBOOK_APP_NAME}</strong>
        </li>
        <li>Remove the app or revoke access to the relevant Pages</li>
      </ol>

      <h3>Request deletion of your data</h3>
      <p>
        To request deletion of your account data or Facebook Platform Data we
        store, email us at{" "}
        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>{" "}
        from the email address linked to your account. Please include:
      </p>
      <ul>
        <li>Your full name</li>
        <li>Your account email address</li>
        <li>
          Whether you want account deletion, Facebook Page connection deletion,
          Messenger conversation deletion, or any combination
        </li>
        <li>The Facebook Page name(s), if applicable</li>
      </ul>
      <p>
        We will verify your request and respond within a reasonable time,
        generally within 30 days, unless a longer period is required by law.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        The Service is not directed to children under 13, and we do not knowingly
        collect personal information from children under 13.
      </p>

      <h2>International users</h2>
      <p>
        Your information may be processed in countries where we or our service
        providers operate. By using the Service, you understand that your
        information may be transferred to and processed in those locations.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will
        revise the &quot;Last updated&quot; date at the top of this page. If
        changes are material, we may provide additional notice inside the
        Service.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have questions about this Privacy Policy or how we handle
        Facebook Platform Data through {FACEBOOK_APP_NAME}, contact:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a>
        </li>
        <li>
          Website: <Link href={siteUrl}>{siteUrl}</Link>
        </li>
      </ul>
    </LegalPageLayout>
  );
}
