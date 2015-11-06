var fs = require('fs');
var http = require('http');
var MD5 = require('MD5');
var shopTitle = 'Shop';
var serverIp = '52.88.247.247';


exports.commands = {

	profile: function(target, room, user) {
		if (!target) target = user.name;
		if (toId(target).length > 19) return this.sendReply("Usernames may not be more than 19 characters long.");
		if (toId(target).length < 1) return this.sendReply(target + " is not a valid username.");
		if (!this.canBroadcast()) return;
		var targetUser = Users.get(target);
		if (!targetUser) {
			var username = target;
			var userid = toId(target);
			var avatar = (Config.customavatars[userid] ? "http://" + serverIp + ":" + Config.port + "/avatars/" + Config.customavatars[userid] : "http://play.pokemonshowdown.com/sprites/trainers/167.png");
		} else {
			var username = targetUser.name;
			var userid = targetUser.userid;
			var avatar = (isNaN(targetUser.avatar) ? "http://" + serverIp + ":" + Config.port + "/avatars/" + targetUser.avatar : "http://play.pokemonshowdown.com/sprites/trainers/" + targetUser.avatar + ".png");
		}

    	if (Users.usergroups[userid]) {
			var userGroup = Users.usergroups[userid].substr(0,1);
			for (var u in Config.grouplist) {
				if (Config.grouplist[u].symbol && Config.grouplist[u].symbol === userGroup) userGroup = Config.grouplist[u].name;
			}
		} else {
			var userGroup = 'Regular User';
		}

		var self = this;
			var options = {
				host: "pokemonshowdown.com",
				port: 80,
				path: "/users/" + userid
			};

			var content = "";
			var req = http.request(options, function(res) {

				res.setEncoding("utf8");
				res.on("data", function (chunk) {
					content += chunk;
				});
				res.on("end", function () {
					content = content.split("<em");
					if (content[1]) {
						content = content[1].split("</p>");
						if (content[0]) {
							content = content[0].split("</em>");
							if (content[1]) {
								regdate = content[1].trim();
								showProfile();
							}
						}
					} else {
						regdate = '(Unregistered)';
						showProfile();
					}
				});
			});
			req.end();

			function showProfile() {
				//if (!lastOnline) lastOnline = "Never";
				var profile = '';
				profile += '<img src="' + avatar + '" height=80 width=80 align=left>';
				profile += '&nbsp;<font color=#24678d><b>Name: </font><b><font color="' + hashColor(toId(username)) + '">' + Tools.escapeHTML(username) + '</font></b><br />';
				profile += '&nbsp;<font color=#24678d><b>Registered: </font></b>' + regdate + '<br />';
				if (!Users.vips[userid]) profile += '&nbsp;<font color=#24678d><b>Rank: </font></b>' + userGroup + '<br />';
				if (Users.vips[userid]) profile += '&nbsp;<font color=#24568d><b>Rank: </font></b>' + userGroup + ' (<font color=#00CCFF><b>Shadowfire DEV</b></font>)<br />';
				//if (online) profile += '&nbsp;<font color=#24678d><b>Last Online: </font></b><font color=green>Currently Online</font><br />';
				//if (!online) profile += '&nbsp;<font color=#24678d><b>Last Online: </font></b>' + lastOnline + '<br />';
				profile += '<br clear="all">';
				self.sendReplyBox(profile);
				room.update();
			}
		
	},

	vipsymbol: function(target, room, user) {
	 	var bannedSymbols = ['!', '|', '?', '\u2030', '\u534D', '\u5350', '\u223C'];
	 	for (var u in Config.groups) if (Config.groups[u].symbol) bannedSymbols.push(Config.groups[u].symbol);
	 	if(!user.can('vip')) return this.sendReply('You need to buy this item from the shop to use.');
	 	if(!target || target.length > 1) return this.sendReply('/vipsymbol [symbol] - changes your symbol (usergroup) to the specified symbol. The symbol can only be one character. Rank needed to use this: Shadowfire DEV');
	 	if (target.match(/([a-zA-Z ^0-9])/g) || bannedSymbols.indexOf(target) >= 0) {
	 		return this.sendReply('This symbol is banned.');
	 	}
	 	user.getIdentity = function (roomid) {
			if (!roomid) roomid = 'lobby';
			if (this.locked) {
				return '?'+this.name;
			}
			if (roomid) {
				var room = Rooms.rooms[roomid];
				if (room.isMuted(this)) {
					return '!' + this.name;
				}
			}
		return target + this.name;
		}
	 	user.updateIdentity();
	 	user.canCustomSymbol = false;
	 	user.hasCustomSymbol = true;
	 	this.sendReply('Your symbol is now ' + target + '. It will be saved until you log off for more than an hour, or the server restarts. You can remove it with /resetsymbol and /showauth');

},

	economycode: function (target, room, user) {
		if (!this.canBroadcast()) return;
		this.sendReplyBox("Economy code by: <a href=\"https://gist.github.com/jd4564/d6e8f4140b7abc9295e1\">jd</a>");
	}
};

var colorCache = {};
hashColor = function (name) {
	name = toId(name);
    if (colorCache[name]) return colorCache[name];

    var hash = MD5(name);
    var H = parseInt(hash.substr(4, 4), 16) % 360;
    var S = parseInt(hash.substr(0, 4), 16) % 50 + 50;
    var L = parseInt(hash.substr(8, 4), 16) % 20 + 25;

    var rgb = hslToRgb(H, S, L);
    colorCache[name] = "#" + rgbToHex(rgb.r, rgb.g, rgb.b);
    return colorCache[name];
}

function hslToRgb(h, s, l) {
    var r, g, b, m, c, x

    if (!isFinite(h)) h = 0
    if (!isFinite(s)) s = 0
    if (!isFinite(l)) l = 0

    h /= 60
    if (h < 0) h = 6 - (-h % 6)
    h %= 6

    s = Math.max(0, Math.min(1, s / 100))
    l = Math.max(0, Math.min(1, l / 100))

    c = (1 - Math.abs((2 * l) - 1)) * s
    x = c * (1 - Math.abs((h % 2) - 1))

    if (h < 1) {
        r = c
        g = x
        b = 0
    } else if (h < 2) {
        r = x
        g = c
        b = 0
    } else if (h < 3) {
        r = 0
        g = c
        b = x
    } else if (h < 4) {
        r = 0
        g = x
        b = c
    } else if (h < 5) {
        r = x
        g = 0
        b = c
    } else {
        r = c
        g = 0
        b = x
    }

    m = l - c / 2
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return {
        r: r,
        g: g,
        b: b
    }
}

function rgbToHex(R, G, B) {
    return toHex(R) + toHex(G) + toHex(B)
}

function toHex(N) {
    if (N == null) return "00";
    N = parseInt(N);
    if (N == 0 || isNaN(N)) return "00";
    N = Math.max(0, N);
    N = Math.min(N, 255);
    N = Math.round(N);
    return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
}
