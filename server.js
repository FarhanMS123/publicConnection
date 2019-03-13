/*
	Name : publicConnection Server V1.0.0
	Creator : FarhanMS123
	Created on 2019/03/10
	
	Route :
		/conn/:sock_id
		/conn/:sock_id/
		/conn/:sock_id/*
		/localServer
		/localServer/handle/:conn_id
		/console
*/

//-----------------------------modules initialize---------------------------------
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

var util = require("util");
var url = require("url");
var net = require("net");

var express = require("express");
var ws = require("ws");
//--------------------------------------------------------------------------------

global.app = express(); //create app

//------------config-------------
app.set("port", 2000);
app.set("password", "password");
//-------------------------------

global.sockLocalServer = {}; global.reqresHandler = {}; //socketSaved

//---------------------------------------------connection routes------------------------------------------
app.all("/conn/:sock_id", httpHandle);
app.all("/conn/:sock_id/", httpHandle);
app.all("/conn/:sock_id/*", httpHandle);
function httpHandle(req,res,next,arg3){
	var sock_id = req.params.sock_id;
	if(typeof sockLocalServer[sock_id] != "undefined"){
		var a=10000, b=99999, rnd = Math.random();
		var reqres_id = String(new Date().getTime()) + String(Math.round(a + ((b-a+rnd) * rnd)))
		sockLocalServer[sock_id].send("connection " + JSON.stringify([sock_id, reqres_id]));
		global.reqresHandler[reqres_id] = {req,res,next,arg3,sockLocalServer:global.sockLocalServer[sock_id]};
	}else{
		if(!arg3) res.sendStatus(404);
	}
}
//--------------------------------------------------------------------------------------------------------

app.set("listen", app.listen(app.get("port"))); //listening function and save the httpServer to app

//------------------------------------------------------------------------WebSocket Handler----------------------------------------------------------------------
global.wsLocalServer = new ws.Server({ noServer: true });
app.get("listen").on("upgrade", function(request, upgradedSocket, head){
	if(request.headers.upgrade=="websocket"){
		console.log("Incoming websocket...");
		if(Boolean(([/^\/localServer(\/)?$/, /^\/localServer\/handle\/\d*(\/)?$/]).find(function(val, key, arr){return val.exec(url.parse(request.url).pathname);}))){
			wsLocalServer.handleUpgrade(request, upgradedSocket, head, function(handledSocket){
				handledSocket.config = {request, upgradedSocket, head, handledSocket, status:"pass0", sock_id:""};
				var pathname = url.parse(request.url).pathname;
				
				console.log("Routing websocket...")
				
				switch(true){
					case (Boolean(/^\/localServer(\/)?$/.exec(pathname))) :
						console.log("Incoming new localServer...");
						handledSocket.on("message", function(msg){
							if(/^pass\d+$/.exec(handledSocket.config.status)){
								if(msg == app.get("password")){
									handledSocket.send("id");
									handledSocket.config.status = "id";
								}else{
									handledSocket.send("wrong");
									handledSocket.config.status = "pass" + (Number((/\d+$/).exec(handledSocket.config.status)) + 1);
								}
							}else if(handledSocket.config.status == "id"){
								handledSocket.config.sock_id = msg;
								handledSocket.config.status = "connected";
								global.sockLocalServer[handledSocket.config.sock_id] = handledSocket;
								global.sockLocalServer[handledSocket.config.sock_id].send("connected");
							}
						});
						handledSocket.on("close", function(code, reason){
							global.sockLocalServer[handledSocket.config.sock_id] = undefined;
						});
						handledSocket.send("pass");
						break;
					case (Boolean(/^\/localServer\/handle\/\d*(\/)?$/.exec(pathname))) :
						handledSocket.on("message", function(msg){
							if(/^pass\d+$/.exec(handledSocket.config.status)){
								if(msg == app.get("password")){
									handledSocket.send("connected");
									handledSocket.config.status = "connected";
									var reqres_id = /\/\d+(\/)?$/.exec(pathname)[0];
									reqres_id = reqres_id.slice(1, reqres_id.slice(reqres_id.length - 1) == "/" ? reqres_id.length - 1 : reqres_id.length);
									if(typeof global.reqresHandler[reqres_id] != "undefined"){
										global.reqresHandler[reqres_id].reqresHandler = handledSocket;
										var header="", headers=global.reqresHandler[reqres_id].req.headers;
										header = `${global.reqresHandler[reqres_id].req.method} ${global.reqresHandler[reqres_id].req.url} HTTP/${global.reqresHandler[reqres_id].req.httpVersion}\n`
										for(x in headers){header += `${x}: ${headers[x]}\n`;}
										header += "\n";
										global.reqresHandler[reqres_id].reqresHandler.send(header);
										
										global.reqresHandler[reqres_id].req.client.on("data", function(data){
											global.reqresHandler[reqres_id].reqresHandler.send(data.toString());
										});
										global.reqresHandler[reqres_id].req.client.on("close", function(){
											if(global.reqresHandler[reqres_id]) global.reqresHandler[reqres_id].req.client.end();
										});
										global.reqresHandler[reqres_id].req.client.on("end", function(){
											global.reqresHandler[reqres_id].reqresHandler.close();
											global.reqresHandler[reqres_id] = undefined;
										});
										
										global.reqresHandler[reqres_id].reqresHandler.on("message", function(msg){
											global.reqresHandler[reqres_id].req.client.write(msg.toString());
										});
										global.reqresHandler[reqres_id].reqresHandler.on("close", function(code,reason){
											if(global.reqresHandler[reqres_id]) global.reqresHandler[reqres_id].req.client.end();
										});
									}
								}else{
									handledSocket.send("wrong");
									handledSocket.config.status = "pass" + (Number((/\d+$/).exec(handledSocket.config.status)) + 1);
								}
							}
						});
						handledSocket.send("pass");
						break;
				}
				
			});
		}else{
			httpHandle(request, upgradedSocket, head, "upgrade_websocket");
		}
	}else{
		httpHandle(request, upgradedSocket, head, "upgrade");
	}
});
//---------------------------------------------------------------------------------------------------------------------------------------------------------------

console.log("publicConnection Server V1.0.0");
console.log(`Listening on ${app.get("port")}...`);