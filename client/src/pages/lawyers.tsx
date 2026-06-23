import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Filter,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";

interface LawyerWithUser {
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

const tenantNavigate = (path: string) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export default function LawyersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [sortBy, setSortBy] = useState("rating");
  const specialties = APP_CONFIG.specialties;

  const { data: lawyers, isLoading } = useQuery<LawyerWithUser[]>({
    queryKey: ["/api/lawyers"],
  });

  const filtered = lawyers
    ?.filter((l) => {
      const matchesSearch =
        !searchTerm ||
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.specialty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty =
        selectedSpecialty === "All Specialties" || l.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      if (sortBy === "price") return parseFloat(a.consultationRate || "0") - parseFloat(b.consultationRate || "0");
      if (sortBy === "experience") return (b.yearsExperience || 0) - (a.yearsExperience || 0);
      return 0;
    });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold" data-testid="text-lawyers-title">
          {APP_CONFIG.findProfessionalTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {APP_CONFIG.findProfessionalSubtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={APP_CONFIG.searchProfessionalPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-lawyers"
          />
        </div>
        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="w-[200px]" data-testid="select-specialty">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]" data-testid="select-sort">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="price">Lowest Price</SelectItem>
            <SelectItem value="experience">Most Experienced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">No {APP_CONFIG.professionalLabelPlural.toLowerCase()} found matching your criteria</p>
          <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setSelectedSpecialty("All Specialties"); }} data-testid="button-clear-filters">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((lawyer) => (
            <Card
              key={lawyer.id}
              className="hover-elevate transition-all duration-200 cursor-pointer"
              onClick={() => tenantNavigate(`/lawyers/${lawyer.id}`)}
              data-testid={`card-lawyer-${lawyer.id}`}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lawyer.profileImageUrl || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {(lawyer.firstName || "L")[0]}{(lawyer.lastName || "")[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-medium text-sm truncate">
                        {lawyer.firstName} {lawyer.lastName}
                      </h3>
                      {lawyer.verificationStatus === "verified" && (
                        <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{lawyer.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium">
                        {parseFloat(lawyer.rating || "0").toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({lawyer.totalReviews || 0})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {lawyer.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{lawyer.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {lawyer.jurisdictions?.slice(0, 2).map((j) => (
                      <Badge key={j} variant="secondary" className="text-[10px]">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />{j}
                      </Badge>
                    ))}
                    {lawyer.yearsExperience && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />{lawyer.yearsExperience}yr
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div>
                    <span className="text-lg font-bold">${lawyer.consultationRate}</span>
                    <span className="text-xs text-muted-foreground">/consult</span>
                  </div>
                  <span className="inline-flex items-center text-sm font-medium text-accent">
                    View Profile <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
