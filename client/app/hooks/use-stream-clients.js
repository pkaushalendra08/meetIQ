import { StreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";

export function useStreamClients({ apiKey, user, token }) {
    const [videoClient, setVideoClient] = useState(null);
    const [chatClient, setChatClient] = useState(null);

    useEffect(() => {
        if (!user || !token || !apiKey) return;

        let isMounted = true;
        let activeVideoClient;
        let activeChatClient;

        const initClients = async () => {
            try {
                // 1. Setup Video Client (Always a new instance, safe to disconnect)
                const tokenProvider = () => Promise.resolve(token);
                activeVideoClient = new StreamVideoClient({
                    apiKey,
                    user,
                    tokenProvider,
                });

                // 2. Setup Chat Client (Singleton - requires special handling)
                activeChatClient = StreamChat.getInstance(apiKey);

               
                
                if (activeChatClient.userID && activeChatClient.userID !== user.id) {
                    await activeChatClient.disconnectUser();
                }

                // Only connect if not currently connected
                if (!activeChatClient.userID) {
                    await activeChatClient.connectUser(user, token);
                }

                if (isMounted) {
                    setVideoClient(activeVideoClient);
                    setChatClient(activeChatClient);
                }
            } catch (error) {
                console.error("Client initialization error:", error);
            }
        };

        initClients();

        return () => {
            isMounted = false;
            
           
            if (activeVideoClient) {
                activeVideoClient.disconnectUser().catch(console.error);
            }

        };
    }, [apiKey, user, token]);

    return { videoClient, chatClient };
}