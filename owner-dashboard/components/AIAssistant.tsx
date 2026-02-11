/**
 * AI Assistant Component
 * Predictive analytics, recommendations, and chat interface
 */

import React, { useState } from 'react';
import { Bot, Sparkles, TrendingUp, TrendingDown, AlertCircle, Send, MessageSquare, Lightbulb, Zap } from 'lucide-react';
import { Card, Button } from './common';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello CEO! I\'m your AI business assistant. I can help you analyze trends, predict revenue, and suggest optimizations. What would you like to know?',
      timestamp: '2:30 PM'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestions = [
    'Predict next month revenue',
    'Identify churn risks',
    'Optimize pricing strategy',
    'Analyze growth trends'
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(input),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): string => {
    const lower = query.toLowerCase();
    if (lower.includes('revenue') || lower.includes('predict')) {
      return 'Based on current trends, I predict $9,850 MRR for next month (+15.6%). Key drivers: 3 new Enterprise customers, reduced churn rate. Would you like a detailed breakdown?';
    }
    if (lower.includes('churn')) {
      return 'I\'ve identified 2 customers at high churn risk: Consulting LLC (payment overdue) and Startup Inc (low engagement). Recommended action: Trigger retention workflow for both.';
    }
    if (lower.includes('price') || lower.includes('pricing')) {
      return 'Market analysis suggests you could increase Professional plan by 10% without significant churn. Expected impact: +$320 MRR. Shall I prepare an A/B test proposal?';
    }
    return 'I can help analyze your business metrics, predict trends, identify risks, and suggest optimizations. Try asking about revenue predictions, churn analysis, or pricing optimization.';
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Revenue Prediction</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">$9,850</p>
              <p className="text-sm text-blue-600">+15.6% next month</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-900">Churn Alert</p>
              <p className="text-2xl font-bold text-red-700 mt-1">2 at risk</p>
              <p className="text-sm text-red-600">Action recommended</p>
            </div>
          </div>
        </Card>

        <Card className="!p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-900">Opportunity</p>
              <p className="text-2xl font-bold text-green-700 mt-1">+10% price</p>
              <p className="text-sm text-green-600">$320 MRR potential</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card title="AI Business Assistant" className="h-[500px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.type === 'user' ? 'bg-blue-600' : 'bg-purple-600'
              }`}>
                {msg.type === 'user' ? (
                  <span className="text-white text-sm font-semibold">CEO</span>
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <span className={`text-xs mt-1 block ${
                  msg.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestion(suggestion)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about revenue, churn, pricing..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow">
          <TrendingUp className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Revenue Forecast</p>
        </button>
        <button className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-shadow">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Risk Analysis</p>
        </button>
        <button className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-shadow">
          <Zap className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Optimization</p>
        </button>
        <button className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-shadow">
          <MessageSquare className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">Ask Anything</p>
        </button>
      </div>
    </div>
  );
};
