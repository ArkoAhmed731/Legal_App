import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2, CheckCircle, X, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { APP_CONFIG } from "@/lib/app-config";
import { useUpload } from "@/hooks/use-upload";

const tenantNavigate = (path: string) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export default function RegisterLawyerPage() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  const specialties = APP_CONFIG.specialties.filter(s => s !== "All Specialties");

  const [formData, setFormData] = useState({
    specialty: "",
    barNumber: "",
    yearsExperience: "",
    bio: "",
    jurisdictions: "",
    languages: "",
  });

  const [licenseDocUrl, setLicenseDocUrl] = useState("");
  const [licenseFileName, setLicenseFileName] = useState("");
  const [govIdDocUrl, setGovIdDocUrl] = useState("");
  const [govIdFileName, setGovIdFileName] = useState("");

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const govIdInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile: uploadLicense, isUploading: isUploadingLicense } = useUpload({
    onSuccess: (res) => {
      setLicenseDocUrl(res.objectPath);
      setLicenseFileName(res.metadata.name);
    },
    onError: (err) => toast({ title: "Upload Failed", description: err.message, variant: "destructive" }),
  });

  const { uploadFile: uploadGovId, isUploading: isUploadingGovId } = useUpload({
    onSuccess: (res) => {
      setGovIdDocUrl(res.objectPath);
      setGovIdFileName(res.metadata.name);
    },
    onError: (err) => toast({ title: "Upload Failed", description: err.message, variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!licenseDocUrl) {
        throw new Error("Please upload your professional license");
      }
      if (!govIdDocUrl) {
        throw new Error("Please upload a government-issued photo ID");
      }
      const payload = {
        specialty: formData.specialty,
        barNumber: formData.barNumber,
        yearsExperience: parseInt(formData.yearsExperience) || 0,
        bio: formData.bio,
        jurisdictions: formData.jurisdictions.split(",").map((j) => j.trim()).filter(Boolean),
        languages: formData.languages.split(",").map((l) => l.trim()).filter(Boolean),
        licenseDocUrl,
        govIdDocUrl,
      };
      const res = await apiRequest("POST", "/api/register/lawyer", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted",
        description: `Your ${APP_CONFIG.professionalLabel.toLowerCase()} profile has been submitted for admin verification. You'll be notified once approved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      tenantNavigate("/dashboard");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  async function handleLicenseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLicense(file);
  }

  async function handleGovIdFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadGovId(file);
  }

  const onboardingComplete = (user as any)?.onboardingComplete;

  if (role === "professional" && onboardingComplete) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
            <h2 className="font-serif text-xl font-bold">Already Registered</h2>
            <p className="text-sm text-muted-foreground">
              You're already registered as a {APP_CONFIG.professionalLabel.toLowerCase()}. Your account is pending admin verification.
            </p>
            <Button variant="outline" onClick={() => tenantNavigate("/dashboard")} data-testid="button-go-dashboard">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role !== "client" && role !== "professional") {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <X className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="font-serif text-xl font-bold">Cannot Register</h2>
            <p className="text-sm text-muted-foreground">
              Your current role ({role}) cannot register as a {APP_CONFIG.professionalLabel.toLowerCase()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSubmit = formData.specialty && formData.barNumber && licenseDocUrl && govIdDocUrl;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-register-lawyer-title">
          Register as a {APP_CONFIG.professionalLabel}
        </h1>
        <p className="text-muted-foreground text-sm">
          Submit your credentials and documents for verification. Your account will be activated after admin review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Specialty <span className="text-destructive">*</span></Label>
              <Select
                value={formData.specialty}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, specialty: v }))}
              >
                <SelectTrigger data-testid="select-specialty">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Bar Number <span className="text-destructive">*</span></Label>
              <Input
                value={formData.barNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, barNumber: e.target.value }))}
                placeholder="e.g., CA-123456"
                data-testid="input-bar-number"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Years of Experience</Label>
              <Input
                type="number"
                value={formData.yearsExperience}
                onChange={(e) => setFormData((prev) => ({ ...prev, yearsExperience: e.target.value }))}
                placeholder="e.g., 10"
                data-testid="input-years-experience"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Languages (comma-separated)</Label>
              <Input
                value={formData.languages}
                onChange={(e) => setFormData((prev) => ({ ...prev, languages: e.target.value }))}
                placeholder="e.g., English, Spanish"
                data-testid="input-languages"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Jurisdictions (comma-separated)</Label>
            <Input
              value={formData.jurisdictions}
              onChange={(e) => setFormData((prev) => ({ ...prev, jurisdictions: e.target.value }))}
              placeholder="e.g., California, New York"
              data-testid="input-jurisdictions"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Professional Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Describe your experience, areas of expertise, and what makes you unique..."
              className="resize-none text-sm"
              rows={4}
              data-testid="input-bio"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600">
                Both documents are required for verification. Accepted formats: PDF, JPG, PNG, WebP (max 10MB each).
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Professional License <span className="text-destructive">*</span></Label>
              <input
                ref={licenseInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleLicenseFile}
                className="hidden"
                data-testid="input-license-file"
              />
              {licenseDocUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs truncate flex-1">{licenseFileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => licenseInputRef.current?.click()}
                    data-testid="button-change-license"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => licenseInputRef.current?.click()}
                  disabled={isUploadingLicense}
                  data-testid="button-upload-license"
                >
                  {isUploadingLicense ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload License</>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Government Photo ID <span className="text-destructive">*</span></Label>
              <input
                ref={govIdInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleGovIdFile}
                className="hidden"
                data-testid="input-govid-file"
              />
              {govIdDocUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs truncate flex-1">{govIdFileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => govIdInputRef.current?.click()}
                    data-testid="button-change-govid"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => govIdInputRef.current?.click()}
                  disabled={isUploadingGovId}
                  data-testid="button-upload-govid"
                >
                  {isUploadingGovId ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload Photo ID</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        disabled={!canSubmit || registerMutation.isPending}
        onClick={() => registerMutation.mutate()}
        data-testid="button-submit-lawyer-registration"
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Briefcase className="h-4 w-4 mr-1" />
            Submit for Verification
          </>
        )}
      </Button>
    </div>
  );
}
