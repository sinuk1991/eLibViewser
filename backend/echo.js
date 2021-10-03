const port = 12551;
const util = require('util');
const fs = require("fs");
const cors = require('cors');
const https = require("https");
const express = require("express")();
const find = require('find');
const options = {
	key: fs.readFileSync(__dirname + '/ssl/privkey.pem'),
	cert: fs.readFileSync(__dirname + '/ssl/fullchain.pem'),
	ca: fs.readFileSync(__dirname + '/ssl/fullchain.pem')
};
express.use(cors());

const server = https.createServer(options, express).listen(port, () => {
	console.log(`Listening on *: ${port}`);
})

let school = ['poongsung', 'chunil', 'gangdong', 'sangil'];
const socket_ids = [];
let count = 0;


const io = require("socket.io")(server, {
	cors: {origin:'*', credentials: true},
	allowEIO3: true,
});

io.on('connection', function(socket) {
	count++;
	let client_id = socket.id;


	socket.on('regClient', function(data) {
		//let client_id = socket.id;
		console.log(`${data} 님 접속.`);
		let hello = socket_ids.forEach(function(item) {
			if(item.client_name === data) {
				socket_ids.splice(socket_ids.indexOf(data));
			}
		})
		socket_ids.push({
			'client_id': client_id,
			'client_name': data.client_name,
			'client_type': data.client_type
		})

		if(data.client_type === 'client') {
			io.sockets.emit('broadcast_status', 1)
		}

		console.log(socket_ids)


		//console.log(socket_ids)
		io.sockets.emit('userlist', {users: Object.keys(socket_ids)});
	});

	socket.on('disconnect', function(data) {
		let goodbye = socket_ids.forEach(function(item) {
			if(item.client_id === socket.id) {
				if(item.client_type === 'client') {
					io.sockets.emit('broadcast_status', 0);
				}
				socket_ids.splice(socket_ids.indexOf(client_id), 1)
				console.log('${item.client_name}bye!')
			}
		})
		/*let obj=socket_ids.find(o => o.client_id === socket.id);
		let aa;
		if(obj != undefined) {
			console.log('쌓인다')
			aa = socket_ids.splice(socket_ids.indexOf(client_id),1);
		}
		console.log(aa);*/

		console.log(`현재 접속자: ${socket_ids}`)

		io.sockets.emit('userlist', {users: Object.keys(socket_ids)});
	});

	socket.on('clientStatus', function(data) {
		let obj=socket_ids.find(o => o.client_name === data);
		if(obj != undefined) io.sockets.emit('broadcast_status', 1);
		else io.sockets.emit('broadcast_status', 0);

		console.log(obj)
	})
})
