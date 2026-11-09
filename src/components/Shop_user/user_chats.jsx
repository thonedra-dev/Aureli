import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
//import './user_chats.css';

const UserChats = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user_id, shop_id, chat_id } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [shopDetails, setShopDetails] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      if (!user_id) {
        setError('Missing user information');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch chat rooms
        const roomsResponse = await fetch(`http://localhost:5070/api/user-chat-rooms?user_id=${user_id}`);
        if (!roomsResponse.ok) throw new Error('Failed to fetch chat rooms');
        const roomsData = await roomsResponse.json();
        setChatRooms(roomsData.chat_rooms || []);

        // Fetch messages and shop details if we have a chat
        if (chat_id && shop_id) {
          const chatResponse = await fetch(
            `http://localhost:5070/api/chats?user_id=${user_id}&shop_id=${shop_id}&chat_id=${chat_id}`
          );
          if (!chatResponse.ok) throw new Error('Failed to fetch messages');
          const chatData = await chatResponse.json();
          
          setMessages(chatData.messages || []);
          setShopDetails(chatData.shop_details);
        }

      } catch (err) {
        setError(err.message || 'Error fetching chat data');
        setMessages([]);
        setChatRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [user_id, shop_id, chat_id]);

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('http://localhost:5070/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user_id,
          chat_id: chat_id,
          shop_id: shop_id,
          message: newMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();

      // Add new message to state
      setMessages(prev => [...prev, data.newMessage]);
      setNewMessage('');

    } catch (err) {
      setError('Error sending message');
    }
  };

  // Switch chat room
  const handleChatRoomClick = (room) => {
    navigate('/user_chats', { 
      state: { 
        chat_id: room.chat_id, 
        user_id: user_id, 
        shop_id: room.shop_id 
      } 
    });
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="chat-loading-spinner"></div>
        <p>Loading your chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <div className="chat-error-icon">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Left Panel - Chat Rooms */}
      <div className="chat-rooms-panel">
        <div className="chat-rooms-header">
          <h2>Your Chats</h2>
        </div>
        
        <div className="chat-rooms-list">
          {chatRooms && chatRooms.length > 0 ? (
            <ul>
              {chatRooms.map(room => (
                <li 
                  key={room.chat_id} 
                  className={`chat-room-item ${room.chat_id === chat_id ? 'active' : ''}`}
                  onClick={() => handleChatRoomClick(room)}
                >
                  <div className="chat-room-avatar">
                    <img 
                      src={room.profile_pic ? `http://localhost:5070${room.profile_pic}` : '/default-shop.png'} 
                      alt={room.shop_name}
                    />
                  </div>
                  <div className="chat-room-info">
                    <h4>{room.shop_name}</h4>
                    <p>{room.category} {room.country ? `| ${room.country}` : ''}</p>
                    {room.last_message && (
                      <small className="last-message">{room.last_message}</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-chats-placeholder">
              <div className="no-chats-icon">💬</div>
              <p>No chats yet</p>
              <small>Start a conversation with a shop!</small>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Messages */}
      <div className="chat-messages-panel">
        {shopDetails && chat_id ? (
          <>
            {/* Chat Header */}
            <header className="chat-header">
              <div className="receiver-details">
                <img
                  src={shopDetails.profile_pic ? `http://localhost:5070${shopDetails.profile_pic}` : '/default-shop.png'}
                  alt={shopDetails.shop_name}
                  className="shop-avatar"
                />
                <div className="receiver-info">
                  <h3>{shopDetails.shop_name}</h3>
                  <p>{shopDetails.category} {shopDetails.country ? `| ${shopDetails.country}` : ''}</p>
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div className="messages-container">
              {messages && messages.length > 0 ? (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`message ${message.sender_id == user_id ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        {message.sender_id != user_id && (
                          <img 
                            src={message.profile_pic ? `http://localhost:5070${message.profile_pic}` : '/default-user.png'} 
                            alt={message.username}
                            className="message-avatar"
                          />
                        )}
                        <div className="message-bubble">
                          <p>{message.message}</p>
                          <small className="message-time">
                            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Now'}
                          </small>
                        </div>
                        {message.sender_id == user_id && (
                          <img 
                            src={message.profile_pic ? `http://localhost:5070${message.profile_pic}` : '/default-user.png'} 
                            alt={message.username}
                            className="message-avatar"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-messages">
                  <div className="no-messages-icon">👋</div>
                  <h3>Start the conversation!</h3>
                  <p>Be the first to send a message to {shopDetails.shop_name}</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <footer className="message-input-container">
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="input-group">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="send-button"
                  >
                    Send
                  </button>
                </div>
              </form>
            </footer>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💭</div>
            <h3>Select a chat</h3>
            <p>Choose a conversation from the left to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChats;