/**
 * AI CFO Copilot Component
 * Natural language query interface for financial insights
 */

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Bot,
  User,
} from "lucide-react";

interface DataPoint {
  label: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
}

interface CopilotResponse {
  query: string;
  queryType: string;
  answer: string;
  insights: string[];
  recommendations: string[];
  dataPoints: DataPoint[];
  confidence: number;
  processingTime: number;
  sources: string[];
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  response?: CopilotResponse;
  timestamp: Date;
}

const suggestedQuestions = [
  "Why did profit drop this month?",
  "What are my top expenses?",
  "How is my cash flow trending?",
  "Any unusual transactions?",
  "What should I focus on to improve margins?",
  "Compare this month to last month",
];

export const AICFOCopilot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/copilot/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ query: input }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}`,
          type: "assistant",
          content: data.data.answer,
          response: data.data,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `msg_${Date.now()}`,
          type: "assistant",
          content:
            data.error || "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        type: "assistant",
        content:
          "Sorry, I could not connect to the server. Please check your connection.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const renderDataPoint = (dataPoint: DataPoint) => {
    const TrendIcon =
      dataPoint.trend === "up"
        ? TrendingUp
        : dataPoint.trend === "down"
          ? TrendingDown
          : null;
    const trendColor =
      dataPoint.trend === "up"
        ? "text-green-500"
        : dataPoint.trend === "down"
          ? "text-red-500"
          : "text-gray-500";

    return (
      <div
        key={dataPoint.label}
        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
      >
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {dataPoint.label}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {typeof dataPoint.value === "number"
              ? `$${dataPoint.value.toLocaleString()}`
              : dataPoint.value}
          </span>
          {TrendIcon && (
            <span className={`flex items-center text-sm ${trendColor}`}>
              <TrendIcon className="w-4 h-4 mr-1" />
              {dataPoint.changePercent?.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    if (message.type === "user") {
      return (
        <div key={message.id} className="flex justify-end mb-4">
          <div className="flex items-start gap-2 max-w-[80%]">
            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2">
              <p>{message.content}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className="flex justify-start mb-4">
        <div className="flex items-start gap-2 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <p className="text-gray-800 dark:text-gray-200">
                {message.content}
              </p>
            </div>

            {message.response && (
              <>
                {message.response.dataPoints.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {message.response.dataPoints.map(renderDataPoint)}
                  </div>
                )}

                {message.response.insights.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium mb-2">
                      <Lightbulb className="w-4 h-4" />
                      Key Insights
                    </div>
                    <ul className="space-y-1">
                      {message.response.insights.map((insight, i) => (
                        <li
                          key={i}
                          className="text-sm text-blue-600 dark:text-blue-300 flex items-start gap-2"
                        >
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.response.recommendations.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Recommendations
                    </div>
                    <ul className="space-y-1">
                      {message.response.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="text-sm text-amber-600 dark:text-amber-300 flex items-start gap-2"
                        >
                          <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    Confidence: {(message.response.confidence * 100).toFixed(0)}
                    %
                  </span>
                  <span>•</span>
                  <span>{message.response.processingTime.toFixed(0)}ms</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${isExpanded ? "h-[600px]" : "h-auto"}`}
    >
      {/* Header */}
      <div
        className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI CFO Copilot</h3>
              <p className="text-white/70 text-sm">
                Ask anything about your finances
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white">
              Powered by AI
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Messages */}
          <div className="h-[380px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  How can I help you today?
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">
                  Ask me anything about your financial data. I can analyze
                  trends, explain changes, and provide recommendations.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedQuestions.slice(0, 4).map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(renderMessage)}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-purple-500 animate-spin" />
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Analyzing your data...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about your finances..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AICFOCopilot;
