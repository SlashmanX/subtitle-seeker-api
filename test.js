var api = require("./subtitle-seeker");

api.getSubtitlesForEpisode({imdb_id: "tt1480684", season: 1, episode: 1}, function(err, subs){
	if(err) return console.error(err);
	console.log(subs);
})