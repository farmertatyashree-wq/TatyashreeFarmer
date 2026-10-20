import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message based on language
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        english: "Hello! I'm your farming assistant. Ask me about crops, weather, schemes, or any farming tips! You can also use voice input.",
        hindi: "नमस्ते! मैं आपका कृषि सहायक हूं। फसलों, मौसम, योजनाओं या खेती की किसी भी जानकारी के बारे में पूछें! आप आवाज़ से भी बात कर सकते हैं।",
        marathi: "नमस्कार! मी तुमचा शेती सहाय्यक आहे. पिके, हवामान, योजना किंवा शेतीच्या कोणत्याही माहितीबद्दल विचारा! तुम्ही आवाजाने देखील बोलू शकता."
      };
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessages[language],
        timestamp: new Date()
      }]);
    }
  }, [isOpen, language, messages.length]);

  // Text to Speech function
  const speakText = async (text: string) => {
    if (!autoSpeak || isSpeaking) return;

    try {
      setIsSpeaking(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const data = await response.json();
      
      if (data.audioContent) {
        // Use data URI for audio playback
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceInput(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: language === 'marathi' ? 'रेकॉर्डिंग सुरू' : language === 'hindi' ? 'रिकॉर्डिंग शुरू' : 'Recording started',
        description: language === 'marathi' ? 'बोला...' : language === 'hindi' ? 'बोलिए...' : 'Speak now...',
      });

    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: language === 'marathi' ? 'त्रुटी' : language === 'hindi' ? 'त्रुटि' : 'Error',
        description: language === 'marathi' ? 'माइक्रोफोन परवानगी द्या' : language === 'hindi' ? 'माइक्रोफोन अनुमति दें' : 'Please allow microphone access',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      // Send to voice-to-text API
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio, language }
      });

      if (error) throw error;

      if (data.text) {
        // Set input and send message
        setInput(data.text);
        
        // Send the transcribed text as a message
        await sendMessageWithText(data.text);
      } else {
        toast({
          title: language === 'marathi' ? 'आवाज ओळखला नाही' : language === 'hindi' ? 'आवाज़ पहचाना नहीं' : 'Voice not recognized',
          description: language === 'marathi' ? 'पुन्हा प्रयत्न करा' : language === 'hindi' ? 'फिर से कोशिश करें' : 'Please try again',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: language === 'marathi' ? 'त्रुटी' : language === 'hindi' ? 'त्रुटि' : 'Error',
        description: language === 'marathi' ? 'आवाज प्रक्रिया अयशस्वी' : language === 'hindi' ? 'आवाज़ प्रोसेसिंग विफल' : 'Voice processing failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: text,
          language,
          userId: user?.id
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response
      if (autoSpeak) {
        speakText(data.response);
      }

      // Save to chat logs
      if (user) {
        await supabase.from('chat_logs').insert({
          user_id: user.id,
          message: text,
          response: data.response,
          language
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessages: Record<string, string> = {
        english: "Sorry, I couldn't process your request. Please try again.",
        hindi: "क्षमा करें, मैं आपके अनुरोध को प्रोसेस नहीं कर सका। कृपया पुनः प्रयास करें।",
        marathi: "माफ करा, मी तुमची विनंती प्रक्रिया करू शकलो नाही. कृपया पुन्हा प्रयत्न करा."
      };

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessages[language],
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getLabels = () => {
    if (language === 'marathi') {
      return {
        voiceInput: 'आवाजाने बोला',
        stopRecording: 'थांबा',
        autoSpeakOn: 'आवाज चालू',
        autoSpeakOff: 'आवाज बंद',
      };
    } else if (language === 'hindi') {
      return {
        voiceInput: 'आवाज़ से बोलें',
        stopRecording: 'रुकें',
        autoSpeakOn: 'आवाज़ चालू',
        autoSpeakOff: 'आवाज़ बंद',
      };
    }
    return {
      voiceInput: 'Voice input',
      stopRecording: 'Stop',
      autoSpeakOn: 'Voice on',
      autoSpeakOff: 'Voice off',
    };
  };

  const labels = getLabels();

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-sm transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-hero text-primary-foreground p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{t('chatbot.title')}</CardTitle>
                  <p className="text-xs text-primary-foreground/80">{t('app.tagline')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Auto-speak toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setAutoSpeak(!autoSpeak);
                  }}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                  title={autoSpeak ? labels.autoSpeakOn : labels.autoSpeakOff}
                >
                  {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                {/* Voice input button */}
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  size="icon"
                  variant={isRecording ? "destructive" : "outline"}
                  className="shrink-0"
                  title={isRecording ? labels.stopRecording : labels.voiceInput}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chatbot.placeholder')}
                  className="flex-1"
                  disabled={isLoading || isRecording}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isRecording}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="mt-2 flex items-center justify-center gap-2 text-destructive text-sm">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {language === 'marathi' ? 'रेकॉर्डिंग...' : language === 'hindi' ? 'रिकॉर्डिंग...' : 'Recording...'}
                </div>
              )}
              
              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="mt-2 flex items-center justify-center gap-2 text-primary text-sm">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  {language === 'marathi' ? 'बोलत आहे...' : language === 'hindi' ? 'बोल रहा है...' : 'Speaking...'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChatBot;
