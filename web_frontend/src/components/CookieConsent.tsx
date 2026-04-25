import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "cookie-consent-choice";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
      <button
        type="button"
        className="absolute right-3 top-2 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setVisible(false)}
        aria-label="Close cookie consent"
      >
        x
      </button>
      <h3 className="pr-6 text-xl font-semibold text-foreground">Welcome to Digital Will!</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        We use cookies to improve your experience and keep the platform secure.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => handleChoice("declined")}>
          Decline
        </Button>
        <Button type="button" variant="default" className="flex-1" onClick={() => handleChoice("accepted")}>
          Accept All
        </Button>
      </div>
    </div>
  );
};

export default CookieConsent;

