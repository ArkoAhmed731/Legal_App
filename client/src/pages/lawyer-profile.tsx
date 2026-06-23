import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { APP_CONFIG } from "@/lib/app-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  ArrowLeft,
  Calendar as CalendarIcon,
  Globe,
  Briefcase,
  DollarSign,
  Loader2,
} from "lucide-react";
import { TenantLink } from "@/components/tenant-link";
import { format } from "date-fns";

interface LawyerDetail {
  id: number;
  userId: string;
  specialty: string;
  secondarySpecialties: string[] | null;
  barNumber: string | null;
  yearsExperience: number | null;
  hourlyRate: string | null;
  consultationRate: string | null;
  verificationStatus: string;
  jurisdictions: string[] | null;
  languages: string[] | null;
  rating: string | null;
  totalReviews: number | null;
  totalCases: number | null;
  availableDays: string[] | null;
  availableTimeStart: string | null;
  availableTimeEnd: string | null;
  isActive: boolean | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  bio: string | null;
}

export default function LawyerProfilePage({ id }: { id?: string }) {
  const lawyerId = id;
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("30-min-consultation");
  const [notes, setNotes] = useState("");

  const { data: lawyer, isLoading } = useQuery<LawyerDetail>({
    queryKey: ["/api/lawyers", lawyerId],
    enabled: !!lawyerId,
  });

  const bookAppointment = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) throw new Error("Select date and time");
      const scheduledDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      scheduledDate.setHours(hours, minutes);
      const res = await apiRequest("POST", "/api/appointments", {
        professionalId: Number(lawyerId),
        serviceType: selectedService,
        scheduledDate: scheduledDate.toISOString(),
        durationMinutes: selectedService === "60-min-consultation" ? 60 : 30,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking Confirmed", description: "Your appointment has been booked successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Booking Failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="p-6 text-center py-16">
        <p className="text-muted-foreground">{APP_CONFIG.professionalLabel} not found</p>
        <TenantLink href="/lawyers"><Button variant="outline" className="mt-4" data-testid="button-back-not-found">Back to Directory</Button></TenantLink>
      </div>
    );
  }

  const timeSlots: string[] = [];
  const startHour = parseInt(lawyer.availableTimeStart?.split(":")[0] || "9");
  const endHour = parseInt(lawyer.availableTimeEnd?.split(":")[0] || "17");
  for (let h = startHour; h < endHour; h++) {
    timeSlots.push(`${h.toString().padStart(2, "0")}:00`);
    timeSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <TenantLink href="/lawyers">
        <Button variant="ghost" size="sm" data-testid="button-back-lawyers">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Directory
        </Button>
      </TenantLink>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={lawyer.profileImageUrl || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                    {(lawyer.firstName || "L")[0]}{(lawyer.lastName || "")[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-xl font-bold" data-testid="text-lawyer-name">
                      {lawyer.firstName} {lawyer.lastName}
                    </h1>
                    {lawyer.verificationStatus === "verified" && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <BadgeCheck className="h-3 w-3 mr-1" />Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{lawyer.specialty}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{parseFloat(lawyer.rating || "0").toFixed(1)}</span>
                      <span className="text-muted-foreground">({lawyer.totalReviews || 0} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {lawyer.yearsExperience || 0} years
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {lawyer.totalCases || 0} cases
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {lawyer.bio && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{lawyer.bio}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />Jurisdictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lawyer.jurisdictions?.map((j: string) => (
                    <Badge key={j} variant="secondary" className="text-xs">{j}</Badge>
                  )) || <p className="text-xs text-muted-foreground">Not specified</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lawyer.languages?.map((l: string) => (
                    <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                  )) || <Badge variant="secondary" className="text-xs">English</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">30-min Consultation</p>
                  <p className="text-2xl font-bold">${lawyer.consultationRate || "75.00"}</p>
                </div>
                <div className="p-4 rounded-md bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  <p className="text-2xl font-bold">${lawyer.hourlyRate || "150.00"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />Book Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger data-testid="select-service-type">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-min-consultation">30-min Consultation (${lawyer.consultationRate || "75.00"})</SelectItem>
                  <SelectItem value="60-min-consultation">60-min Consultation (${lawyer.hourlyRate || "150.00"})</SelectItem>
                </SelectContent>
              </Select>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const dayName = format(date, "EEEE");
                  return date < new Date() || !(lawyer.availableDays || []).includes(dayName);
                }}
                className="rounded-md border"
                data-testid="calendar-booking"
              />

              {selectedDate && (
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger data-testid="select-time">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Textarea
                placeholder={`Any notes for the ${APP_CONFIG.professionalLabel.toLowerCase()}... (optional)`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none text-sm"
                rows={3}
                data-testid="input-booking-notes"
              />

              <Button
                className="w-full"
                disabled={!selectedDate || !selectedTime || bookAppointment.isPending}
                onClick={() => bookAppointment.mutate()}
                data-testid="button-book-appointment"
              >
                {bookAppointment.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Availability</p>
                  <p className="text-xs text-muted-foreground">
                    {lawyer.availableTimeStart || "09:00"} - {lawyer.availableTimeEnd || "17:00"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(lawyer.availableDays || []).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
