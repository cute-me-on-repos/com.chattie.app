# tiniapp.socket-io.adapter

The replacement of `socket-io.client v2` that supports and runs on TIKI Tini app

# basic usage

add dependency to your tiniapp

```bash
yarn add tiniapp.socket-io.adapter@0.0.4
```

import and use it with the same document here: https://socket.io/docs/v2/client-api

```js
import { io } from "tiniapp.socket-io.adapter"

Page({
  onLoad() {
    const socket = (this.socket = io(
      "ws://your-host",
      { transports: ["websocket"] }
      // this adapter did not support polling transport yet
      // semore about websocket transport vs polling transport at
      // https://mashhurs.wordpress.com/2016/09/30/polling-vs-websocket-transport/
    ))

    socket.on("hello", () => {
      this.socket.emit("world")
    })
    this.socket.emit("hello")
  },
})
```
