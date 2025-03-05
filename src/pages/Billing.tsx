
import { useState, useEffect } from '@/lib/react-helpers';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Billing = () => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$9',
      description: 'Perfect for individuals',
      features: ['Access to basic courses', 'One learning path', 'Email support']
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$19',
      description: 'Best for professionals',
      features: ['Access to all courses', 'Unlimited learning paths', 'Priority support', 'Certification']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      description: 'For organizations',
      features: ['Dedicated account manager', 'Custom course creation', 'Advanced analytics', 'SSO Integration']
    }
  ]);

  const handleSubscribe = (planId) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      alert(`Subscribed to ${planId} plan!`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2 text-3xl font-bold">{plan.price}</div>
              {plan.id === 'enterprise' && <div className="text-sm text-muted-foreground">Contact us for pricing</div>}
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={loading}
                onClick={() => handleSubscribe(plan.id)}
              >
                {plan.id === 'enterprise' ? 'Contact Sales' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Billing History</h2>
        <div className="bg-muted p-8 rounded-lg text-center">
          <p className="text-muted-foreground">No billing history available</p>
        </div>
      </div>
    </div>
  );
};

export default Billing;
