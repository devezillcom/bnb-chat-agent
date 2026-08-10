'use client';
import { useAuth } from "@/components/auth/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  // Wait until the user is loaded before rendering the layout, so that children never have to handle a "loading user" state.
  // (Access to this route is already protected by proxy middleware.)
  if (loading || !user) {
    return <div className='flex h-screen items-center justify-center text-xs'>Authenticating...</div>;
  }

  return children;
}
