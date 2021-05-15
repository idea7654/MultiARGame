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
      rooms[index].player2.id = data.id;
      rooms[index].player2.gps = data.gps;
    }
    io.emit("sendPlayerInfo", rooms[index]);
  });

  socket.on("disconnect", () => {
    // players.forEach((element) => {
    //   if (element.id === socket.id) {
    //     const index = players.indexOf(element);
    //     players.splice(index, 1);
    //   }
    // });
  });

  socket.on("CreateRoom", () => {
    const roomId = Math.random().toString(36).substr(2, 11);
    rooms.push({
      roomId: roomId,
      player1: {
        id: socket.id,
        gps: null,
      },
      player2: {
        id: null,
        gps: null,
      },
    });
    socket.join(roomId);
    socket.emit("CreateRoom", roomId);
  });

  socket.on("enterRoom", (data) => {
    let flag = false;
    rooms.forEach((i) => {
      if (i.roomId == data) {
        flag = true;
        socket.join(i.roomId);
        io.to(i.roomId).emit("showArButton");
        /* 테스트 코드 */
        i.player2.gps = {
          lat: 36.316918,
          lon: 127.367179,
        };
        i.player2.id = socket.id;
      }
    });
    if (!flag) {
      socket.emit("joinError");
    }
  });
});
