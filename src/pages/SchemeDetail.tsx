import { useState } from "react";
import { useParams, Link } from "@/lib/router-compat";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  BookmarkPlus,
  ClipboardCheck,
  IndianRupee,
  Calendar,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SchemeData {
  id: string;
  name: string;
  fullDescription: string;
  benefit: string;
  benefitDetails: string;
  targetGroup: string;
  fundingAgency: string;
  documents: string[];
  applyMethod: string;
  officialLink: string;
  eligibilityQuestions: {
    question: string;
    options: { label: string; points: number }[];
  }[];
}

const schemeDatabase: Record<string, SchemeData> = {
  "pm-kisan": {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    fullDescription: "Pradhan Mantri Kisan Samman Nidhi is a Central Sector scheme with 100% funding from Government of India. It provides income support of ₹6,000 per year to all landholding farmer families across the country in three equal installments of ₹2,000 each, every four months.",
    benefit: "₹6,000/year",
    benefitDetails: "Paid in 3 installments of ₹2,000 every 4 months directly to bank account",
    targetGroup: "Small and Marginal Farmers",
    fundingAgency: "Ministry of Agriculture & Farmers Welfare",
    documents: [
      "Aadhaar Card",
      "Land ownership documents (Khata/Patta)",
      "Bank account with IFSC code",
      "Passport size photograph"
    ],
    applyMethod: "Online through PM-KISAN portal or at Common Service Centers (CSC)",
    officialLink: "https://pmkisan.gov.in",
    eligibilityQuestions: [
      {
        question: "Do you have agricultural land in your name or family's name?",
        options: [
          { label: "Yes, land is in my name", points: 30 },
          { label: "Yes, land is in family's name", points: 25 },
          { label: "No land ownership", points: 0 }
        ]
      },
      {
        question: "What is your total land holding?",
        options: [
          { label: "Less than 2 hectares", points: 30 },
          { label: "2-5 hectares", points: 20 },
          { label: "More than 5 hectares", points: 10 }
        ]
      },
      {
        question: "Do you have a valid Aadhaar card?",
        options: [
          { label: "Yes, Aadhaar linked to bank", points: 25 },
          { label: "Yes, but not linked to bank", points: 15 },
          { label: "No Aadhaar card", points: 0 }
        ]
      },
      {
        question: "Are you or your family receiving income tax?",
        options: [
          { label: "No, not an income tax payer", points: 15 },
          { label: "Yes, I pay income tax", points: 0 }
        ]
      }
    ]
  },
  "pmfby": {
    id: "pmfby",
    name: "PM Fasal Bima Yojana",
    fullDescription: "Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance coverage against non-preventable natural risks from pre-sowing to post-harvest. It aims to stabilize farmers' income and encourage adoption of modern agricultural practices.",
    benefit: "Up to ₹2 lakh coverage",
    benefitDetails: "Premium: 1.5-2% for Rabi, 2% for Kharif crops. Government pays remaining premium",
    targetGroup: "All farmers growing notified crops",
    fundingAgency: "Ministry of Agriculture & Farmers Welfare",
    documents: [
      "Land records / Tenant farmer certificate",
      "Bank account details",
      "Sowing certificate",
      "Aadhaar Card"
    ],
    applyMethod: "Through banks, CSC, or PMFBY portal before crop sowing deadline",
    officialLink: "https://pmfby.gov.in",
    eligibilityQuestions: [
      {
        question: "Are you growing any notified crop this season?",
        options: [
          { label: "Yes, notified crop", points: 35 },
          { label: "Not sure", points: 15 },
          { label: "Non-notified crop", points: 0 }
        ]
      },
      {
        question: "Do you have land records or tenant certificate?",
        options: [
          { label: "Yes, complete records", points: 35 },
          { label: "Partial records", points: 20 },
          { label: "No records", points: 0 }
        ]
      },
      {
        question: "Have you taken crop loan from bank?",
        options: [
          { label: "Yes (mandatory enrollment)", points: 30 },
          { label: "No (voluntary enrollment)", points: 25 }
        ]
      }
    ]
  }
};

const SchemeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showEligibility, setShowEligibility] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [eligibilityScore, setEligibilityScore] = useState<number | null>(null);

  const scheme = schemeDatabase[id || ""] || schemeDatabase["pm-kisan"];

  const calculateEligibility = () => {
    const totalPoints = Object.values(answers).reduce((sum, points) => sum + points, 0);
    const maxPoints = scheme.eligibilityQuestions.reduce(
      (sum, q) => sum + Math.max(...q.options.map(o => o.points)), 0
    );
    const score = Math.round((totalPoints / maxPoints) * 100);
    setEligibilityScore(score);
  };

  const handleSaveScheme = () => {
    toast({
      title: "Scheme Saved!",
      description: "Added to My Schemes for tracking",
    });
  };

  return (
    <AppLayout title={scheme.name} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {/* Header Card */}
        <Card variant="elevated" className="bg-gradient-hero text-primary-foreground">
          <CardContent className="p-5">
            <span className="inline-block px-2 py-1 bg-primary-foreground/20 rounded-full text-xs mb-3">
              {scheme.fundingAgency}
            </span>
            <h1 className="text-xl font-bold">{scheme.name}</h1>
            <div className="flex items-center gap-2 mt-3">
              <IndianRupee className="h-5 w-5" />
              <span className="text-2xl font-bold">{scheme.benefit}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="outlined">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Target Group</p>
              <p className="text-sm font-medium mt-1">{scheme.targetGroup}</p>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto text-warning mb-2" />
              <p className="text-xs text-muted-foreground">Apply Method</p>
              <p className="text-sm font-medium mt-1">Online / CSC</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">About This Scheme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{scheme.fullDescription}</p>
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <p className="font-semibold text-sm text-success">Benefit Details</p>
              <p className="text-sm text-muted-foreground mt-1">{scheme.benefitDetails}</p>
            </div>
          </CardContent>
        </Card>

        {/* Required Documents */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {scheme.documents.map((doc, index) => (
                <li key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-sm">{doc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Eligibility Checker */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-info" />
              Check Your Eligibility
            </CardTitle>
            <CardDescription>Answer a few questions to know your eligibility</CardDescription>
          </CardHeader>
          <CardContent>
            {!showEligibility ? (
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => setShowEligibility(true)}
              >
                Start Eligibility Check
              </Button>
            ) : eligibilityScore === null ? (
              <div className="space-y-6">
                {scheme.eligibilityQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="space-y-3">
                    <p className="font-medium text-sm">{qIndex + 1}. {q.question}</p>
                    <RadioGroup
                      onValueChange={(value) => setAnswers(prev => ({
                        ...prev,
                        [qIndex]: parseInt(value)
                      }))}
                    >
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                          <RadioGroupItem value={option.points.toString()} id={`q${qIndex}-o${oIndex}`} />
                          <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-1 cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                <Button 
                  variant="hero" 
                  className="w-full"
                  onClick={calculateEligibility}
                  disabled={Object.keys(answers).length < scheme.eligibilityQuestions.length}
                >
                  Calculate Eligibility Score
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your Eligibility Score</p>
                  <div className={`text-5xl font-bold ${
                    eligibilityScore >= 70 ? 'text-success' : 
                    eligibilityScore >= 40 ? 'text-warning' : 'text-destructive'
                  }`}>
                    {eligibilityScore}%
                  </div>
                </div>
                <Progress value={eligibilityScore} className="h-3" />
                <div className={`p-4 rounded-xl ${
                  eligibilityScore >= 70 ? 'bg-success/10 border border-success/20' : 
                  eligibilityScore >= 40 ? 'bg-warning/10 border border-warning/20' : 
                  'bg-destructive/10 border border-destructive/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {eligibilityScore >= 70 ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className={`h-5 w-5 ${eligibilityScore >= 40 ? 'text-warning' : 'text-destructive'}`} />
                    )}
                    <span className="font-semibold">
                      {eligibilityScore >= 70 ? 'You are likely eligible!' : 
                       eligibilityScore >= 40 ? 'Partial eligibility' : 'May not be eligible'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {eligibilityScore >= 70 
                      ? 'Based on your answers, you meet most requirements. Proceed to apply.'
                      : eligibilityScore >= 40
                      ? 'You may qualify with additional documentation. Contact your local agriculture office.'
                      : 'Some criteria are not met. Check other available schemes.'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEligibilityScore(null);
                    setAnswers({});
                  }}
                >
                  Retake Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleSaveScheme}>
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Save Scheme
          </Button>
          <Button variant="hero" className="flex-1" asChild>
            <a href={scheme.officialLink} target="_blank" rel="noopener noreferrer">
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SchemeDetail;
