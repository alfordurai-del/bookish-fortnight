import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ArrowLeft, X } from 'lucide-react';
import { useUser } from '../context/UserContext'; // Assuming this provides user data

const jokes = [
  "Why did the developer go broke? Because he used up all his cache!",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "Why did the function return early? Because it had a date!",
];

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your friendly chatbot. How can I help you today?", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // Access user data from the context
  const { user } = useUser(); // Assuming 'user' object contains properties like 'email' and 'name'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user'
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');

    setTimeout(() => {
      handleBotResponse(inputValue);
    }, 1000);
  };

  const handleBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    let botResponse = "I'm here to help! You can ask me about: \n1. Account information\n2. Technical support\n3. General questions";

    if (
      lowerInput.includes('demo fund') ||
      lowerInput.includes('apply for demo') ||
      lowerInput.includes('demo balance')
    ) {
      // Use user's email from context if available, otherwise use a placeholder or error
      const userEmail = user?.email || 'unknown_user@example.com';
      const userName = user?.name || 'An unknown user';

      botResponse = "Thank you for requesting demo funds. The admin has been notified and will grant you the balance shortly.";

      // Send email to admin with user's specific details
      fetch('http://myblog.alwaysdata.net/api/send-demo-funds-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // You can still send to a fixed admin email
          adminEmail: 'calvingleichner181@gmail.com', // Replace with your actual admin email
          // Send user-specific data
          userEmail: userEmail,
          userName: userName,
          subject: `Demo Funds Request from ${userName} (${userEmail})`,
          message: `${userName} (${userEmail}) has requested demo funds. Please review and grant the demo balance.`,
        })
      }).then(res => {
        if (!res.ok) {
          console.error('Failed to send demo funds request.');
        } else {
          console.log('Demo funds request successfully sent to admin.');
        }
      }).catch(err => console.error('Error sending demo funds request:', err));

    } else if (
      lowerInput.includes('help') ||
      lowerInput.includes('support') ||
      lowerInput.includes('issue') ||
      lowerInput.includes('problem') ||
      lowerInput.includes('question') ||
      lowerInput.includes('ask') ||
      lowerInput.includes('assist') ||
      lowerInput.includes('how do i') ||
      lowerInput.includes('how can i')
    ) {
      botResponse = "We are working on your issue. We will get back to you as soon as possible.";
    } else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      botResponse = "Hello there! How can I assist you today?";
    } else if (lowerInput.includes('thank')) {
      botResponse = "You're welcome! Is there anything else I can help with?";
    } else if (lowerInput.includes('account')) {
      botResponse = "For account-related questions, you can:\n1. Check your profile settings\n2. Contact support@example.com\n3. Visit our help center at help.example.com";
    } else if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
      botResponse = "Goodbye! Feel free to chat again if you need more help.";
    } else if (lowerInput.includes('time')) {
      const now = new Date();
      botResponse = `The current time is ${now.toLocaleTimeString()}.`;
    } else if (lowerInput.includes('joke')) {
      botResponse = jokes[Math.floor(Math.random() * jokes.length)];
    } else if (lowerInput.trim() === 'clear') {
      clearChat();
      return;
    }

    const newBotMessage = {
      id: messages.length + 2,
      text: botResponse,
      sender: 'bot'
    };

    setMessages(prevMessages => [...prevMessages, newBotMessage]);
  };

  const clearChat = () => {
    setMessages([
      { id: 1, text: "Hello! I'm your friendly chatbot. How can I help you today?", sender: 'bot' }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-[350px] h-[500px] bg-white rounded-xl shadow-xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bot size={20} />
              <h2 className="font-semibold">Help Assistant</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearChat}
                className="p-1 rounded-full hover:bg-blue-400 transition-colors"
                title="Clear chat"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => window.history.back()}
                className="p-1 rounded-full hover:bg-blue-400 transition-colors"
                title="Go Back"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'bot' && <Bot size={16} className="mt-0.5 flex-shrink-0" />}
                    <div className="whitespace-pre-wrap">{message.text}</div>
                    {message.sender === 'user' && <User size={16} className="mt-0.5 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 text-black rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-2 hover:opacity-90 transition-opacity"
                disabled={inputValue.trim() === ''}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
        >
          <Bot size={24} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;