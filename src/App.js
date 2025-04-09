import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const API_URL = 'http://localhost:5000';  

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationContext, setConversationContext] = useState("");
  const [isCollectingLead, setIsCollectingLead] = useState(false);
  const [leadStep, setLeadStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    painPoints: ""
  });
  const [isGreetingSent, setIsGreetingSent] = useState(false); // Track if greeting is sent
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isGreetingSent && messages.length === 0) {
      addBotMessage("Hello! I'm Nekko BhAI. How can I help you today?");
      setIsGreetingSent(true);  // Mark greeting as sent
    }
  }, [messages, isGreetingSent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addBotMessage = (text) => {
    const formattedText = text.split('\n').map((line, index) => (
      <p key={index}>{line}</p>
    ));
    
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: formattedText,
      time: new Date().toLocaleTimeString()
    }]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (isCollectingLead) {
      const field = ['name', 'phone', 'email', 'painPoints'][leadStep];
      setFormData(prev => ({ ...prev, [field]: input }));
    }

    const userMessage = {
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        user_query: input,
      });

      const botResponse = response.data.reply;
      
      const combinedResponse = botResponse;
      const formattedResponse = combinedResponse.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ));

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: formattedResponse,
        time: new Date().toLocaleTimeString()
      }]);

      if (response.data.requires_lead_info) {
        setIsCollectingLead(true);
        setLeadStep(0);
      }

      if (isCollectingLead) {
        handleLeadCollection();
      }

    } catch (error) {
      console.error('Chat error:', error);
      addBotMessage("Sorry, I'm having trouble connecting. Please try again later.");
    }
  };

  const handleLeadCollection = () => {
    if (leadStep === 0 && formData.name) {
      setLeadStep(prev => prev + 1); // Skip to phone number question
    }

    if (leadStep === 1 && formData.phone) {
      setLeadStep(prev => prev + 1); // Skip to email question
    }

    if (leadStep === 2 && !formData.email) {
      setFormData(prev => ({ ...prev, email: input }));
      setLeadStep(prev => prev + 1);
    } else if (leadStep === 3 && !formData.painPoints) {
      setFormData(prev => ({ ...prev, painPoints: input }));
      setIsCollectingLead(false);
      setLeadStep(0);
      submitLead();
    }
  };

  const submitLead = async () => {
    try {
      await axios.post(`${API_URL}/submit_lead`, formData);
      addBotMessage("Thank you! We'll contact you shortly.");
    } catch (error) {
      console.error('Error submitting lead:', error);
      addBotMessage("Failed to save your details. Please try again later.");
    }
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div className="chat-container">
      <main className="chat-main">
        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-header-left">
              <img src="https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=123" 
                   alt="Bot Avatar" 
                   className="avatar" />
              <div>
                <h2>Nekko BhAI</h2>
                <p className="status">Online</p>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <img src={`https://api.dicebear.com/7.x/notionists/svg?scale=200&seed=${msg.sender === 'user' ? '456' : '123'}`}
                     alt={`${msg.sender} avatar`}
                     className="avatar" />
                <div className={`message-bubble ${msg.sender}`}>
                  <div>{msg.text}</div>
                  <span className="timestamp">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <button onClick={handleSendMessage}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
