import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const Billing = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Billing & Subscription</h1>
        
        <div className="space-y-8">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
            
            <div className="flex items-center p-4 border rounded-md bg-primary/5 mb-4">
              <div className="mr-4">
                <span className="text-xl font-bold text-primary">Pro Plan</span>
              </div>
              <div className="ml-auto">
                <span className="text-sm text-muted-foreground">Renews on Oct 15, 2023</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>For individual learners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Access to 100+ courses</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Basic progress tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Email support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Downgrade</Button>
                </CardFooter>
              </Card>
              
              <Card className="border-primary">
                <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                  <CardTitle>Pro</CardTitle>
                  <CardDescription className="text-primary-foreground/90">For serious learners</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$19.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Access to all courses</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Advanced progress tracking</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Learning path recommendations</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled>Current Plan</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>For teams and organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$49.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>All Pro features</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Team management</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Custom learning paths</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>Analytics dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                      <span>24/7 dedicated support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Upgrade</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            
            <div className="flex items-center p-4 border rounded-md mb-4">
              <div className="mr-4">
                <div className="w-10 h-6 bg-slate-800 rounded"></div>
              </div>
              <div>
                <span className="font-medium">•••• •••• •••• 4242</span>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
              <div className="ml-auto">
                <Button variant="ghost" size="sm">Change</Button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline">Add Payment Method</Button>
            </div>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Billing History</h2>
            
            <div className="border rounded-md divide-y">
              <div className="p-4 flex items-center">
                <div>
                  <span className="font-medium">Pro Plan - Monthly</span>
                  <p className="text-sm text-muted-foreground">Sep 15, 2023</p>
                </div>
                <div className="ml-auto font-medium">$19.99</div>
                <Button variant="ghost" size="sm" className="ml-4">Receipt</Button>
              </div>
              <div className="p-4 flex items-center">
                <div>
                  <span className="font-medium">Pro Plan - Monthly</span>
                  <p className="text-sm text-muted-foreground">Aug 15, 2023</p>
                </div>
                <div className="ml-auto font-medium">$19.99</div>
                <Button variant="ghost" size="sm" className="ml-4">Receipt</Button>
              </div>
              <div className="p-4 flex items-center">
                <div>
                  <span className="font-medium">Pro Plan - Monthly</span>
                  <p className="text-sm text-muted-foreground">Jul 15, 2023</p>
                </div>
                <div className="ml-auto font-medium">$19.99</div>
                <Button variant="ghost" size="sm" className="ml-4">Receipt</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing; 