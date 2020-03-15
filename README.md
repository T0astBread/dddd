# dddd
![Tests](https://github.com/T0astBread/dddd/workflows/Tests/badge.svg)

is the _DigitalOcean Dynamic DNS Daemon_.

It's a small tool to keep your A records on DigitalOcean updated with
your server's IP address if your ISP doesn't give you a static
address. At the moment it can only handle IPv4 and A records.

## Usage

`dddd <config-file>`

Where config-file is a JSON file of the following format:

```json
{
	"checkInterval": 5,
	"records": [
		{
			"domain": "example.com",
			"names": [
				"@",
				"www",
				"whatever",
			]
		}
	]
}
```

`checkInterval` is the time dddd waits after an update has been
completed and before a new update is started.

`records` contains the DNS records you want to have updated. Existing
records not listed here are not touched. Nonexistent records will be
created.

`records.*.domain` is the domain you have added to your DigitalOcean
project (without any subdomains).

`records.*.names` are the subdomains to be updated.

Additionally the __DO_API_TOKEN environment variable__ needs to be
set to a read/write DigitalOcean API token. You can generate one on
the `Manage > API > Tokens/Keys` page at
[cloud.digitalocean.com](https://cloud.digitalocean.com).
