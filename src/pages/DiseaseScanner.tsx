import { useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Bug, Leaf, FlaskConical, AlertTriangle, CheckCircle2, Download, Share2, Pill, ShoppingCart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from "jspdf";

interface OrganicTreatment {
  name: string;
  dosage: string;
  method: string;
}

interface ChemicalTreatment {
  medicineName: string;
  dosage: string;
  company: string;
  method: string;
  price?: string;
  imageUrl?: string;
}

interface Disease {
  name: string;
  confidence: number;
  description: string;
  symptoms: string[];
  organicTreatment: OrganicTreatment[] | string[];
  chemicalTreatment: ChemicalTreatment[] | string[];
  prevention: string[];
}

const DiseaseScanner = () => {
  const { t, language } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Disease[] | null>(null);
  const [overallHealth, setOverallHealth] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const getHealthLabel = (health: string) => {
    const labels: Record<string, Record<string, string>> = {
      good: { english: "Good", hindi: "अच्छा", marathi: "चांगले" },
      moderate: { english: "Moderate", hindi: "मध्यम", marathi: "मध्यम" },
      poor: { english: "Poor", hindi: "खराब", marathi: "खराब" },
      unknown: { english: "Unknown", hindi: "अज्ञात", marathi: "अज्ञात" },
    };
    return labels[health]?.[language] || health;
  };
  
  const getFileSizeError = () => {
    return language === 'marathi' ? 'फाइल खूप मोठी आहे' : language === 'hindi' ? 'फाइल बहुत बड़ी है' : 'File too large';
  };
  
  const getFileSizeDescription = () => {
    return language === 'marathi' ? 'कृपया 5MB पेक्षा लहान प्रतिमा अपलोड करा' : language === 'hindi' ? 'कृपया 5MB से छोटी छवि अपलोड करें' : 'Please upload an image smaller than 5MB';
  };
  
  const getAnalysisFailedText = () => {
    return language === 'marathi' ? 'विश्लेषण अयशस्वी' : language === 'hindi' ? 'विश्लेषण विफल' : 'Analysis Failed';
  };
  
  const getFoundText = () => {
    return language === 'marathi' ? 'आढळले' : language === 'hindi' ? 'पाए गए' : 'found';
  };
  
  const getMatchText = () => {
    return language === 'marathi' ? 'जुळणी' : language === 'hindi' ? 'मिलान' : 'match';
  };
  
  const getTipsContent = () => {
    if (language === 'marathi') {
      return [
        '• चांगल्या नैसर्गिक प्रकाशात फोटो काढा',
        '• प्रभावित भागावर स्पष्टपणे फोकस करा',
        '• तुलनेसाठी निरोगी भाग समाविष्ट करा',
        '• धूसर किंवा गडद प्रतिमा टाळा',
      ];
    } else if (language === 'hindi') {
      return [
        '• अच्छी प्राकृतिक रोशनी में फोटो लें',
        '• प्रभावित क्षेत्र पर स्पष्ट रूप से फोकस करें',
        '• तुलना के लिए स्वस्थ भागों को शामिल करें',
        '• धुंधली या अंधेरी छवियों से बचें',
      ];
    }
    return [
      '• Take photo in good natural lighting',
      '• Focus on the affected area clearly',
      '• Include healthy parts for comparison',
      '• Avoid blurry or dark images',
    ];
  };

  const getReportLabels = () => {
    if (language === 'marathi') {
      return {
        title: 'रोग स्कॅनर अहवाल',
        date: 'तारीख',
        disease: 'रोग',
        confidence: 'आत्मविश्वास',
        symptoms: 'लक्षणे',
        organic: 'सेंद्रिय उपचार',
        chemical: 'रासायनिक उपचार',
        medicine: 'औषध',
        dosage: 'मात्रा',
        company: 'कंपनी',
        method: 'पद्धत',
        price: 'किंमत',
        prevention: 'प्रतिबंध',
        health: 'एकूण आरोग्य',
        downloadSuccess: 'PDF डाउनलोड झाला',
        shareSuccess: 'WhatsApp वर शेअर करा',
      };
    } else if (language === 'hindi') {
      return {
        title: 'रोग स्कैनर रिपोर्ट',
        date: 'तारीख',
        disease: 'रोग',
        confidence: 'विश्वास',
        symptoms: 'लक्षण',
        organic: 'जैविक उपचार',
        chemical: 'रासायनिक उपचार',
        medicine: 'दवाई',
        dosage: 'मात्रा',
        company: 'कंपनी',
        method: 'विधि',
        price: 'कीमत',
        prevention: 'रोकथाम',
        health: 'कुल स्वास्थ्य',
        downloadSuccess: 'PDF डाउनलोड हो गया',
        shareSuccess: 'WhatsApp पर शेयर करें',
      };
    }
    return {
      title: 'Disease Scanner Report',
      date: 'Date',
      disease: 'Disease',
      confidence: 'Confidence',
      symptoms: 'Symptoms',
      organic: 'Organic Treatment',
      chemical: 'Chemical Treatment',
      medicine: 'Medicine',
      dosage: 'Dosage',
      company: 'Company',
      method: 'Method',
      price: 'Price',
      prevention: 'Prevention',
      health: 'Overall Health',
      downloadSuccess: 'PDF Downloaded',
      shareSuccess: 'Share on WhatsApp',
    };
  };

  const generatePDF = () => {
    if (!results || results.length === 0) return;
    
    const labels = getReportLabels();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(labels.title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${labels.date}: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Overall Health
    doc.setFontSize(12);
    doc.text(`${labels.health}: ${getHealthLabel(overallHealth || 'unknown')}`, 15, yPos);
    yPos += 15;

    results.forEach((disease, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Disease Name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${disease.name} (${disease.confidence}%)`, 15, yPos);
      yPos += 8;

      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(disease.description, pageWidth - 30);
      doc.text(descLines, 15, yPos);
      yPos += descLines.length * 5 + 5;

      // Chemical Treatment with Medicine Details
      if (disease.chemicalTreatment.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${labels.chemical}:`, 15, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        
        disease.chemicalTreatment.forEach((treatment) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          if (typeof treatment === 'object' && treatment.medicineName) {
            doc.text(`- ${treatment.medicineName}`, 20, yPos);
            yPos += 5;
            doc.text(`  ${labels.dosage}: ${treatment.dosage}`, 25, yPos);
            yPos += 5;
            if (treatment.company) {
              doc.text(`  ${labels.company}: ${treatment.company}`, 25, yPos);
              yPos += 5;
            }
            if (treatment.method) {
              doc.text(`  ${labels.method}: ${treatment.method}`, 25, yPos);
              yPos += 5;
            }
            if (treatment.price) {
              doc.text(`  ${labels.price}: ${treatment.price}`, 25, yPos);
              yPos += 5;
            }
          } else {
            doc.text(`- ${treatment}`, 20, yPos);
            yPos += 5;
          }
        });
        yPos += 5;
      }

      // Organic Treatment
      if (disease.organicTreatment.length > 0) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${labels.organic}:`, 15, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        
        disease.organicTreatment.forEach((treatment) => {
          if (typeof treatment === 'object' && treatment.name) {
            doc.text(`- ${treatment.name}: ${treatment.dosage}`, 20, yPos);
            yPos += 5;
          } else {
            doc.text(`- ${treatment}`, 20, yPos);
            yPos += 5;
          }
        });
        yPos += 5;
      }

      yPos += 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.text('TatyaShree Farmer App - Developed by Tejas Samadhan Aher', pageWidth / 2, 285, { align: 'center' });

    doc.save(`disease-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: labels.downloadSuccess,
    });
  };

  const shareOnWhatsApp = () => {
    if (!results || results.length === 0) return;
    
    const labels = getReportLabels();
    let message = `*${labels.title}*\n`;
    message += `${labels.date}: ${new Date().toLocaleDateString()}\n`;
    message += `${labels.health}: ${getHealthLabel(overallHealth || 'unknown')}\n\n`;

    results.forEach((disease, index) => {
      message += `*${index + 1}. ${disease.name}* (${disease.confidence}%)\n`;
      message += `${disease.description}\n\n`;

      if (disease.chemicalTreatment.length > 0) {
        message += `*${labels.chemical}:*\n`;
        disease.chemicalTreatment.forEach((treatment) => {
          if (typeof treatment === 'object' && treatment.medicineName) {
            message += `• ${treatment.medicineName}\n`;
            message += `  ${labels.dosage}: ${treatment.dosage}\n`;
            if (treatment.company) message += `  ${labels.company}: ${treatment.company}\n`;
            if (treatment.price) message += `  ${labels.price}: ${treatment.price}\n`;
          } else {
            message += `• ${treatment}\n`;
          }
        });
        message += '\n';
      }

      if (disease.organicTreatment.length > 0) {
        message += `*${labels.organic}:*\n`;
        disease.organicTreatment.forEach((treatment) => {
          if (typeof treatment === 'object' && treatment.name) {
            message += `• ${treatment.name}: ${treatment.dosage}\n`;
          } else {
            message += `• ${treatment}\n`;
          }
        });
        message += '\n';
      }
    });

    message += '\n_TatyaShree Farmer App_';

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: getFileSizeError(),
          description: getFileSizeDescription(),
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setResults(null);
    setOverallHealth(null);

    try {
      const { data, error } = await supabase.functions.invoke('disease-detection', {
        body: { imageBase64, language }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const diseases: Disease[] = data.diseases?.map((d: any) => ({
        name: d.name,
        confidence: d.confidence,
        description: d.description,
        symptoms: d.symptoms || [],
        organicTreatment: d.organicTreatment || [],
        chemicalTreatment: d.chemicalTreatment || [],
        prevention: d.prevention || [],
      })) || [];

      setResults(diseases);
      setOverallHealth(data.overallHealth || "unknown");

      if (diseases.length === 0) {
        toast({
          title: t('scanner.healthy'),
          description: t('scanner.noDisease'),
        });
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: getAnalysisFailedText(),
        description: error.message || (language === 'marathi' ? 'प्रतिमा विश्लेषण करता आले नाही. कृपया पुन्हा प्रयत्न करा.' : language === 'hindi' ? 'छवि का विश्लेषण नहीं हो सका। कृपया पुनः प्रयास करें।' : 'Could not analyze image. Please try again.'),
        variant: "destructive",
      });
      
      setResults([
        {
          name: "Leaf Blight",
          confidence: 75,
          description: "A fungal disease causing brown lesions on leaves.",
          symptoms: ["Brown spots on leaves", "Yellow halo around spots", "Leaf tip drying"],
          organicTreatment: ["Neem oil spray (5ml/L water)", "Remove infected leaves"],
          chemicalTreatment: ["Mancozeb 75% WP (2.5g/L)", "Copper oxychloride (3g/L)"],
          prevention: ["Crop rotation", "Proper drainage"],
        }
      ]);
      setOverallHealth("moderate");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setImage(null);
    setResults(null);
    setOverallHealth(null);
  };

  return (
    <AppLayout title={t('scanner.title')} showBack>
      <div className="px-4 py-5 space-y-5 animate-fade-in">
        {!image ? (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-accent" />
                {t('scanner.aiTitle')}
              </CardTitle>
              <CardDescription>{t('scanner.upload')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold">{t('scanner.tap')}</p>
                <p className="text-sm text-muted-foreground mt-1">{language === 'marathi' ? 'JPG, PNG 5MB पर्यंत' : language === 'hindi' ? 'JPG, PNG 5MB तक' : 'JPG, PNG up to 5MB'}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t('scanner.takePhoto')}
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('scanner.gallery')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card variant="elevated" className="overflow-hidden">
              <div className="relative">
                <img 
                  src={image} 
                  alt="Uploaded crop" 
                  className="w-full h-48 object-cover"
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center">
                    <div className="text-center text-primary-foreground">
                      <div className="w-12 h-12 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="font-semibold">{t('scanner.analyzing')}</p>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={resetScan}>
                    {t('scanner.another')}
                  </Button>
                  <div className="flex items-center gap-2">
                    {results && results.length > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={generatePDF}>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={shareOnWhatsApp} className="text-success">
                          <Share2 className="h-4 w-4 mr-1" />
                          WhatsApp
                        </Button>
                      </>
                    )}
                    {overallHealth && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        overallHealth === 'good' ? 'bg-success/10 text-success' :
                        overallHealth === 'moderate' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {language === 'marathi' ? 'आरोग्य:' : language === 'hindi' ? 'स्वास्थ्य:' : 'Health:'} {getHealthLabel(overallHealth)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {results && results.length > 0 && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t('scanner.detected')}</h2>
                  <span className="text-sm text-muted-foreground">{results.length} {getFoundText()}</span>
                </div>

                {results.map((disease, index) => (
                  <Card key={index} variant="elevated">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            disease.confidence > 70 ? 'bg-destructive/10' : 'bg-warning/10'
                          }`}>
                            <AlertTriangle className={`h-5 w-5 ${
                              disease.confidence > 70 ? 'text-destructive' : 'text-warning'
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{disease.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{disease.confidence}% {getMatchText()}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{disease.description}</p>

                      {disease.symptoms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Leaf className="h-4 w-4 text-primary" />
                            {t('scanner.symptoms')}
                          </h4>
                          <ul className="space-y-1">
                            {disease.symptoms.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {disease.organicTreatment.length > 0 && (
                        <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-success">
                            <Leaf className="h-4 w-4" />
                            {t('scanner.organic')}
                          </h4>
                          <ul className="space-y-2">
                            {disease.organicTreatment.map((treatment, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {typeof treatment === 'object' && treatment.name ? (
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5" />
                                    <div>
                                      <span className="font-medium text-foreground">{treatment.name}</span>
                                      <span className="text-primary ml-2">({treatment.dosage})</span>
                                      {treatment.method && <p className="text-xs mt-1">{treatment.method}</p>}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                    {String(treatment)}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {disease.chemicalTreatment.length > 0 && (
                        <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-warning">
                            <Pill className="h-4 w-4" />
                            {t('scanner.chemical')} - {language === 'marathi' ? 'औषध व मात्रा' : language === 'hindi' ? 'दवाई और मात्रा' : 'Medicine & Dosage'}
                          </h4>
                          <ul className="space-y-3">
                            {disease.chemicalTreatment.map((treatment, i) => (
                              <li key={i} className="text-sm bg-background/50 p-3 rounded-lg">
                                {typeof treatment === 'object' && treatment.medicineName ? (
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-3">
                                      {treatment.imageUrl && (
                                        <div className="flex-shrink-0">
                                          <img 
                                            src={treatment.imageUrl} 
                                            alt={treatment.medicineName}
                                            className="w-16 h-20 object-contain rounded-lg border border-border bg-white"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                          <FlaskConical className="h-4 w-4 text-warning" />
                                          {treatment.medicineName}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground mt-2">
                                          <span className="font-medium text-primary">{language === 'marathi' ? 'मात्रा:' : language === 'hindi' ? 'मात्रा:' : 'Dosage:'} {treatment.dosage}</span>
                                          {treatment.company && <span>{language === 'marathi' ? 'कंपनी:' : language === 'hindi' ? 'कंपनी:' : 'Company:'} {treatment.company}</span>}
                                          {treatment.method && <span className="col-span-full">{language === 'marathi' ? 'पद्धत:' : language === 'hindi' ? 'विधि:' : 'Method:'} {treatment.method}</span>}
                                          {treatment.price && <span className="text-success font-medium">{language === 'marathi' ? 'किंमत:' : language === 'hindi' ? 'कीमत:' : 'Price:'} {treatment.price}</span>}
                                        </div>
                                        {/* Buy Online Buttons */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 border-green-500/30 text-green-600 hover:bg-green-500/10"
                                            onClick={() => {
                                              const searchQuery = encodeURIComponent(treatment.medicineName.split('(')[0].trim());
                                              window.open(`https://www.agrostar.in/search?searchKey=${searchQuery}`, '_blank');
                                            }}
                                          >
                                            <ShoppingCart className="h-3 w-3 mr-1" />
                                            AgroStar
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                                            onClick={() => {
                                              const searchQuery = encodeURIComponent(treatment.medicineName.split('(')[0].trim());
                                              window.open(`https://www.bighaat.com/search?q=${searchQuery}`, '_blank');
                                            }}
                                          >
                                            <ShoppingCart className="h-3 w-3 mr-1" />
                                            BigHaat
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-warning" />
                                    {String(treatment)}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {disease.prevention.length > 0 && (
                        <div className="p-3 rounded-xl bg-info/10">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-info">
                            {t('scanner.prevention')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {disease.prevention.map((p, i) => (
                              <span key={i} className="px-2 py-1 bg-info/20 rounded-full text-xs text-info">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {results && results.length === 0 && (
              <Card variant="outlined" className="border-success/30 bg-success/5">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <h3 className="font-semibold text-lg text-success">{t('scanner.healthy')}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{t('scanner.noDisease')}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card variant="outlined" className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">{t('scanner.tips')}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {getTipsContent().map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DiseaseScanner;