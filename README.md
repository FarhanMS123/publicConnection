# publicConnection

> DEPRECATED: please use Ngrok, SSH Tunneling, or Cloud VPN/VPC instead. Connecting your computer through internet directly is bad and lack of performance. You should make your project clustered directly in cloud computer/containerized engine like as EC2, Heroku, Vercel, VPS, and etc.. This project is deprecated due lack of interest and bad performace. If you want to make your own, use middle level programming lauange instead, such as Java, C++, Go, or Rust.

Replicate and alternative of ngrok. Run in nodejs.

This script (server.js) could use to make own tunnels from cloud platform such as Heroku. And localServer.js is used to connect from cloud platform to our localhost. These scripts still have much of bugs, and are not simply readed and documented. Feel free to fix them.

## How to use?
### server.js
This script should be installed in cloud platform. <br />
First, edit this scripts. Change the port to number from 1~65536 or `process.env.PORT` for some cloud platform.<br />
Second, changed the password
```javascript
//before changed
//------------config-------------
app.set("port", 2000);
app.set("password", "password");
//-------------------------------

//after changed sample
//------------config-------------
app.set("port", process.env.PORT);
app.set("password", "anotherpass");
//-------------------------------
```
Third, upload to your favorites cloud platform.

### localServer.js
This script would be used in our server. <br />
First, open terminal or command promt. <br />
Second, route to this script directory.<br />
Third, run `node localServer.js port_to_local_server url_to_cloud_platform password_in_server.js your_uniq_id`<br />
Then, you could browse `https://url_to_cloud_platform/conn/your_uniq_id`<br /><br />
Example, I run it from command prompt.
```
H:\publicServer>node localServer.js 80 mytunnel.herokuapp.com anotherpass myWebServer
```
Then, Open your browser from `https://mytunnel.herokuapp.com/conn/myWebServer`

## How it works?
I used nodejs for this script run. I used websocket (ws) and expressjs (express) modules to help the development for this scripts.
There are some routes `server.js` made for the runtime. There are...
- /conn/:sock_id
- /conn/:sock_id/
- /conn/:sock_id/*
- /localServer
- /localServer/handle/:conn_id
- /console
