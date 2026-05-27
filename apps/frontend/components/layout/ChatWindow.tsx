// "use client";

// import { Socket } from "socket.io-client";
// import ChatPage from "../chat/ChatView";

// interface ChatWindowProps {
//   selectedChat: {
//     _id: string;
//     chatName: string;
//     isGroup: boolean;
//     members: {
//       _id: string;
//       username: string;
//       displayName?: string;
//       profilePicture?: { url: string | null };
//     }[]
//   };
//   currentUser: { _id: string; username: string; profilePic: string };
//   socket: Socket | null;
// }

// export default function ChatWindow({ selectedChat, currentUser, socket }: ChatWindowProps) {
//   return (
//     <div className="h-full min-h-0 flex flex-col">
//       <ChatPage currentUser={currentUser} chat={selectedChat} socket={socket}/>
//     </div>
//   );
// }
