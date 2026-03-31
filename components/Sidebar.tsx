"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { SearchBar } from "./SearchBar";
import { UserList } from "./UserList";
import { ConversationList } from "./ConversationList";
import { NotificationsPanel } from "./NotificationsPanel";
import { MessageSquare, Users } from "lucide-react";
import { Button } from "./ui/button";

type Tab = "conversations" | "users";

export function Sidebar({
    activeConversationId,
    onSelectConversation,
}: {
    activeConversationId?: string;
    onSelectConversation: (id: string) => void;
}) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<Tab>("conversations");
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="w-full md:w-[350px] h-full flex flex-col border-r bg-white p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Messages
                </h1>
                <div className="flex items-center gap-3">
                    <NotificationsPanel onSelectUser={onSelectConversation} />
                    <UserButton appearance={{ elements: { avatarBox: "w-10 h-10 cursor-pointer hover:opacity-80 transition" } }} />
                </div>
            </div>

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            <div className="flex gap-2 my-4">
                <Button
                    variant={activeTab === "conversations" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setActiveTab("conversations")}
                >
                    <MessageSquare className="w-4 h-4" /> Chats
                </Button>
                <Button
                    variant={activeTab === "users" ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => setActiveTab("users")}
                >
                    <Users className="w-4 h-4" /> Users
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === "conversations" ? (
                    <ConversationList
                        activeConversationId={activeConversationId}
                        onSelectConversation={onSelectConversation}
                    />
                ) : (
                    <UserList
                        searchQuery={searchQuery}
                        onSelectConversation={(id) => {
                            onSelectConversation(id);
                            setActiveTab("conversations");
                            setSearchQuery("");
                        }}
                    />
                )}
            </div>
        </div>
    );
}
