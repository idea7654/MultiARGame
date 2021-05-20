const express = require("express");
const app = express();
const cors = require("cors");

let rooms = [];
app.use(cors({ credentials: true }));
//app.use(express.static("public"));

const server = app.listen(3000);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("sendPlayerInfo", (data) => {
    const index = rooms.findIndex((i) => i.roomId == data.roomID);
    if (rooms[index].player1.id == data.id) {
      rooms[index].player1.gps = data.gps;
    } else {
      rooms[index].player2.id = socket.id;
      rooms[index].player2.gps = data.gps;
    }
    if (rooms[index].player1.gps && rooms[index].player2.gps) {
      io.to(rooms[index].roomId).emit("sendPlayerInfo", rooms[index]);
    }
  });

  socket.on("disconnect", () => {
    const findUser = rooms.find((i) => i.player1.id == socket.id);
    if (findUser == undefined) {
      const findUser2 = rooms.find((i) => i.player2.id == socket.id);
      if (findUser2 != undefined) {
        socket.leave(findUser2.roomId);
        io.to(findUser2.roomId).emit("disconnectOtherPlayer");
      }
    } else {
      socket.leave(findUser.roomId);
      io.to(findUser.roomId).emit("disconnectOtherPlayer");
    }
  });

  socket.on("command", (data) => {
    const room = rooms.find((i) => i.roomId == data.roomID);
    if (room.player1.id == socket.id) {
      room.player1.command = data.command;
    } else {
      room.player2.command = data.command;
    }
    if (room.player1.command && room.player2.command) {
      io.to(data.roomID).emit("executeTurn", room);
      room.player1.command = null;
      room.player2.command = null;
    }
  });

  socket.on("CreateRoom", () => {
    const roomId = Math.random().toString(36).substr(2, 11);
    //->테스트 동안은 간단하게
    rooms.push({
      roomId: roomId,
      player1: {
        id: socket.id,
        gps: null,
        command: null,
      },
      player2: {
        id: null,
        gps: null,
        command: null,
      },
    });
    socket.join(roomId);
    console.log("작동");
    socket.emit("CreateRoom", roomId);
  });

  socket.on("enterRoom", (data) => {
    let flag = false;
    rooms.forEach((i) => {
      if (i.roomId == data) {
        flag = true;
        socket.join(i.roomId);
        io.to(i.roomId).emit("showArButton", i.roomId);
        //--- 테스트 코드
        i.player2.gps = {
          lat: 36.316918,
          lon: 127.367179,
        };
        //---
        i.player2.id = socket.id;
      }
    });
    if (!flag) {
      socket.emit("joinError");
    }
  });
});
