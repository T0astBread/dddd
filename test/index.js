const fs = require("fs")
const cp = require("child_process")
const axios = require("axios")
const { apiRequest, sleep } = require("../utils")


const log = (...args) => console.info("[TEST]", ...args);


(async () => {
	const apiToken = process.env.DO_API_TOKEN
	if(!apiToken)
		throw Error("API token not specified (DO_API_TOKEN env variable)")

	const testDomain = process.env.TEST_DOMAIN
	if(!testDomain)
		throw Error("Domain to test on not specified (TEST_DOMAIN env variable)")

	const config = {
		checkInterval: .5,
		records: [
			{
				domain: testDomain,
				names: [
					"@",
					"t",
					"t2"
				]
			}
		]
	}
	const configPath = `${process.cwd()}/config.json`
	fs.writeFileSync(configPath, JSON.stringify(config))
	log("Created config")

	log("Getting public IP")
	const publicIP = (await axios.get("https://checkip.amazonaws.com"))
		.data
		.replace(/\n$/, "")
	log("Public IP is", publicIP)

	
	log("Starting dddd process")

	const dddd = cp.spawn(`${process.cwd()}/../index.js`, [configPath], {
		stdio: [null, process.stdout, process.stderr]
	})


	try {
		await sleep(10)

		log("Checking if first pass worked")
		
		const records1 = (await apiRequest(apiToken, {
			method: "GET",
			url: `/domains/${testDomain}/records`
		})).domain_records

		log("Records in first pass:", records1)

		if(!records1.find(r =>
			r.type === "A" &&
			r.name === "@" &&
			r.data === publicIP))
			throw Error("@ record was not found in first pass")

		const t = records1.find(r =>
			r.type === "A" &&
			r.name === "t" &&
			r.data === publicIP)
		if(!t)
			throw Error("t record was not found in first pass")

		const t2 = records1.find(r =>
			r.type === "A" &&
			r.name === "t2" &&
			r.data === publicIP)
		if(!t2)
			throw Error("t2 record was not found in first pass")

		log("First pass looks good")


		log("Messing up records")

		await apiRequest(apiToken, {
			method: "DELETE",
			url: `/domains/${testDomain}/records/${t.id}`
		})

		await apiRequest(apiToken, {
			method: "PUT",
			url: `/domains/${testDomain}/records/${t2.id}`,
			data: {
				type: "A",
				name: "t2",
				data: "127.0.0.1",
			}
		})


		await sleep(30)
		
		log("Checking if second pass worked")

		const records2 = (await apiRequest(apiToken, {
			method: "GET",
			url: `/domains/${testDomain}/records`
		})).domain_records

		log("Records in second pass:", records2)

		if(!records2.find(r =>
			r.type === "A" &&
			r.name === "@" &&
			r.data === publicIP))
			throw Error("@ record was not found in second pass")

		if(!records2.find(r =>
			r.type === "A" &&
			r.name === "t" &&
			r.data === publicIP))
			throw Error("t record was not found in second pass")

		if(!records2.find(r =>
			r.type === "A" &&
			r.name === "t2" &&
			r.data === publicIP))
			throw Error("t2 record was not found in second pass")


		log("Second pass looks good")
		log("Updates work ✔️ ")
	
	} finally {
		log("Killing dddd process")
		dddd.kill()
	}


	log("Killing works ✔️ ")
})()
