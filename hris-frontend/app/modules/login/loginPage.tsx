// app/login/loginPage.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, Shield, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const LoginPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("Admin") // State untuk tab aktif
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            if (activeTab === "Admin") {
                // absolute path to the route under app/modules
                router.push('/modules/dashboard/dashboard-admin')
            } else {
                router.push('/modules/dashboard/dashboard-user')
            }
        }, 1500)
    }


    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 disable-scroll">
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
                    <h3 className="font-semibold">Compliance &amp; Security</h3>
                    <p className="text-slate-300 text-sm">Indonesian tax compliance with enterprise-grade security</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <p className="text-sm text-slate-400">
              Trusted by 500+ companies across Indonesia
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Welcome
                </CardTitle>
                <p className="text-gray-600">
                  Sign in to access your HRIS dashboard
                </p>
              </CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="Admin">Admin</TabsTrigger>
                        <TabsTrigger value="Employee">Employee</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Admin"></TabsContent>
                    <TabsContent value="Employee"></TabsContent>
                </Tabs>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="h-12 text-base"
                      // defaultValue="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      className="h-12 text-base"
                      // defaultValue="password"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-slate-600 hover:text-slate-800">
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Demo credentials are pre-filled. Just click Sign In.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span>Multi-tenant</span>
                <span>•</span>
                <span>Role-based access</span>
                <span>•</span>
                <span>SOC 2 compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;