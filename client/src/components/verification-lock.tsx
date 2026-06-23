import { Lock, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationLockProps {
  verificationStatus: "pending" | "rejected" | null;
}

export default function VerificationLock({ verificationStatus }: VerificationLockProps) {
  const isRejected = verificationStatus === "rejected";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6" data-testid="verification-lock">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5">
          <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center ${
            isRejected ? "bg-destructive/10" : "bg-amber-500/10"
          }`}>
            {isRejected ? (
              <Shield className="h-8 w-8 text-destructive" />
            ) : (
              <Lock className="h-8 w-8 text-amber-500" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold" data-testid="text-lock-title">
              {isRejected ? "Verification Unsuccessful" : "Pending Verification"}
            </h2>
            <Badge
              variant="outline"
              className={isRejected
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }
              data-testid="badge-verification-status"
            >
              {isRejected ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Rejected
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 mr-1" />
                  Under Review
                </>
              )}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-lock-description">
            {isRejected
              ? "Your verification documents were not approved. Please contact an administrator for more information or to resubmit your documents."
              : "Your professional credentials are currently being reviewed by an administrator. All features will be unlocked once your documents have been verified."
            }
          </p>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Typically takes 1-2 business days</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
