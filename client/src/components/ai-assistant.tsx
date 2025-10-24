import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AIAssistantProps {
  userLocation?: { latitude: number; longitude: number };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant({ userLocation }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");

  const askAIMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/ask", {
        message,
        userLocation,
      });
      return response;
    },
    onSuccess: (data: { response: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: (error: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!inputMessage.trim() || askAIMutation.isPending) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    askAIMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What are the best locations to recruit in my area?",
    "When is the best time to visit local schools?",
    "What events should I target for recruiting?",
    "How do I approach community centers?",
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* AI Assistant Dialog */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">AI Recruiting Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground mb-4">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Hi! I'm your AI recruiting assistant. Ask me about:
                  </p>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputMessage(question);
                      }}
                      className="w-full text-left p-3 text-sm border rounded-lg hover:bg-accent transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {askAIMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">
                          Thinking...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about recruiting locations..."
                disabled={askAIMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputMessage.trim() || askAIMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Powered by Hugging Face 🤗 (Free Forever)
            </p>
          </div>
        </Card>
      )}
    </>
  );
}
