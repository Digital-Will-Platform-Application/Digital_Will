import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Lock, Check, Shield, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Payment method logos as SVG components
const PayPalLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.72A.77.77 0 0 1 5.7 2.07h6.84c2.263 0 3.934.554 4.967 1.648.966 1.022 1.254 2.39.856 4.066-.436 1.834-1.29 3.23-2.537 4.149-1.207.89-2.77 1.34-4.642 1.34H8.796a.78.78 0 0 0-.77.655l-.95 6.409zm2.05-15.58-.9 5.706h2.028c2.744 0 4.313-1.28 4.66-3.203.17-.94.04-1.683-.387-2.204-.45-.55-1.27-.828-2.44-.828h-2.2a.78.78 0 0 0-.76.53z" fill="#003087"/>
    <path d="M19.957 7.758c-.437 1.834-1.29 3.231-2.538 4.149-1.207.89-2.77 1.34-4.642 1.34h-2.39a.78.78 0 0 0-.77.656l-1.31 8.815a.641.641 0 0 0 .633.74h3.39a.77.77 0 0 0 .758-.648l.62-3.92a.78.78 0 0 1 .77-.656h1.67c2.744 0 4.764-1.11 5.31-4.31.256-1.5.123-2.736-.522-3.618-.157-.214-.346-.41-.567-.586.17-.94.04-1.683-.387-2.204-.053-.063-.108-.123-.165-.18.298-.4.527-.848.68-1.342.436 1.022.254 2.39-.54 1.764z" fill="#0070E0"/>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/>
  </svg>
);

const ApplePayLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M7.078 23.55c-.473-.316-.893-.703-1.244-1.15-.383-.463-.738-.95-1.064-1.454-.766-1.12-1.365-2.345-1.78-3.636-.5-1.502-.743-2.94-.743-4.347 0-1.57.34-2.94 1.002-4.09.49-.9 1.22-1.653 2.1-2.182.85-.53 1.84-.82 2.84-.84.35 0 .73.05 1.13.15.29.08.64.21 1.07.37.55.21.85.34.95.37.32.12.59.17.8.17.16 0 .39-.04.68-.13.08-.03.36-.12.85-.29.5-.17.87-.3 1.11-.37.5-.13.97-.2 1.4-.2 1.02 0 1.96.25 2.78.74.49.3.93.68 1.3 1.13-.3.27-.56.54-.78.82-.53.69-.87 1.48-.97 2.35-.1.96.08 1.88.52 2.7.44.8 1.08 1.44 1.87 1.86-.18.56-.4 1.08-.66 1.58-.39.73-.82 1.42-1.3 2.07-.4.55-.78 1.01-1.13 1.38-.57.6-1.11.9-1.64.9-.36 0-.8-.11-1.32-.34-.52-.23-.96-.34-1.32-.34-.38 0-.83.12-1.36.34-.52.23-.92.34-1.2.34-.56 0-1.1-.3-1.64-.9zM12.03 6.3c-.13 0-.26 0-.4.02-.67.08-1.3.33-1.85.73-.55.4-.98.93-1.26 1.56-.13.28-.23.57-.3.88-.02.1-.03.18-.04.24 0 .04 0 .07-.01.1v.05c0 .07.01.09.02.1.03-.01.09-.05.19-.13.45-.36.98-.62 1.54-.78.59-.17 1.18-.23 1.77-.17.13.01.26.03.39.06.03 0 .07.02.1.02h.07c.07 0 .08-.02.08-.04 0-.04-.03-.14-.1-.3-.34-.78-.84-1.44-1.5-1.96-.34-.27-.72-.47-1.13-.6-.09-.03-.2-.04-.33-.06-.06 0-.14 0-.24.01z"/>
  </svg>
);

const GooglePayLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
  </svg>
);

const VisaMastercardLogo = () => (
  <div className="flex items-center gap-1">
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3c.42 0 .798.279.894.762l.817 4.338 2.018-5.1h2.037zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.013 1.08.963 1.682 1.698 2.042.756.368 1.01.605 1.006.934-.005.505-.603.728-1.16.737-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.572zm5.061 2.447H24l-1.565-7.496h-1.656c-.373 0-.687.218-.826.553l-2.909 6.943h2.036l.405-1.12h2.488l.233 1.12zm-2.163-2.656l1.02-2.815.588 2.815h-1.608zm-8.16-4.84l-1.603 7.496H8.34l1.604-7.496h1.94z" fill="#1A1F71"/>
    </svg>
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <circle cx="7" cy="12" r="7" fill="#EB001B"/>
      <circle cx="17" cy="12" r="7" fill="#F79E1B"/>
      <path d="M12 17.5a7 7 0 010-11 7 7 0 000 11z" fill="#FF5F00"/>
    </svg>
  </div>
);

