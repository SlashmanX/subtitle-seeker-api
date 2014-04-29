var request = require("request");
var URI = require("URIjs");
var async = require("async");
var cheerio = require("cheerio");
var xml2json = require("./lib/xml2json");
var opensrt = require("../OpenSRTJS/opensrt");

var API_KEY = "24430affe80bea1edf0e8413c3abf372a64afff2";
var API_ENDPOINT = "http://api.subtitleseeker.com/get/title_subtitles/"

exports.getSubtitlesForEpisode = function(data, cb) {
	var imdb_id = data.imdb_id.replace('tt', '');
	var languages = (data.languages ? data.languages.join() : '');
	var uri = URI(API_ENDPOINT)
				.addSearch("api_key", API_KEY)
				.addSearch("imdb", imdb_id)
				.addSearch("season", data.season)
				.addSearch("episode", data.episode)
				.addSearch("max_results", 100)
				.addSearch("language", languages)
				.addSearch("order_by", "downloads")
				.addSearch("return_type", "json");

	request(uri.toString(), function(err, res, data) {
		if(err || !data) return cb(err, null);
		data = JSON.parse(data);
		var subsArray = data.results.items;
		console.log(subsArray);
		var subs = [];
		// In Series as it's sorted by popularity anyway
		async.eachSeries(subsArray,
			function(sub, callback) {
				if(sub.site != "Opensubtitles.org") return callback(); // For now just get Open Subtitles
				if(subs[sub.language]) {
					return callback();
				}
				subs[sub.language] = {url: sub.url, site: sub.site};
				return callback();
			},
			function(err) {
				if(err) return cb(err, null);
				return cb(null, subs);
			});
	});
},

exports.getSRT = function(sub, cb) {
	request(sub.url, function(err, res, body) {
		if(err || !body) return cb(err, null);
		var $ = cheerio.load(body);
		var link = $('a.blue[target="_blank"]').attr('href');

		if(sub.site == "Opensubtitles.org") {
			var sub_id = link.match(/\/subtitles\/(.*)\/(.*)/)[1];
			opensrt.getSRTFromURL({subs: [sub_id]}, function(err, srt) {
				if(err) return cb(err, null);
				return cb(null, srt);
			})
		}
	})
}