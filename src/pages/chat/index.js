import { io } from "tiniapp.socket-io.adapter"

function debounce(func, timeout = 300) {
  let timer
  return function (...args) {
    const context = this
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(context, args)
    }, timeout)
  }
}

function msgUuid() {
  if (!msgUuid.next) {
    msgUuid.next = 0
  }
  return "msg-" + ++msgUuid.next
}

function createSystemMessage(content) {
  return {
    id: msgUuid(),
    type: "system",
    content,
  }
}

function createUserMessage(content, user, isMe) {
  console.log("ge", ...arguments)
  const color = getUsernameColor(user)
  return {
    id: msgUuid(),
    type: "speak",
    content,
    user,
    isMe,
    color,
  }
}

var COLORS = [
  "#e21400",
  "#91580f",
  "#f8a700",
  "#f78b00",
  "#58dc00",
  "#287b00",
  "#a8f07a",
  "#4ae8c4",
  "#3b88eb",
  "#3824aa",
  "#a700ff",
  "#d300e7",
]

function getUsernameColor(username) {
  var hash = 7
  for (var i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + (hash << 5) - hash
  }
  var index = Math.abs(hash % COLORS.length)
  return COLORS[index]
}

Page({
  data: {
    inputContent: "Hi there",
    messages: [],
    lastMessageId: "none",
  },

  onLoad() {
    my.setNavigationBar({
      title: "Online chat room",
    })

    try {
      this.enter()
    } catch (error) {
      console.error(error)
    }
  },

  onUnload() {
    this.quit()
  },

  quit() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  },

  enter() {
    this.pushMessage(createSystemMessage("logging in..."))
    if (!this.me) {
      this.me = {
        nickName: "uid_" + Date.now().toString().slice(8),
      }
    }
    this.createConnect()
  },

  updateMessages(updater) {
    var messages = this.data.messages
    updater(messages)

    this.setData({
      messages,
    })

    var lastMessageId = messages.length
      ? messages[messages.length - 1].id
      : "none"
    this.setData({
      lastMessageId,
    })
  },

  pushMessage(message) {
    this.updateMessages((messages) => messages.push(message))
  },

  amendMessage(message) {
    this.updateMessages((messages) => messages.splice(-1, 1, message))
  },

  popMessage() {
    this.updateMessages((messages) => messages.pop())
  },

  debounceSetData: debounce(function (...args) {
    try {
      this.setData(...args)
      this.socket.emit("stop typing", this.me.nickName)
    } catch (error) {
      console.error(error)
    }
  }),
  changeInputContent(e) {
    this.socket.emit("typing", this.me.nickName)
    this.debounceSetData({
      inputContent: e.detail.value,
    })
  },

  sendMessage(e) {
    const msg = this.data.inputContent
    console.log("new message", msg)
    if (!msg) {
      return
    }
    this.socket.emit("new message", msg)
    this.pushMessage(createUserMessage(msg, this.me.nickName, true))
    this.setData({
      inputContent: null,
    })
  },

  createConnect(e) {
    this.amendMessage(createSystemMessage("Joining group chat..."))

    console.log("io: ", io)

    const socket = (this.socket = io(
      // "ws://localhost:3000",
      "https://tini-socket-io-adapter-demo.herokuapp.com",
      { transports: ["websocket"] }
      // the domain above did not support polling transport
    ))
    console.log("socket: ", socket)

    /**
     * About connection
     */
    socket.on("connect", () => {
      this.popMessage()
      this.pushMessage(createSystemMessage("connection succeeded"))
    })

    socket.on("connect_error", (d) => {
      console.error("connect_error", d, socket)
      this.pushMessage(createSystemMessage(`connect_error: ${d}`))
    })

    socket.on("connect_timeout", (d) => {
      this.pushMessage(createSystemMessage(`connect_timeout: ${d}`))
    })

    socket.on("disconnect", (reason) => {
      this.pushMessage(createSystemMessage(`disconnect: ${reason}`))
    })

    socket.on("reconnect", (attemptNumber) => {
      this.pushMessage(
        createSystemMessage(`reconnect success: ${attemptNumber}`)
      )
    })

    socket.on("reconnect_failed", () => {
      this.pushMessage(createSystemMessage("reconnect_failed"))
    })

    socket.on("reconnect_attempt", () => {
      this.pushMessage(createSystemMessage("Trying to reconnect"))
    })

    socket.on("error", (err) => {
      this.pushMessage(createSystemMessage(`error: ${err}`))
    })

    /**
     * About chat
     */
    socket.on("login", (d) => {
      this.pushMessage(
        createSystemMessage(`loggedin，total users: ${d.numUsers}`)
      )
    })

    socket.on("new message", (d) => {
      console.log("new msg ::", d)
      const { username, message } = d

      this.pushMessage(createUserMessage(message, username))
    })

    socket.on("user joined", (d) => {
      this.pushMessage(
        createSystemMessage(`${d.username} joined，total users: ${d.numUsers}`)
      )
    })

    socket.on("user left", (d) => {
      this.pushMessage(
        createSystemMessage(`${d.username} left，total users: ${d.numUsers}`)
      )
    })

    socket.on("typing", (d) => {
      my.setNavigationBar({
        title: `${d.username} is typing...`,
      })
    })

    socket.on("stop typing", (d) => {
      my.setNavigationBar({
        title: "stop typing",
      })
    })

    socket.emit("add user", this.me.nickName)
  },
})
