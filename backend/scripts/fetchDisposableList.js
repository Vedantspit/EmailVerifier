/**
 * Script to fetch and format disposable email domains list
 * Run this script to create/update data/lists/disposableDomainsList.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_URL = 'https://rawcdn.githack.com/disposable/disposable-email-domains/master/domains.json';
const OUTPUT_FILE = path.join(__dirname, '../data/lists/disposableDomainsList.js');

async function fetchList() {
	return new Promise((resolve, reject) => {
		https.get(API_URL, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				try {
					const domains = JSON.parse(data);
					resolve(domains);
				} catch (error) {
					reject(error);
				}
			});
		}).on('error', (error) => {
			reject(error);
		});
	});
}

async function main() {
	try {
		console.log('Fetching disposable email domains list...');
		const domains = await fetchList();

		console.log(`Fetched ${domains.length} domains`);

		// Create file content
		const fileContent = `/**
 * Disposable email domains list
 * Auto-generated from: ${API_URL}
 * Last updated: ${new Date().toISOString()}
 * Total domains: ${domains.length}
 */
const disposableDomainsList = new Set(${JSON.stringify(domains, null, '\t')});

module.exports = disposableDomainsList;
`;

		// Write to file
		fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');

		console.log(`✅ Successfully created ${OUTPUT_FILE}`);
		console.log(`   Total domains: ${domains.length}`);
	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

main();
