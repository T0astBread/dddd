const fs = require("fs")
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


const updateDNS = async (config, apiToken) => {
	console.info("UPDATING RECORDS", new Date())

	console.info("Getting public IP address")
	const publicIP = (await axios.get("https://checkip.amazonaws.com"))
		.data
		.replace(/\n$/, "")
	console.info("Public IP is", publicIP)
	if(!(/\d{0,3}(\.\d{0,3}){3}/.test(publicIP))) {
		console.error("This does not look like an IPv4 address - panic")
		throw Error("ipGetError")
	}

	const domains = config.records.map(r => r.domain)
	const existingRecords = (await Promise.all(domains
		.map(async domain => {
			const records = (await apiRequest(apiToken, {
				method: "GET",
				url: `/domains/${domain}/records`
			})).domain_records
			return records
				.filter(r => r.type === "A")
				.map(r => ({
					...r,
					domain,
				}))
		}))).flat()
	console.info("Existing records:", existingRecords)

	const flatRecords = config.records.flatMap(r =>
		r.names.map(name => ({
			domain: r.domain,
			name,
		})))

	for(const record of flatRecords) {
		console.info("Updating", record)

		const existingRecord = existingRecords.find(r =>
			r.domain === record.domain &&
			r.name === record.name)

		if(existingRecord) {
			console.info("Record exists")
			if(existingRecord.data !== publicIP) {
				console.info("Record is outdated - updating...")
				await apiRequest(apiToken, {
					method: "PUT",
					url: `/domains/${record.domain}/records/${existingRecord.id}`,
					data: {
						type: existingRecord.type,
						name: record.name,
						data: publicIP,
					}
				})
			} else {
				console.info("Record is already up-to-date")
			}
		} else {
			console.info("Record does not exist - creating...")
			await apiRequest(apiToken, {
				method: "POST",
				url: `/domains/${record.domain}/records`,
				data: {
					type: "A",
					name: record.name,
					data: publicIP,
					priority: null,
					port: null,
					ttl: 1800,
					weight: null,
					flags: null,
					tag: null
				}
			})
		}
	}

	console.info("UPDATE COMPLETE", new Date())
}


const run = async () => {
	const apiToken = process.env.DO_API_TOKEN

	const configPath = process.argv[2]
	const configText = fs.readFileSync(configPath, {
		encoding: "UTF-8"
	})
	console.info("Config", configText)
	const config = JSON.parse(configText)

	while(true) {
		updateDNS(config, apiToken)
		await new Promise(r => setTimeout(r, Math.floor(config.checkInterval * 60 * 1000)))
	}
}
run()


/*

Config format:

{
	checkInterval: 5,
	records: [
		{
			domain: "example.com",
			names: [
				"@",
				"www",
				"blog",
				"whatever"
			]
		}
	]
}

checkInterval is in minutes but can have floating point numbers

*/
