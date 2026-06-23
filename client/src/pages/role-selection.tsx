import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Users, Briefcase, ArrowRight, ArrowLeft, MessageSquare, FileText, Calendar, ClipboardCheck, Shield, Loader2, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUpload } from "@/hooks/use-upload";

interface RoleSelectionProps {
  tenantSlug?: string;
  initialStep?: 1 | 2 | 3;
}

export default function RoleSelectionPage({ tenantSlug = "law", initialStep }: RoleSelectionProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep || 1);
  const [selectedRole, setSelectedRole] = useState<"client" | "professional" | null>(
    initialStep === 3 ? "professional" : null
  );

  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [specialty, setSpecialty] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [jurisdictions, setJurisdictions] = useState("");
  const [languages, setLanguages] = useState("");

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

  const tenantDisplay = { professionalLabel: "Lawyer", clientLabel: "I Need Legal Help", specialties: ["Family Law", "Criminal Defense", "Corporate Law", "Real Estate Law", "Immigration Law", "Personal Injury", "Intellectual Property", "Tax Law", "Employment Law", "Environmental Law"] };

  const selectRoleMutation = useMutation({
    mutationFn: async (data: {
      role: string;
      fullName: string;
      dateOfBirth: string;
      emailAddress: string;
      phone: string;
      address: string;
    }) => {
      const res = await apiRequest("POST", "/api/auth/select-role", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (selectedRole === "professional") {
        setStep(3);
      } else {
        window.location.href = "/dashboard";
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const registerLawyerMutation = useMutation({
    mutationFn: async (data: {
      specialty: string;
      barNumber: string;
      yearsExperience: number;
      bio: string;
      jurisdictions: string[];
      languages: string[];
      licenseDocUrl: string;
      govIdDocUrl: string;
    }) => {
      const res = await apiRequest("POST", "/api/register/lawyer", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = `${basePath}/dashboard`;
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleRoleSelect(role: "client" | "professional") {
    setSelectedRole(role);
    setStep(2);
  }

  function handleBack() {
    if (step === 3 && initialStep !== 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
      setSelectedRole(null);
    }
  }

  function validatePersonalInfo(): boolean {
    if (!fullName.trim()) {
      toast({ title: "Required", description: "Please enter your full name", variant: "destructive" });
      return false;
    }
    if (!dateOfBirth) {
      toast({ title: "Required", description: "Please enter your date of birth", variant: "destructive" });
      return false;
    }
    if (!emailAddress.trim()) {
      toast({ title: "Required", description: "Please enter your email address", variant: "destructive" });
      return false;
    }
    if (!phone.trim()) {
      toast({ title: "Required", description: "Please enter your phone number", variant: "destructive" });
      return false;
    }
    if (!address.trim()) {
      toast({ title: "Required", description: "Please enter your address", variant: "destructive" });
      return false;
    }
    return true;
  }

  function handlePersonalInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    if (!validatePersonalInfo()) return;

    selectRoleMutation.mutate({
      role: selectedRole,
      fullName: fullName.trim(),
      dateOfBirth,
      emailAddress: emailAddress.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });
  }

  function handleLawyerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!specialty) {
      toast({ title: "Required", description: "Please select your specialty", variant: "destructive" });
      return;
    }
    if (!barNumber.trim()) {
      toast({ title: "Required", description: "Please enter your bar number", variant: "destructive" });
      return;
    }
    if (!licenseDocUrl) {
      toast({ title: "Required", description: "Please upload your professional license", variant: "destructive" });
      return;
    }
    if (!govIdDocUrl) {
      toast({ title: "Required", description: "Please upload a government-issued photo ID", variant: "destructive" });
      return;
    }

    registerLawyerMutation.mutate({
      specialty,
      barNumber: barNumber.trim(),
      yearsExperience: parseInt(yearsExperience) || 0,
      bio: bio.trim(),
      jurisdictions: jurisdictions.split(",").map(j => j.trim()).filter(Boolean),
      languages: languages.split(",").map(l => l.trim()).filter(Boolean),
      licenseDocUrl,
      govIdDocUrl,
    });
  }

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


  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6" data-testid="step-indicator">
      {[1, 2, ...(selectedRole === "professional" ? [3] : [])].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all ${
            s === step ? "w-8 bg-accent" : s < step ? "w-8 bg-accent/40" : "w-8 bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-accent" />
              <span className="font-serif text-xl font-bold" data-testid="text-role-logo">Bichar Bebostha</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full space-y-6">
          {step !== 1 && stepIndicator}

          {step === 1 && (
            <>
              <div className="text-center space-y-3">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold" data-testid="text-role-title">
                  How will you use Bichar Bebostha?
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
                  Choose how you'd like to get started. You can always change this later.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card
                  className="hover-elevate cursor-pointer transition-all duration-200 border-2 border-transparent focus-within:border-accent"
                  data-testid="card-role-client"
                >
                  <CardContent className="p-6 sm:p-8 space-y-5">
                    <div className="h-14 w-14 rounded-md bg-accent/10 flex items-center justify-center">
                      <Users className="h-7 w-7 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-serif text-xl font-bold" data-testid="text-role-client">
                        {tenantDisplay.clientLabel}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Get guidance, find professionals, book consultations, and generate documents.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: MessageSquare, text: "AI-powered assistant" },
                        { icon: Users, text: "Browse verified professionals" },
                        { icon: Calendar, text: "Book consultations" },
                        { icon: FileText, text: "Generate documents" },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleRoleSelect("client")}
                      data-testid="button-select-client"
                    >
                      Continue as Client
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="hover-elevate cursor-pointer transition-all duration-200 border-2 border-transparent focus-within:border-accent"
                  data-testid="card-role-lawyer"
                >
                  <CardContent className="p-6 sm:p-8 space-y-5">
                    <div className="h-14 w-14 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <Briefcase className="h-7 w-7 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-serif text-xl font-bold" data-testid="text-role-lawyer">
                        I'm a {tenantDisplay.professionalLabel}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Register your practice, manage appointments, review documents, and grow your client base.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: Calendar, text: "Manage your appointments" },
                        { icon: ClipboardCheck, text: "Review client documents" },
                        { icon: Shield, text: "Verified professional profile" },
                        { icon: Briefcase, text: "Block calendar availability" },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleRoleSelect("professional")}
                      data-testid="button-select-lawyer"
                    >
                      Continue as {tenantDisplay.professionalLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back-to-role">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="text-center space-y-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-profile-title">
                    Your Information
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                    Please provide your personal details to create your account.
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handlePersonalInfoSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          data-testid="input-full-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth <span className="text-destructive">*</span></Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          data-testid="input-date-of-birth"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emailAddress">Email Address <span className="text-destructive">*</span></Label>
                        <Input
                          id="emailAddress"
                          type="email"
                          placeholder="you@example.com"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          data-testid="input-email-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          data-testid="input-phone"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your full address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="resize-none"
                        rows={2}
                        data-testid="input-address"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={selectRoleMutation.isPending}
                      data-testid="button-continue-signup"
                    >
                      {selectRoleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : selectedRole === "professional" ? (
                        <>
                          Continue to Verification
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {step === 3 && selectedRole === "professional" && (
            <>
              <div className="space-y-3">
                {initialStep !== 3 && (
                  <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back-to-profile">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <div className="text-center space-y-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-verification-title">
                    Professional Verification
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                    Upload your credentials for verification. Your account features will be unlocked after admin review.
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleLawyerSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Professional Details</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Specialty <span className="text-destructive">*</span></Label>
                          <Select value={specialty} onValueChange={setSpecialty}>
                            <SelectTrigger data-testid="select-specialty">
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                            <SelectContent>
                              {tenantDisplay.specialties.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Bar / License Number <span className="text-destructive">*</span></Label>
                          <Input
                            value={barNumber}
                            onChange={(e) => setBarNumber(e.target.value)}
                            placeholder="e.g., CA-123456"
                            data-testid="input-bar-number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Years of Experience</Label>
                          <Input
                            type="number"
                            value={yearsExperience}
                            onChange={(e) => setYearsExperience(e.target.value)}
                            placeholder="e.g., 10"
                            data-testid="input-years-experience"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Languages (comma-separated)</Label>
                          <Input
                            value={languages}
                            onChange={(e) => setLanguages(e.target.value)}
                            placeholder="e.g., English, Spanish"
                            data-testid="input-languages"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Jurisdictions (comma-separated)</Label>
                        <Input
                          value={jurisdictions}
                          onChange={(e) => setJurisdictions(e.target.value)}
                          placeholder="e.g., California, New York"
                          data-testid="input-jurisdictions"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Professional Bio</Label>
                        <Textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Describe your experience and areas of expertise..."
                          className="resize-none text-sm"
                          rows={3}
                          data-testid="input-bio"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Required Documents</h3>
                      <p className="text-xs text-muted-foreground">
                        Upload clear images or PDF documents. Accepted formats: JPG, PNG, PDF (max 10MB each).
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{tenantDisplay.professionalLabel}'s License <span className="text-destructive">*</span></Label>
                          <input
                            ref={licenseInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleLicenseFile}
                            className="hidden"
                            data-testid="input-license-file"
                          />
                          <div
                            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
                              licenseDocUrl ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted-foreground/20 hover:border-accent/40"
                            }`}
                            onClick={() => licenseInputRef.current?.click()}
                            data-testid="upload-area-license"
                          >
                            {isUploadingLicense ? (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Uploading...</span>
                              </div>
                            ) : licenseDocUrl ? (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                                <span className="text-xs text-muted-foreground truncate max-w-full">{licenseFileName}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <Upload className="h-6 w-6 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">Click to upload license</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Government Photo ID <span className="text-destructive">*</span></Label>
                          <input
                            ref={govIdInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleGovIdFile}
                            className="hidden"
                            data-testid="input-govid-file"
                          />
                          <div
                            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
                              govIdDocUrl ? "border-emerald-500/30 bg-emerald-500/5" : "border-muted-foreground/20 hover:border-accent/40"
                            }`}
                            onClick={() => govIdInputRef.current?.click()}
                            data-testid="upload-area-govid"
                          >
                            {isUploadingGovId ? (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Uploading...</span>
                              </div>
                            ) : govIdDocUrl ? (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                                <span className="text-xs text-muted-foreground truncate max-w-full">{govIdFileName}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-2">
                                <Upload className="h-6 w-6 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">Click to upload photo ID</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-md bg-amber-500/5 border border-amber-500/10">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-600">
                          Your account will be set to pending status after submission. An administrator will review your documents and verify your credentials. All features will be locked until verification is complete.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!specialty || !barNumber || !licenseDocUrl || !govIdDocUrl || registerLawyerMutation.isPending || isUploadingLicense || isUploadingGovId}
                      data-testid="button-submit-verification"
                    >
                      {registerLawyerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting for Verification...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Submit for Verification
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
