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

let school = [];
const socket_ids = [];
let count = 0;
let userid = {};


const io = require("socket.io")(server, {
	cors: {origin:'*', credentials: true},
	allowEIO3: true,
});

io.on('connection', function(socket) {
	count++;
	let client_id = socket.id;

	socket.on('regClient', function(data) {
		let hello = socket_ids.forEach(function(item) {
			if(item.client_name == data) {
				socket_ids.splice(socket_ids.indexOf(data), 1);
			}
		})
		socket_ids.push({
			'client_id': client_id,
			'client_name': data.client_name,
			'client_type': data.client_type,
			'client_sname': data.client_sname
		})

		socket.join(data.client_sname)

		if(data.client_type == 'client') {
			let master = socket_ids.find(o => (o.client_sname == data.client_sname) && (o.client_type === 'manager'));
			if(master != undefined) io.to(master.client_id).emit('broadcast', { noti_type: 'state', message: '1'});
		}

	});

	socket.on('disconnect', function(data) {
		let host = socket_ids.find(o => o.client_id == socket.id);
		if(host.client_type == 'client') {
			let master = socket_ids.find(o => (o.client_sname == host.client_sname) && (o.client_type === 'manager'));
			if(master != undefined) io.to(master.client_id).emit('broadcast', { noti_type: 'state', message: '0'});
		}
		console.log(host.client_type)
		socket_ids.splice(socket_ids.indexOf(socket.id), 1)
	});

	socket.on('clientStatus', function(data) {
		let state_code;
		let school_name = socket_ids.find(o => o.client_id == socket.id).client_sname;
		let obj = socket_ids.find(o => (o.client_sname == school_name) && (o.client_type === 'client'));

		if(obj != undefined) state_code = 1;
		else state_code = 0;

		io.to(socket.id).emit('broadcast', { noti_type: 'state', message: `${state_code}`});
		
	})

	socket.on('changeLending', function(data) {
		let school_name = socket_ids.find(o => o.client_id == socket.id);
		let host = socket_ids.find(o => (o.client_sname == school_name.client_sname) && (o.client_type === 'client'));
		let host_code = data.changeLendmode;
		let client_id = socket.id;
		io.to(host.client_id).emit('changeLending', data.changeLendmode);
		io.to(socket.id).emit('broadcast', { noti_type: 'message', message: '변경 완료.'})
	})

	socket.on('changeDate', function(data) {
		let school_name = socket_ids.find(o => o.client_id == socket.id);
		let host = socket_ids.find(o => (o.client_sname == school_name.client_sname) && (o.client_type === 'client'));
		let change_date = data.changeDate;
		let client_id = socket.id;
		io.to(host.client_id).emit('changeDate', data.changeDate);
		io.to(socket.id).emit('broadcast', { noti_type: 'message', message: '변경 완료.'})
	})
})
