"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { api, setToken, withToken } from "@/services/api";

export function DemoButton({
  children = "View Demo",
  variant = "secondary",
  size = "lg",
  className,
}: {
  children?: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const result = await api.post<{ token?: string }>("/api/auth/demo");
      setToken(result.token ?? null);
      window.location.assign(withToken("/app/dashboard", result.token));
    } catch (error) {
      toast.error((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={start} loading={loading} className={className}>
      {children}
    </Button>
  );
}
