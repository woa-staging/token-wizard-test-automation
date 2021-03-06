const logger = require('../entity/Logger.js').logger;
const fs = require('fs');
const Crowdsale = require('../entity/Crowdsale.js').Crowdsale;
const Tier = require('./Tier.js').Tier;

class DutchAuction extends Crowdsale {

	constructor() {
		super();
		this.totalSupply;
	}

	async parser(fileName) {
		let obj = JSON.parse(fs.readFileSync(fileName, "utf8"));
		this.name = obj.name;
		this.ticker = obj.ticker;
		this.decimals = obj.decimals;
		this.totalSupply = obj.totalSupply;
		this.walletAddress = obj.walletAddress;
		this.gasPrice = obj.gasprice;
		this.tiers = obj.tiers;
		this.burnExcess = obj.burnExcess;
	}

	print() {
		logger.info("DutchAuction parameters ");
		logger.info("name :" + this.name);
		logger.info("ticker :" + this.ticker);
		logger.info("decimals :" + this.decimals);
		logger.info("totalSupply :" + this.totalSupply);
		logger.info("walletAddress :" + this.walletAddress);
		logger.info("gasPrice :" + this.gasPrice);
		logger.info("gasPrice :" + this.gasPrice);
		logger.info("burnExcess :" + this.burnExcess);

		for (let i = 0; i < this.tiers.length; i++) {
			logger.info("isWhitelisted #:" + i + this.tiers[i].isWhitelisted);
			logger.info("startDate #" + i + ": " + this.tiers[i].startDate);
			logger.info("startTime #" + i + ": " + this.tiers[i].startTime);
			logger.info("endDate #" + i + ": " + this.tiers[i].endDate);
			logger.info("endTime #" + i + ": " + this.tiers[i].endTime);
			logger.info("minRate #" + i + ": " + this.tiers[i].minRate);
			logger.info("minRate #" + i + ": " + this.tiers[i].minRate);
			logger.info("maxRate  #" + i + ": " + this.tiers[i].maxRate);
			logger.info("supply  #" + i + ": " + this.tiers[i].supply);
		}
	}
}

module.exports.DutchAuction = DutchAuction;