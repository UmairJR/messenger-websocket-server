"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let userCount = 0;
// let allSockets: WebSocket[] = [];
const userMap = new Map();
wss.on("connection", (socket) => {
    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message);
        //Join
        if (parsedMessage.type == "join") {
            console.log("User joined!!");
            const roomId = parsedMessage.payload.roomId;
            const userId = userMap.size + 1;
            userMap.set(socket, { roomId: roomId, userId: userId });
            //User Count
            const userCount = [...userMap.values()].filter(x => x.roomId == roomId).length;
            console.log("User count in room: " + userCount);
            for (const [clientSocket, user] of userMap) {
                if (user.roomId == roomId) {
                    clientSocket.send(JSON.stringify({
                        "type": "userCount",
                        "payload": {
                            "count": userCount
                        }
                    }));
                }
            }
        }
        //Chat
        if (parsedMessage.type == "chat") {
            const currentUser = userMap.get(socket);
            if (!currentUser)
                return;
            console.log(`Message received: ${parsedMessage.payload.message}, RoomId: ${currentUser.roomId}, UserId: ${currentUser.userId}`);
            // let currentUserRoom = null;
            for (const [clientSocket, user] of userMap) {
                if (user.roomId == currentUser.roomId) {
                    const isMe = clientSocket === socket;
                    clientSocket.send(JSON.stringify({
                        "type": "chat",
                        "payload": {
                            "message": parsedMessage.payload.message,
                            "sender": isMe ? "ME" : `User #${currentUser.userId}`
                        }
                    }));
                }
            }
        }
        // While close 
        socket.on("close", () => {
            const leavingUser = userMap.get(socket);
            if (!leavingUser)
                return;
            userMap.delete(socket);
            // Update user Count
            const userCount = [...userMap.values()].filter(user => user.roomId === leavingUser.roomId).length;
            for (const [clientSocket, user] of userMap) {
                if (user.roomId === leavingUser.roomId) {
                    clientSocket.send(JSON.stringify({
                        "type": "userCount",
                        "payload": {
                            "count": userCount
                        }
                    }));
                }
            }
        });
    });
});
