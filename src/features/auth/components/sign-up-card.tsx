"use client";
import { DottedSeperator } from "@/components/dotted-sperator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema } from "../schemas";
import { useRegister } from "../api/use-register";
import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth";

export const SignUpCard = () => {

  const {mutate, isPending} = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    mutate({json: values});
  };
  
  return (
    <Card className="w-full h-full md:w-[487px] border-none shadow-none">
      <CardHeader className="flex items-center justify-center text-center p-7">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          By Signing Up, you agree to our{" "}
          <Link href="/privacy">
            <span className="text-blue-700">Privary Policy</span>
          </Link>{" "}
          and{" "}
          <Link href="/terms">
            <span className="text-blue-700">Terms Of Service</span>
          </Link>
        </CardDescription>
      </CardHeader>
      <div className="px-7">
        <DottedSeperator />
      </div>
      <CardContent className="p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter your Full Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your Password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isPending} size="lg" className="w-full">
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
      <div className="px-7">
        <DottedSeperator />
        <CardContent className="p-7 flex flex-col gap-y-4">
          <Button
            onClick={() => signUpWithGoogle()}
            variant="secondary"
            size="lg"
            disabled={isPending}
            className="w-full"
          >
            <FcGoogle className="mr-2 size-5" />
            Login With Google
          </Button>
          <Button
            variant="secondary"
            onClick={() => signUpWithGithub()}
            size="lg"
            disabled={isPending}
            className="w-full"
          >
            <FaGithub className="mr-2 size-5" />
            Login With Github
          </Button>
        </CardContent>
        <div className="px-7">
          <DottedSeperator />
        </div>
        <CardContent className="p-7 flex items-center justify-center">
          <p>
            Already have an Account?
            <Link href="/sign-up">
              <span className="text-blue-700">&nbsp;Login</span>
            </Link>
          </p>
        </CardContent>
      </div>
    </Card>
  );
};
