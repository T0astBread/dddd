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
	}).then(r => r.data)
}


const sleep = timeout => new Promise(r => setTimeout(r, timeout * 1000))


module.exports = {
	apiRequest,
	sleep,
}
