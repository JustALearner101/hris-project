"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (role: "admin" | "user") => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("userRole", role);
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Branding */}
        <div className="lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-8 lg:p-16 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Image src="/assets/bg.png" alt="Logo" width={40} height={40} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AnglerFish</h1>
                <p className="text-slate-300 text-sm">Enterprise HR Solution</p>
              </div>
            </div>

            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Streamline Your HR Operations
              </h2>
              <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                Complete human resource management solution for modern enterprises.
                Manage employees, payroll, attendance, and more from one platform.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Employee Management</h3>
                    <p className="text-slate-300 text-sm">Complete employee lifecycle management with self-service capabilities</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Advanced Analytics</h3>
                    <p className="text-slate-300 text-sm">Real-time insights and reporting for data-driven HR decisions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compliance & Security</h3>
                    <p className="text-slate-300 text-sm">Indonesian tax compliance with enterprise-grade security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block pt-6">
            <p className="text-sm text-slate-400">
              Trusted by 500+ companies across Indonesia
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
              <p className="text-muted-foreground mt-2">Sign in to your account</p>
            </div>

            <Tabs defaultValue="Admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Admin">Admin Portal</TabsTrigger>
                <TabsTrigger value="User">Employee Portal</TabsTrigger>
              </TabsList>

              <TabsContent value="Admin" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Administrator Sign In</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin("admin")} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input type="email" placeholder="admin@company.com" defaultValue="admin@company.com" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input type="password" placeholder="••••••••" defaultValue="password" required />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember-admin" defaultChecked />
                          <label htmlFor="remember-admin" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
                        </div>
                        <a href="#" className="text-primary hover:underline text-sm font-medium">Forgot password?</a>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In to Admin Portal"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="User" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Employee Sign In</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin("user")} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Employee ID / Email</label>
                        <Input type="text" placeholder="employee@company.com" defaultValue="user@company.com" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input type="password" placeholder="••••••••" defaultValue="password" required />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="remember-user" defaultChecked />
                          <label htmlFor="remember-user" className="text-sm text-muted-foreground cursor-pointer">Remember me</label>
                        </div>
                        <a href="#" className="text-primary hover:underline text-sm font-medium">Forgot password?</a>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In to Employee Portal"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
