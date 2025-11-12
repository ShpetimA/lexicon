import {
  createFileRoute,
  redirect,
  useNavigate,
  Link,
} from "@tanstack/react-router";
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
import { z } from "zod";
import { useAppForm } from "@/src/hooks/useAppForm";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/editor" });
    }
  },
});

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignUpPage() {
  const navigate = useNavigate();
  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signUp.email({
          email: value.email,
          name: value.name,
          password: value.password,
        });

        if (result.error) {
          toast.error(result.error.message || "Sign up failed");
          return;
        }

        navigate({ to: "/editor" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "An error occurred");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your details to create an account
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
            <form.AppField name="name">
              {(field) => (
                <field.TextField label="Name" placeholder="John Doe" required />
              )}
            </form.AppField>

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
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <form.AppForm>
              <form.SubmitButton className="w-full">Sign Up</form.SubmitButton>
            </form.AppForm>

            <Button type="button" variant="link" asChild className="text-sm">
              <Link to="/login">Already have an account? Sign in</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
