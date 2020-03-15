const axios = require("axios").default


const DO_API_URL = "https://api.digitalocean.com/v2"

const apiRequest = (apiToken, request) => {
	console.info("API", request)

	return axios.request({
		...request,
		url: `${DO_API_URL}${request.url}`,
		headers: {
			Authorization: `Bearer ${apiToken}`
		}
	}).then(r => {
		console.info("API (limit/hour, remaining, reset)",
			r.headers["ratelimit-limit"],
			r.headers["ratelimit-remaining"],
			r.headers["ratelimit-reset"])
		return r.data
	})
}


const sleep = timeout => new Promise(r => setTimeout(r, timeout * 1000))


module.exports = {
	apiRequest,
	sleep,
}
