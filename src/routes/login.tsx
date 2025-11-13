import {
  createFileRoute,
  redirect,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async ({ context }) => {
    if (context.userId) {
      throw redirect({ to: "/customers" });
    }
  },
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          setError(result.error.message || "Sign in failed");
          return;
        }

        navigate({ to: "/editor" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <form.AppForm>
              <form.SubmitButton className="w-full">Sign In</form.SubmitButton>
            </form.AppForm>

            <Button type="button" variant="link" asChild className="text-sm">
              <Link to="/signup">Don't have an account? Sign up</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
