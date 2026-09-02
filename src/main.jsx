import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import CompleteProfile from "./pages/auth/CompleteProfile";

import Profile from "./pages/home/Profile";
import Home from "./pages/home/Home";
import CreatePost from "./pages/home/CreatePost";
import PostPage from "./pages/home/PostPage";
import MyPosts from "./pages/home/MyPosts";
import EditPost from "./pages/home/EditPost";
import ChatsPage from "./pages/home/ChatsPage";
import ChatPage from "./pages/home/ChatPage";
import SignUp from "./pages/auth/SignUp";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/home" element={<Home />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/chats" element={<ChatsPage />} />

            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
        </Routes>
    </BrowserRouter>,
);
