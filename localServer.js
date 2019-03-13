/*
	Name : publicConnection Local Server V1.0.0
	Creator : FarhanMS123
	Created on 2019/03/12
	
	node localServer.js {{port}} {{url}} {{pass}} {{id}}
*/

//-----------------------------modules initialize---------------------------------
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

var util = require("util");
var url = require("url");
var net = require("net");

var express = require("express");
var ws = require("ws");
//--------------------------------------------------------------------------------

console.log("publicConnection Local Server V1.0.0\n");
console.log("Checking the arguments...");
console.log(`Port:${process.argv[2]}\nUrl:${process.argv[3]}\nPass:[${process.argv[4].length} characters]\nId:${process.argv[5]}\n`);
if(!(process.argv[2]) || !(process.argv[3]) || !(process.argv[4]) || !(process.argv[5])){
	console.log("Error! One of them shoudl be defined.");
	console.log("[Exit]");
	process.exit();
}

global.config = {port:process.argv[2], url:process.argv[3], pass:process.argv[4], id:process.argv[5]};

console.log(`\nConnecting to ${global.config.url}...`);
var sockServer = new ws(global.config.url + "/localServer");
sockServer.on("error", function(err){
	console.log("\n[Error]");
	console.log(err);
});
sockServer.on("open", function(err){
	console.log("Connected\n");
	console.log("Authenticating...");
});
sockServer.on("message", function(msg){
	console.log(msg);
	switch(msg){
		case "pass":
			sockServer.send(global.config.pass);
			break;
		case "wrong":
			console.log("Password wrong.");
			sockServer.close();
			break;
		case "id":
			sockServer.send(global.config.id);
			break;
		case "connected":
			console.log("\nConnected to publicServer server.");
			console.log(`Server: ${global.config.url}\nServing: localhost:${global.config.port}\nIdentification: ${global.config.id}\nForwarding to: ${global.config.url}/conn/${global.config.id}`);
			break;
		default:
			switch(true){
				case (Boolean(/^connection /.exec(msg))):
					var conn = JSON.parse(msg.slice("connection ".length));
					var handlePath = global.config.url + "/localServer/handle/" + conn[1];
					var sockClient = new ws(handlePath);
					var isFirst=true, netClient;
					sockClient.on("error", function(err){
						console.log(`\n[Error ${handlePath}]`);
						console.log(err);
					});
					sockClient.on("open", function(err){
						console.log("Connected\n");
						console.log("Authenticating...");
					});
					sockClient.on("close", function(){
						if(netClient) netClient.end();
					});
					sockClient.on("message", function(msg){
						//console.log(msg);
						
						switch(msg){
							case "pass":
								sockClient.send(global.config.pass);
								break;
							case "wrong":
								console.log("Password wrong.");
								sockClient.close();
								break;
							case "connected":
								console.log("\nConnected to publicServer server.");
								console.log(`Routing for ${handlePath}`);
								netClient = net.createConnection({port:global.config.port});
								netClient.on("error", function(err){
									console.log("[Error Client ${handlePath}]")
								})
								netClient.on("close", function(hadError){
									netClient.end();
								})
								netClient.on("end", function(){
									sockClient.close();
								})
								netClient.on("data", function(data){
									sockClient.send(data);
								})
								break;
							default:
								if(isFirst==true){
									msg = msg.split("\n");
									msg[0] = msg[0].split(" ");
									
									msg[0][1] = msg[0][1].split("/");
									msg[0][1].shift();msg[0][1].shift();msg[0][1].shift();
									msg[0][1].unshift("");
									if(msg[0][1].length == 1) msg[0][1].push("");
									msg[0][1] = msg[0][1].join("/");
									
									msg[0] = msg[0].join(" ");
									msg = msg.join("\n");
									isFirst = false;
								}
								netClient.write(msg.toString());
						}
					});
					break;
			}
	}
});