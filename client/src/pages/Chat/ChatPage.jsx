import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import { FiArrowLeft } from "react-icons/fi";

const base = import.meta.env.VITE_API_BASE_URL;
const socket = io(`${base}`, { withCredentials: true });

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(useLocation().search);
  const receiverId = searchParams.get("therapist");

  const getRoomId = (id1, id2) => [id1, id2].sort().join("-");

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${base}/messages?partnerId=${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Error loading messages", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiverDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${base}/users/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceiverName(res.data.name);
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const currentUserId = jwtDecode(token).id;
      const messageId = Date.now();

      const newMessage = {
        content,
        sender: currentUserId,
        _id: messageId,
        createdAt: new Date().toISOString(), // optimistic timestamp
      };

      setMessages((prev) => [...prev, newMessage]);

      await axios.post(
        `${base}/messages`,
        { receiverId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send-message", {
        roomId,
        message: content,
        senderId: currentUserId,
        _id: messageId,
        createdAt: newMessage.createdAt,
      });

      setContent("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !receiverId) return;

    const currentUserId = jwtDecode(token).id;
    const room = getRoomId(currentUserId, receiverId);
    setRoomId(room);

    fetchMessages();
    fetchReceiverDetails();

    socket.connect();
    socket.emit("join-room", { roomId: room });

    socket.on("receive-message", ({ message, senderId, _id, createdAt }) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === _id);
        if (exists) return prev;
        return [...prev, { content: message, sender: senderId, _id, createdAt }];
      });
    });

    return () => {
      socket.off("receive-message");
      socket.disconnect();
    };
  }, [receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 to-emerald-100 p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-purple-700 hover:text-purple-900 transition"
      >
        <FiArrowLeft className="text-xl" />
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-bold text-center text-purple-700 mb-4">
        Chat with {receiverName || "Therapist"}
      </h2>

      <div className="flex-1 bg-white rounded-xl shadow-md p-4 overflow-y-auto mb-4 max-h-[60vh]">
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 flex ${
                msg.sender === receiverId ? "justify-start" : "justify-end"
              }`}
            >
              <div className="max-w-xs">
                <div
                  className={`p-2 rounded-lg ${
                    msg.sender === receiverId
                      ? "bg-gray-200 text-black"
                      : "bg-purple-600 text-white"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.createdAt && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handleSend}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
