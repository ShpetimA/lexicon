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
import { api } from "../../convex/_generated/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  beforeLoad: async ({ context }) => {
    if (context.userId) {
      throw redirect({ to: "/customers" });
    }
  },
});

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignUpPage() {
  const navigate = useNavigate();
  const { mutateAsync: syncUser } = useMutation({
    mutationFn: useConvexMutation(api.users.syncUser),
    onError: () => {
      toast.error("Failed to sync user");
    },
  });
  const queryClient = useQueryClient();

  const form = useAppForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { data, error } = await authClient.signUp.email({
          email: value.email,
          name: value.name,
          password: value.password,
        });

        if (error) {
          toast.error(error.message || "Sign up failed");
          return;
        }

        await syncUser({
          betterAuthUserId: data.user.id,
          email: data.user.email,
          name: data.user.name,
        });

        queryClient.removeQueries({ queryKey: ["auth"] });
        navigate({ to: "/customers" });
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