const Payment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "professional";
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  const plans = {
    basic: {
      name: "Basic",
      price: "Free",
      period: "Forever",
      description: "Perfect for getting started",
    },
    professional: {
      name: "Professional",
      price: "$9.99",
      period: "per month",
      description: "Ideal for comprehensive estate planning",
    },
    legacy: {
      name: "Legacy",
      price: "$199",
      period: "one-time",
      description: "Complete peace of mind with lifetime access",
    },
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.professional;

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      logo: <VisaMastercardLogo />,
      description: "Visa, Mastercard, American Express",
      popular: true,
    },
    {
      id: "paypal",
      name: "PayPal",
      logo: <PayPalLogo />,
      description: "Pay with your PayPal account",
      popular: true,
    },
    {
      id: "stripe",
      name: "Stripe",
      logo: <StripeLogo />,
      description: "Secure payment processing",
      popular: false,
    },
    {
      id: "apple",
      name: "Apple Pay",
      logo: <ApplePayLogo />,
      description: "Pay with Apple Pay",
      popular: true,
    },
    {
      id: "google",
      name: "Google Pay",
      logo: <GooglePayLogo />,
      description: "Pay with Google Pay",
      popular: true,
    },
    {
      id: "bank",
      name: "Bank Transfer",
      logo: <Building2 className="w-6 h-6 text-gold" />,
      description: "Direct bank transfer",
      popular: false,
    },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData({ ...cardData, cardNumber: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setCardData({ ...cardData, expiryDate: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (plan === "basic") {
      // Free plan - no payment needed
      navigate("/login?plan=basic");
      return;
    }

    setLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      // TODO: Integrate actual payment processing here
      toast.success("Payment processed successfully! Redirecting...");
      navigate("/login?plan=" + plan);
    }, 2000);
  };

  const isFreePlan = plan === "basic";

  return (
    <div className="min-h-screen page-ambient bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link to="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Link>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-1"
            >
              <div className="card-elevated p-6 sticky top-24">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                  Order Summary
                </h2>
                
                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-semibold text-foreground">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Billing</span>
                    <span className="font-semibold text-foreground">
                      {selectedPlan.period}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{selectedPlan.price}</span>
                  </div>
                  {!isFreePlan && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="text-foreground">$0.00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Processing Fee</span>
                        <span className="text-foreground">$0.00</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg text-foreground">Total</span>
                    <span className="font-serif text-2xl font-bold text-gold">
                      {selectedPlan.price}
                    </span>
                  </div>
                  {selectedPlan.period !== "Forever" && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPlan.period}
                    </p>
                  )}
                </div>

                {/* Security Badge */}
                <div className="mt-6 pt-6 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-gold" />
                  <span>256-bit SSL Encryption</span>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-2"
            >
              <div className="card-elevated p-8">
                <div className="mb-8">
                  <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">
                    {isFreePlan ? "Complete Your Signup" : "Complete Your Payment"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isFreePlan
                      ? "No payment required. Create your account to get started."
                      : "Secure payment processing. Your information is encrypted and secure."}
                  </p>
                </div>

                {!isFreePlan && (
                  <>
                    {/* Payment Methods */}
                    <div className="mb-8">
                      <h3 className="font-semibold text-foreground mb-4">
                        Select Payment Method
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              paymentMethod === method.id
                                ? "border-gold bg-gold/10"
                                : "border-border hover:border-gold/50"
                            } ${method.popular ? "ring-1 ring-gold/20" : ""}`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-8 flex items-center justify-center">
                                {method.logo}
                              </div>
                              <span className="text-xs font-medium text-foreground text-center">
                                {method.name}
                              </span>
                              {method.popular && (
                                <span className="text-[10px] text-gold">Popular</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Payment Form */}
                    {paymentMethod === "card" && (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Cardholder Name
                          </label>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            value={cardData.cardholderName}
                            onChange={(e) =>
                              setCardData({ ...cardData, cardholderName: e.target.value })
                            }
                            className="input-elevated"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Card Number
                          </label>
                          <Input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardData.cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            className="input-elevated"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Expiry Date
                            </label>
                            <Input
                              type="text"
                              placeholder="MM/YY"
                              value={cardData.expiryDate}
                              onChange={handleExpiryChange}
                              maxLength={5}
                              className="input-elevated"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              CVV
                            </label>
                            <Input
                              type="text"
                              placeholder="123"
                              value={cardData.cvv}
                              onChange={(e) =>
                                setCardData({
                                  ...cardData,
                                  cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                                })
                              }
                              maxLength={4}
                              className="input-elevated"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-4 bg-secondary/50 rounded-lg">
                          <Lock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            Your payment information is encrypted and secure. We never store your 
                            full card details on our servers.
                          </p>
                        </div>
                      </form>
                    )}

                    {/* Other Payment Methods */}
                    {paymentMethod !== "card" && (
                      <div className="p-6 bg-secondary/30 rounded-lg text-center">
                        <p className="text-muted-foreground mb-4">
                          {paymentMethod === "paypal" && "You will be redirected to PayPal to complete your payment."}
                          {paymentMethod === "apple" && "Complete your payment using Apple Pay on your device."}
                          {paymentMethod === "google" && "Complete your payment using Google Pay."}
                          {paymentMethod === "stripe" && "Secure payment processing via Stripe."}
                          {paymentMethod === "bank" && "Bank transfer details will be provided after order confirmation."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Payment integration coming soon
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleSubmit}
                    disabled={loading || (!isFreePlan && paymentMethod === "card" && (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName))}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : isFreePlan ? (
                      "Create Free Account"
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>

                {/* Security Features */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-4">Security Features</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gold" />
                      <span className="text-sm text-muted-foreground">256-bit SSL Encryption</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gold" />
                      <span className="text-sm text-muted-foreground">PCI DSS Compliant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gold" />
                      <span className="text-sm text-muted-foreground">Secure Payment Gateway</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-gold" />
                      <span className="text-sm text-muted-foreground">No Card Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
